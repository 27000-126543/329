import { v4 as uuidv4 } from 'uuid';
import type {
  DeviationRecord,
  Fault,
  SimulationTask,
  SimulationReport,
  User,
  PaginatedResponse,
} from '../../shared/types.js';
import { db } from '../db/store.js';

function isoNow(): string {
  return new Date().toISOString();
}

function rand(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

const DEVIATION_THRESHOLD = 0.2;
const CONSECUTIVE_TRIGGER = 3;

export class DeviationService {
  static list(params?: {
    faultId?: string;
    status?: 'active' | 'resolved';
    page?: number;
    pageSize?: number;
  }): PaginatedResponse<DeviationRecord> {
    const page = params?.page ?? 1;
    const pageSize = params?.pageSize ?? 20;
    let data = db.getAll('deviations');
    if (params?.faultId) data = data.filter((d) => d.faultId === params.faultId);
    if (params?.status) data = data.filter((d) => d.status === params.status);
    data.sort((a, b) => +new Date(b.triggerTime) - +new Date(a.triggerTime));
    const total = data.length;
    const start = (page - 1) * pageSize;
    return {
      data: data.slice(start, start + pageSize),
      total,
      page,
      pageSize,
    };
  }

  static getById(id: string): DeviationRecord | undefined {
    return db.getById('deviations', id);
  }

  static getByFault(faultId: string): DeviationRecord[] {
    return db
      .find('deviations', (d) => d.faultId === faultId)
      .sort((a, b) => +new Date(b.triggerTime) - +new Date(a.triggerTime));
  }

  static checkFault(fault: Fault): DeviationRecord | null {
    const tasks = db
      .find('tasks', (t) => t.faultId === fault.id)
      .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
    if (tasks.length < CONSECUTIVE_TRIGGER) return null;
    const latest = tasks.slice(0, CONSECUTIVE_TRIGGER);
    const reports = latest
      .map((t) => db.getById('reports', t.id) as SimulationReport | undefined)
      .filter((r): r is SimulationReport => !!r);
    if (reports.length < CONSECUTIVE_TRIGGER) {
      return this.syntheticCheck(fault, latest);
    }
    const slips = reports.map((r) => r.summary.maxSlipPotential);
    const avg = slips.reduce((a, b) => a + b, 0) / slips.length;
    const deviations = slips.map((s) => Math.abs(s - avg) / Math.max(avg, 0.001));
    const over = deviations.filter((d) => d > DEVIATION_THRESHOLD).length;
    if (over < CONSECUTIVE_TRIGGER) return null;
    return this.createRecord(fault, latest, deviations);
  }

  private static syntheticCheck(fault: Fault, tasks: SimulationTask[]): DeviationRecord | null {
    const deviations = tasks.map(() => DEVIATION_THRESHOLD + rand(0.02, 0.2));
    if (deviations.filter((d) => d > DEVIATION_THRESHOLD).length < CONSECUTIVE_TRIGGER) return null;
    return this.createRecord(fault, tasks, deviations);
  }

  private static createRecord(
    fault: Fault,
    tasks: SimulationTask[],
    slipDeviations: number[],
  ): DeviationRecord {
    const record: DeviationRecord = {
      id: `dev-${uuidv4().slice(0, 8)}`,
      faultId: fault.id,
      triggerTime: isoNow(),
      taskIds: tasks.map((t) => t.id),
      slipDeviations: slipDeviations.map((d) => +d.toFixed(4)),
      maxDeviation: +Math.max(...slipDeviations).toFixed(4),
      status: 'active',
    };
    db.insert('deviations', record.id, record);
    db.update('faults', fault.id, (prev) => ({
      ...prev,
      isPaused: true,
      pauseReason: `连续${CONSECUTIVE_TRIGGER}次滑动量预测偏差超过${Math.round(
        DEVIATION_THRESHOLD * 100,
      )}%，自动触发暂停`,
      pausedAt: isoNow(),
    }));
    return record;
  }

  static resolve(
    id: string,
    resolver: User,
    resolutionNote: string,
    resumeFault = true,
  ): DeviationRecord | undefined {
    const record = db.getById('deviations', id);
    if (!record) return undefined;
    db.update('deviations', id, (prev) => ({
      ...prev,
      status: 'resolved' as const,
      resolvedBy: resolver.id,
      resolvedAt: isoNow(),
      resolutionNote,
    }));
    if (resumeFault) {
      db.update('faults', record.faultId, (prev) => ({
        ...prev,
        isPaused: false,
        pauseReason: undefined,
        pausedAt: undefined,
      }));
    }
    return db.getById('deviations', id);
  }

  static getActiveCount(): number {
    return db.count('deviations', (d) => d.status === 'active');
  }
}

export default DeviationService;
