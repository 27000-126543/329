import { v4 as uuidv4 } from 'uuid';
import type {
  SimulationTask,
  TaskStatus,
  StatusRecord,
  TaskListQuery,
  PaginatedResponse,
  MonitorDataPoint,
  FileInfo,
  BoundaryConditions,
  RockMechanicsParams,
  AdjustmentLog,
  MeshInfo,
  User,
} from '../../shared/types.js';
import { db } from '../db/store.js';
import { AlertService } from './AlertService.js';

const STATE_FLOW: TaskStatus[] = [
  'pending_verify',
  'mesh_generating',
  'initializing',
  'stress_computing',
  'slip_evaluating',
  'completed',
];

const STEP_DESCRIPTIONS: Record<TaskStatus, string> = {
  pending_verify: '文件格式与参数完整性校验中',
  mesh_generating: '三维有限元网格生成',
  initializing: '初始应力场加载与边界条件施加',
  stress_computing: '全应力场迭代求解（Newton-Raphson）',
  slip_evaluating: '断层滑动势函数与库仑破裂准则评估',
  completed: '模拟计算完成，等待审批',
  rollback: '异常回退处理',
  postdoc_approved: '博士后数值稳定性验证通过',
  professor_approved: '教授物理合理性确认通过',
  published: '结果已推送至评估组',
};

const STEP_PROGRESS_RANGE: Record<string, [number, number]> = {
  pending_verify: [0, 5],
  mesh_generating: [5, 35],
  initializing: [35, 50],
  stress_computing: [50, 82],
  slip_evaluating: [82, 98],
};

function isoNow(): string {
  return new Date().toISOString();
}

