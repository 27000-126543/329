import { v4 as uuidv4 } from 'uuid';
import type {
  Alert,
  AlertLevel,
  AlertStatus,
  SimulationTask,
  MonitorDataPoint,
  PaginatedResponse,
  User,
} from '../../shared/types.js';
import { db } from '../db/store.js';

function isoNow(): string {
  return new Date().toISOString();
}

function rand(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

function stdDev(values: number[]): number {
  if (values.length === 0) return 0;
  const n = values.length;
  const mean = values.reduce((a, b) => a + b, 0) / n;
  const squaredDiffs = values.map((v) => Math.pow(v - mean, 2));
  return Math.sqrt(squaredDiffs.reduce((a, b) => a + b, 0) / n);
}

function isDuplicateAlert(
  existingAlerts: Alert[],
  taskId: string,
  type: Alert['type'],
  affectedRegion: string,
): boolean {
  const now = Date.now();
  const thirtyMinutesMs = 30 * 60 * 1000;
  return existingAlerts.some((a) => {
    if (a.taskId !== taskId || a.type !== type || a.affectedRegion !== affectedRegion) return false;
    if (a.status !== 'pending' && a.status !== 'reviewed') return false;
    const triggeredTime = new Date(a.triggeredAt).getTime();
    return now - triggeredTime < thirtyMinutesMs;
  });
}

interface AlertCheckContext {
  maxShearThreshold?: number;
  slipRateThreshold?: number;
  convergenceThreshold?: number;
}

export class AlertService {
  static list(params?: {
    level?: AlertLevel;
    status?: AlertStatus;
    taskId?: string;
    page?: number;
    pageSize?: number;
  }): PaginatedResponse<Alert> {
    const page = params?.page ?? 1;
    const pageSize = params?.pageSize ?? 20;
    let data = db.getAll('alerts');
    if (params?.level) data = data.filter((a) => a.level === params.level);
    if (params?.status) data = data.filter((a) => a.status === params.status);
    if (params?.taskId) data = data.filter((a) => a.taskId === params.taskId);
    data.sort((a, b) => +new Date(b.triggeredAt) - +new Date(a.triggeredAt));
    const total = data.length;
    const start = (page - 1) * pageSize;
    return {
      data: data.slice(start, start + pageSize),
      total,
      page,
      pageSize,
    };
  }

  static getById(id: string): Alert | undefined {
    return db.getById('alerts', id);
  }

  static review(
    id: string,
    reviewer: User,
    params: {
      action: Alert['reviewAction'];
      comment: string;
      newStatus?: AlertStatus;
    },
  ): Alert | undefined {
    const updated = db.update('alerts', id, (prev) => ({
      ...prev,
      status: params.newStatus ?? 'reviewed',
      reviewerId: reviewer.id,
      reviewedAt: isoNow(),
      reviewComment: params.comment,
      reviewAction: params.action,
    }));
    if (!updated) return undefined;
    if (params.action === 'adjust_friction' || params.action === 'adjust_pore') {
      this.applyAdjustmentToTask(id, params.action);
    }
    return db.getById('alerts', id);
  }

  private static applyAdjustmentToTask(
    alertId: string,
    action: 'adjust_friction' | 'adjust_pore',
  ): void {
    const alert = db.getById('alerts', alertId);
    if (!alert) return;
    db.update('tasks', alert.taskId, (prev) => {
      const bc = { ...prev.boundaryConditions };
      const rp = { ...prev.rockParams };
      if (action === 'adjust_friction') {
        rp.frictionCoefficient = +(rp.frictionCoefficient * 1.08).toFixed(3);
      } else {
        bc.porePressure = +(bc.porePressure * 0.92).toFixed(2);
      }
      return { ...prev, boundaryConditions: bc, rockParams: rp, updatedAt: isoNow() };
    });
  }

  static checkAndTrigger(
    taskId: string,
    ctx: AlertCheckContext = {},
  ): Alert[] {
    const task = db.getById('tasks', taskId);
    if (!task) return [];
    const monitorPts = db.getMonitorPoints(taskId);
    const latest = monitorPts[monitorPts.length - 1] ?? this.syntheticPoint(task);
    const candidates: Array<{
      type: Alert['type'];
      threshold: number;
      actual: number;
      region: string;
      desc: string;
    }> = [];
    const maxShearTh = ctx.maxShearThreshold ?? 45;
    if (latest.maxShearStress > maxShearTh) {
      candidates.push({
        type: 'shear_exceed',
        threshold: maxShearTh,
        actual: latest.maxShearStress,
        region: this.pickRegion(task),
        desc: '最大剪应力超过摩擦强度阈值，存在滑动触发风险',
      });
    }
    const slipTh = ctx.slipRateThreshold ?? 8;
    if (latest.slipRate > slipTh) {
      candidates.push({
        type: 'slip_anomaly',
        threshold: slipTh,
        actual: latest.slipRate,
        region: this.pickRegion(task),
        desc: '滑动速率异常升高，建议复核孔隙压力',
      });
    }
    if (monitorPts.length > 5) {
      const convTh = ctx.convergenceThreshold ?? 0.001;
      const last5 = monitorPts.slice(-5);
      const changeRates: number[] = [];
      for (let i = 1; i < last5.length; i++) {
        const prev = last5[i - 1].maxShearStress;
        const curr = last5[i].maxShearStress;
        if (Math.abs(prev) > 1e-9) {
          changeRates.push(Math.abs((curr - prev) / prev));
        }
      }
      const conv = stdDev(changeRates);
      if (conv > convTh) {
        candidates.push({
          type: 'convergence_warning',
          threshold: convTh,
          actual: +conv.toFixed(6),
          region: this.pickRegion(task),
          desc: '残差收敛速度下降，迭代步数超出上限',
        });
      }
    }
    if (candidates.length === 0) return [];
    const existingAlerts = db.getAll('alerts');
    const results: Alert[] = [];
    for (const c of candidates) {
      if (isDuplicateAlert(existingAlerts, taskId, c.type, c.region)) continue;
      const alert = this.createAlert(task, c.type, c.threshold, c.actual, c.region, c.desc);
      results.push(alert);
    }
    return results;
  }

  private static syntheticPoint(task: SimulationTask): MonitorDataPoint {
    const frictionBase = task.rockParams.cohesion + task.rockParams.frictionCoefficient * 30;
    return {
      timestamp: isoNow(),
      maxShearStress: frictionBase * rand(1.0, 1.3),
      coulombStressChange: rand(-5, 10),
      slipRate: rand(3, 10),
      frictionStrength: frictionBase,
      temperature: task.boundaryConditions.temperature,
    };
  }

  private static pickRegion(task: SimulationTask): string {
    const fault = db.getById('faults', task.faultId);
    const regions = fault
      ? ['北段上部-0km~5km', '中段-8km~12km', '南段深部-20km~30km', `${fault.name}交汇区`]
      : ['中段-8km~12km', '北段上部', '南段深部', '断裂交汇区'];
    return regions[Math.floor(Math.random() * regions.length)];
  }

  static createAlert(
    task: SimulationTask,
    type: Alert['type'],
    thresholdValue: number,
    actualValue: number,
    affectedRegion: string,
    description: string,
  ): Alert {
    const ratio = actualValue / Math.max(thresholdValue, 1e-6);
    let level: AlertLevel = 'level3';
    if (ratio >= 1.5) level = 'level1';
    else if (ratio >= 1.2) level = 'level2';
    const alert: Alert = {
      id: `alert-${uuidv4().slice(0, 8)}`,
      taskId: task.id,
      taskName: task.name,
      level,
      status: 'pending',
      type,
      triggeredAt: isoNow(),
      thresholdValue,
      actualValue: +actualValue.toFixed(3),
      affectedRegion,
      description,
    };
    db.insert('alerts', alert.id, alert);
    db.update('tasks', task.id, (prev) => ({
      ...prev,
      alertCount: prev.alertCount + 1,
      updatedAt: isoNow(),
    }));
    return alert;
  }

  static countByStatus() {
    const all = db.getAll('alerts');
    return {
      total: all.length,
      pending: all.filter((a) => a.status === 'pending').length,
      reviewed: all.filter((a) => a.status === 'reviewed').length,
      ignored: all.filter((a) => a.status === 'ignored').length,
      level1: all.filter((a) => a.level === 'level1').length,
      level2: all.filter((a) => a.level === 'level2').length,
      level3: all.filter((a) => a.level === 'level3').length,
    };
  }
}

export default AlertService;