function rand(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

export class TaskService {
  static list(query: TaskListQuery = {}): PaginatedResponse<SimulationTask> {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    let data = db.getAll('tasks');
    if (query.status) {
      data = data.filter((t) => t.status === query.status);
    }
    if (query.faultId) {
      data = data.filter((t) => t.faultId === query.faultId);
    }
    if (query.creatorId) {
      data = data.filter((t) => t.creatorId === query.creatorId);
    }
    data.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
    const total = data.length;
    const start = (page - 1) * pageSize;
    return {
      data: data.slice(start, start + pageSize),
      total,
      page,
      pageSize,
    };
  }

  static getById(id: string): SimulationTask | undefined {
    return db.getById('tasks', id);
  }

  static create(params: {
    name: string;
    faultId: string;
    faultName: string;
    creator: User;
    geometryFile: FileInfo;
    boundaryConditions: BoundaryConditions;
    rockParams: RockMechanicsParams;
  }): SimulationTask {
    const now = isoNow();
    const id = `task-${Date.now().toString().slice(-6)}`;
    const task: SimulationTask = {
      id,
      name: params.name,
      faultId: params.faultId,
      faultName: params.faultName,
      creatorId: params.creator.id,
      creatorName: params.creator.name,
      status: 'pending_verify',
      statusHistory: [
        {
          status: 'pending_verify',
          timestamp: now,
          operator: params.creator.id,
          remark: '任务创建提交',
        },
      ],
      createdAt: now,
      updatedAt: now,
      geometryFile: params.geometryFile,
      boundaryConditions: params.boundaryConditions,
      rockParams: params.rockParams,
      progress: 0,
      currentStep: STEP_DESCRIPTIONS.pending_verify,
      alertCount: 0,
      adjustmentLogs: [],
    };
    db.insert('tasks', id, task);
    setTimeout(() => this.autoAdvance(id), 800);
    return task;
  }

  static updateStatus(
    id: string,
    nextStatus: TaskStatus,
    operatorId?: string,
    remark?: string,
  ): SimulationTask | undefined {
    const task = db.getById('tasks', id);
    if (!task) return undefined;
    const updated = db.update('tasks', id, (prev) => {
      const record: StatusRecord = {
        status: nextStatus,
        timestamp: isoNow(),
        operator: operatorId ?? prev.creatorId,
        remark,
      };
      const progress = this.computeProgress(nextStatus, prev.progress);
      return {
        ...prev,
        status: nextStatus,
        statusHistory: [...prev.statusHistory, record],
        updatedAt: isoNow(),
        progress,
        currentStep: STEP_DESCRIPTIONS[nextStatus] ?? prev.currentStep,
      };
    });
    if (!updated) return undefined;
    return db.getById('tasks', id);
  }

  static computeProgress(status: TaskStatus, current: number): number {
    const range = STEP_PROGRESS_RANGE[status];
    if (!range) {
      if (['completed', 'postdoc_approved', 'professor_approved', 'published'].includes(status))
        return 100;
      if (status === 'rollback') return Math.max(current - 10, 0);
      return current;
    }
    const target = rand(range[0], range[1]);
    return Math.round(target * 10) / 10;
  }

  static autoAdvance(id: string): void {
    const task = db.getById('tasks', id);
    if (!task) return;
    const idx = STATE_FLOW.indexOf(task.status);
    if (idx < 0 || idx >= STATE_FLOW.length - 1) return;
    if (task.status === 'rollback') return;
    const nextStatus = STATE_FLOW[idx + 1];
    this.updateStatus(id, nextStatus, 'SYSTEM', `自动进入${STEP_DESCRIPTIONS[nextStatus]}`);
    if (nextStatus === 'mesh_generating') {
      this.generateMesh(id);
    }
    if (nextStatus === 'stress_computing' || nextStatus === 'slip_evaluating') {
      this.simulateTick(id);
      AlertService.checkAndTrigger(id);
    }
    const delay =
      nextStatus === 'mesh_generating'
        ? 2500
        : nextStatus === 'stress_computing'
          ? 1800
          : nextStatus === 'slip_evaluating'
            ? 2200
            : 1200;
    setTimeout(() => this.autoAdvance(id), delay);
  }

  static generateMesh(id: string): void {
    db.update('tasks', id, (prev) => {
      const mesh: MeshInfo = {
        nodeCount: Math.floor(rand(80000, 250000)),
        elementCount: Math.floor(rand(500000, 1500000)),
        qualityScore: Math.round(rand(82, 97) * 10) / 10,
        minAngle: +rand(22, 48).toFixed(1),
      };
      return { ...prev, meshInfo: mesh, updatedAt: isoNow() };
    });
  }

  static simulateTick(id: string): void {
    const task = db.getById('tasks', id);
    if (!task) return;
    const computeStates: TaskStatus[] = ['stress_computing', 'slip_evaluating', 'completed'];
    if (!computeStates.includes(task.status)) return;
    const points = this.generateMonitorPoints(task, 1);
    db.appendMonitorPoints(id, points);
    if (task.status !== 'completed') {
      setTimeout(() => this.simulateTick(id), 1500);
    }
  }

  static generateMonitorPoints(task: SimulationTask, count: number): MonitorDataPoint[] {
    const nowTs = Date.now();
    const out: MonitorDataPoint[] = [];
    const frictionBase = task.rockParams.cohesion + task.rockParams.frictionCoefficient * 30;
    for (let i = 0; i < count; i++) {
      const phase = (nowTs / 1000 + i) * 0.1;
      const shear = frictionBase * 0.85 + Math.sin(phase) * (frictionBase * 0.15) + rand(-3, 3);
      out.push({
        timestamp: new Date(nowTs + i * 1000).toISOString(),
        maxShearStress: +shear.toFixed(3),
        coulombStressChange: +(rand(-6, 10) + Math.sin(phase * 0.8) * 4).toFixed(3),
        slipRate: +(4 + Math.cos(phase * 1.2) * 1.8 + rand(-0.4, 0.4)).toFixed(3),
        frictionStrength: +(frictionBase + rand(-1, 1)).toFixed(2),
        temperature: +(task.boundaryConditions.temperature + rand(-2, 2)).toFixed(1),
      });
    }
    return out;
  }

  static getMonitorData(id: string): {
    points: MonitorDataPoint[];
    latest?: MonitorDataPoint;
  } {
    const points = db.getMonitorPoints(id);
    return {
      points,
      latest: points[points.length - 1],
    };
  }

  static deleteDraft(id: string): boolean {
    const task = db.getById('tasks', id);
    if (!task || task.status !== 'pending_verify') return false;
    db.remove('tasks', id);
    return true;
  }

  static addAdjustment(
    id: string,
    params: {
      operatorId: string;
      alertId?: string;
      paramChanges: Partial<RockMechanicsParams & BoundaryConditions>;
      reason: string;
    },
  ): SimulationTask | undefined {
    const log: AdjustmentLog = {
      id: uuidv4(),
      timestamp: isoNow(),
      operator: params.operatorId,
      alertId: params.alertId,
      paramChanges: params.paramChanges,
      reason: params.reason,
    };
    db.update('tasks', id, (prev) => {
      const merged = { ...prev };
      const bc: BoundaryConditions = { ...prev.boundaryConditions };
      const rp: RockMechanicsParams = { ...prev.rockParams };
      for (const key of Object.keys(params.paramChanges) as Array<
        keyof (RockMechanicsParams & BoundaryConditions)
      >) {
        const v = params.paramChanges[key];
        if (v !== undefined) {
          if (key in bc) (bc as unknown as Record<string, unknown>)[key] = v;
          if (key in rp) (rp as unknown as Record<string, unknown>)[key] = v;
        }
      }
      merged.boundaryConditions = bc;
      merged.rockParams = rp;
      merged.adjustmentLogs = [...prev.adjustmentLogs, log];
      merged.updatedAt = isoNow();
      return merged;
    });
    return db.getById('tasks', id);
  }

  static canTransitionTo(current: TaskStatus, next: TaskStatus): boolean {
    const c = current as string;
    const n = next as string;
    if (n === 'rollback') return !['published'].includes(c);
    if (c === 'pending_verify') return n === 'mesh_generating';
    if (c === 'mesh_generating') return n === 'initializing' || n === 'rollback';
    if (c === 'initializing') return n === 'stress_computing' || n === 'rollback';
    if (c === 'stress_computing')
      return n === 'slip_evaluating' || n === 'rollback';
    if (c === 'slip_evaluating') return n === 'completed' || n === 'rollback';
    if (c === 'completed') return n === 'postdoc_approved' || n === 'rollback';
    if (c === 'postdoc_approved') return n === 'professor_approved' || n === 'rollback';
    if (c === 'professor_approved') return n === 'published';
    if (c === 'published') return false;
    if (c === 'rollback') return ['pending_verify', 'mesh_generating'].includes(n);
    return false;
  }
}

export default TaskService;
