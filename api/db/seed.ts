import { v4 as uuidv4 } from 'uuid';
import type {
  User,
  Fault,
  SimulationTask,
  TaskStatus,
  Alert,
  AlertLevel,
  AlertStatus,
  ApprovalRecord,
  DailyStats,
  ParamRecommendation,
  DeviationRecord,
  MonitorDataPoint,
  SimulationReport,
  BoundaryConditions,
  RockMechanicsParams,
  FileInfo,
  StatusRecord,
} from '../../shared/types.js';
import { db } from './store.js';

const now = Date.now();
const DAY = 86400000;

function iso(offsetMs = 0): string {
  return new Date(now + offsetMs).toISOString();
}

function rand(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

function randInt(min: number, max: number): number {
  return Math.floor(rand(min, max + 1));
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function makeBoundaryConditions(): BoundaryConditions {
  return {
    northStress: +rand(20, 80).toFixed(2),
    eastStress: +rand(15, 60).toFixed(2),
    verticalStress: +rand(30, 100).toFixed(2),
    porePressure: +rand(5, 25).toFixed(2),
    temperature: +rand(15, 80).toFixed(1),
  };
}

function makeRockParams(): RockMechanicsParams {
  return {
    youngModulus: +rand(50, 90).toFixed(2),
    poissonRatio: +rand(0.18, 0.3).toFixed(3),
    cohesion: +rand(5, 25).toFixed(2),
    frictionCoefficient: +rand(0.4, 0.85).toFixed(3),
    dilationAngle: +rand(5, 20).toFixed(1),
    tensileStrength: +rand(2, 12).toFixed(2),
  };
}

function makeFileInfo(name: string, offsetMs = 0): FileInfo {
  return {
    id: uuidv4(),
    name,
    size: randInt(1024 * 50, 1024 * 1024 * 5),
    type: 'application/octet-stream',
    uploadedAt: iso(offsetMs),
  };
}

export function seedUsers(): User[] {
  const users: User[] = [
    { id: 'user-geologist', name: '张明远', role: 'geologist', email: 'zhang.my@geolab.cn', avatar: 'ZM' },
    { id: 'user-postdoc', name: '李思琪', role: 'postdoc', email: 'li.sq@geolab.cn', avatar: 'LS' },
    { id: 'user-professor', name: '王建国', role: 'professor', email: 'wang.jg@geolab.cn', avatar: 'WJ' },
    { id: 'user-chief', name: '陈海东', role: 'chief', email: 'chen.hd@geolab.cn', avatar: 'CH' },
    { id: 'user-assessor', name: '刘芳', role: 'assessor', email: 'liu.f@geolab.cn', avatar: 'LF' },
    { id: 'user-admin', name: '赵晓宇', role: 'admin', email: 'zhao.xy@geolab.cn', avatar: 'ZX' },
  ];
  for (const u of users) db.insert('users', u.id, u);
  return users;
}

export function seedFaults(): Fault[] {
  const data: Array<Partial<Fault> & { name: string; location: string }> = [
    { name: '龙门山断裂带', location: '四川盆地西部', lengthKm: 500, depthKm: 35, strike: 45, dip: 55, rake: 110, isPaused: false, simulationCount: 8 },
    { name: '郯庐断裂带', location: '山东-安徽段', lengthKm: 2400, depthKm: 40, strike: 20, dip: 70, rake: 170, isPaused: false, simulationCount: 12 },
    { name: '海原断裂带', location: '宁夏中部', lengthKm: 350, depthKm: 28, strike: 290, dip: 65, rake: 10, isPaused: true, pauseReason: '连续滑动量偏差超过阈值', pausedAt: iso(-3 * DAY), simulationCount: 5 },
    { name: '红河断裂带', location: '云南南部', lengthKm: 1000, depthKm: 32, strike: 315, dip: 50, rake: 160, isPaused: false, simulationCount: 6 },
    { name: '阿尔金断裂带', location: '青藏高原北缘', lengthKm: 1600, depthKm: 38, strike: 70, dip: 60, rake: 20, isPaused: false, simulationCount: 9 },
    { name: '鲜水河断裂带', location: '四川西部', lengthKm: 400, depthKm: 30, strike: 320, dip: 58, rake: 105, isPaused: false, simulationCount: 7 },
  ];
  const faults: Fault[] = data.map((f) => ({
    id: `fault-${f.name.slice(0, 2)}`,
    ...f,
    lastSimulationAt: f.isPaused ? undefined : iso(-randInt(1, 10) * DAY),
  })) as Fault[];
  for (const f of faults) db.insert('faults', f.id, f);
  return faults;
}

const ALL_STATUSES: TaskStatus[] = [
  'pending_verify',
  'mesh_generating',
  'initializing',
  'stress_computing',
  'slip_evaluating',
  'completed',
  'rollback',
  'postdoc_approved',
  'professor_approved',
  'published',
];

function buildStatusHistory(targetStatus: TaskStatus, createdMs: number): StatusRecord[] {
  const idx = ALL_STATUSES.indexOf(targetStatus);
  const history: StatusRecord[] = [];
  const stages: TaskStatus[] = [
    'pending_verify',
    'mesh_generating',
    'initializing',
    'stress_computing',
    'slip_evaluating',
    'completed',
    'postdoc_approved',
    'professor_approved',
    'published',
  ];
  for (let i = 0; i < stages.length; i++) {
    const s = stages[i];
    history.push({
      status: s,
      timestamp: new Date(createdMs + i * 3600000 * rand(0.5, 3)).toISOString(),
      operator: i === 0 ? 'user-geologist' : 'SYSTEM',
      remark: s === targetStatus ? '当前状态' : undefined,
    });
    if (s === targetStatus || (targetStatus === 'rollback' && i === idx)) break;
  }
  if (targetStatus === 'rollback') {
    history.push({
      status: 'rollback',
      timestamp: new Date(createdMs + (ALL_STATUSES.indexOf('rollback') + 1) * 3600000).toISOString(),
      operator: 'SYSTEM',
      remark: '参数异常触发回退',
    });
  }
  return history;
}

function progressForStatus(status: TaskStatus): number {
  const map: Record<TaskStatus, number> = {
    pending_verify: 0,
    mesh_generating: randInt(10, 40),
    initializing: randInt(40, 55),
    stress_computing: randInt(55, 80),
    slip_evaluating: randInt(80, 95),
    completed: 100,
    rollback: randInt(20, 60),
    postdoc_approved: 100,
    professor_approved: 100,
    published: 100,
  };
  return map[status];
}

function currentStepForStatus(status: TaskStatus): string {
  const map: Partial<Record<TaskStatus, string>> = {
    pending_verify: '文件格式与参数完整性校验中',
    mesh_generating: '三维有限元网格生成',
    initializing: '初始应力场加载',
    stress_computing: '全应力场迭代求解',
    slip_evaluating: '断层滑动势函数计算',
    completed: '模拟计算完成，等待审批',
    rollback: '异常回退处理',
  };
  return map[status] ?? '';
}

export function seedTasks(users: User[], faults: Fault[]): SimulationTask[] {
  const geologist = users.find((u) => u.role === 'geologist')!;
  const statuses: TaskStatus[] = [
    'published',
    'published',
    'professor_approved',
    'postdoc_approved',
    'completed',
    'completed',
    'stress_computing',
    'stress_computing',
    'slip_evaluating',
    'mesh_generating',
    'initializing',
    'rollback',
  ];
  const tasks: SimulationTask[] = [];
  for (let i = 0; i < statuses.length; i++) {
    const status = statuses[i];
    const fault = faults[i % faults.length];
    const createdMs = now - (30 - i * 2) * DAY - randInt(3600, 72000) * 1000;
    const taskId = `task-${String(i + 1).padStart(4, '0')}`;
    const task: SimulationTask = {
      id: taskId,
      name: `${fault.name}${['#A', '#B', '#C'][i % 3]}模拟任务-${2024 + i}`,
      faultId: fault.id,
      faultName: fault.name,
      creatorId: geologist.id,
      creatorName: geologist.name,
      status,
      statusHistory: buildStatusHistory(status, createdMs),
      createdAt: new Date(createdMs).toISOString(),
      updatedAt: new Date(createdMs + 3600000 * rand(5, 20)).toISOString(),
      geometryFile: makeFileInfo(`${fault.name.slice(0, 4)}_geometry_${i + 1}.vtk`, createdMs),
      boundaryConditions: makeBoundaryConditions(),
      rockParams: makeRockParams(),
      meshInfo: ['pending_verify', 'mesh_generating'].includes(status)
        ? undefined
        : {
            nodeCount: randInt(50000, 200000),
            elementCount: randInt(300000, 1200000),
            qualityScore: randInt(78, 98),
            minAngle: +rand(18, 45).toFixed(1),
          },
      progress: progressForStatus(status),
      currentStep: currentStepForStatus(status),
      alertCount: randInt(0, 4),
      adjustmentLogs: [],
    };
    tasks.push(task);
    db.insert('tasks', task.id, task);
  }
  return tasks;
}

export function seedAlerts(tasks: SimulationTask[], users: User[]): Alert[] {
  const types: Alert['type'][] = ['shear_exceed', 'slip_anomaly', 'convergence_warning'];
  const levels: AlertLevel[] = ['level1', 'level2', 'level3'];
  const statusPool: AlertStatus[] = ['pending', 'reviewed', 'reviewed', 'ignored'];
  const regions = ['断层中段-8km~12km', '北段上部-0km~5km', '南段深部-20km~30km', 'NE走向延伸段', '断裂交汇区'];
  const descs = [
    '最大剪应力超过摩擦强度阈值，存在滑动触发风险',
    '滑动速率异常升高，建议复核孔隙压力',
    '残差收敛速度下降，迭代步数超出上限',
    '库仑应力变化速率异常，需关注应力传递效应',
  ];
  const alerts: Alert[] = [];
  let count = 0;
  for (const task of tasks) {
    if (task.alertCount <= 0) continue;
    for (let j = 0; j < task.alertCount; j++) {
      count++;
      const type = pick(types);
      const level = pick(levels);
      const threshold = type === 'shear_exceed' ? 45 : type === 'slip_anomaly' ? 30 : 0.001;
      const actual = threshold * (type === 'convergence_warning' ? rand(0.8, 1.5) : rand(1.05, 1.8));
      const status = task.status === 'published' || task.status === 'professor_approved' ? 'reviewed' : pick(statusPool);
      const reviewer = users.find((u) => u.role === 'geologist');
      const alert: Alert = {
        id: `alert-${String(count).padStart(4, '0')}`,
        taskId: task.id,
        taskName: task.name,
        level,
        status,
        type,
        triggeredAt: new Date(new Date(task.createdAt).getTime() + randInt(30, 600) * 60000).toISOString(),
        thresholdValue: +threshold.toFixed(3),
        actualValue: +actual.toFixed(3),
        affectedRegion: pick(regions),
        description: pick(descs),
        ...(status !== 'pending' && reviewer
          ? {
              reviewerId: reviewer.id,
              reviewedAt: new Date(now - randInt(1, 20) * 3600000).toISOString(),
              reviewComment: pick([
                '已确认属于正常波动，无实际风险',
                '已调整摩擦系数 0.6 → 0.65，重新模拟',
                '下调孔隙压力参数至 12 MPa',
              ]),
              reviewAction: pick<Alert['reviewAction']>([
                'confirm_normal',
                'adjust_friction',
                'adjust_pore',
              ]),
            }
          : {}),
      };
      alerts.push(alert);
      db.insert('alerts', alert.id, alert);
    }
  }
  for (let k = 0; k < 5; k++) {
    count++;
    const task = tasks[k % tasks.length];
    const alert: Alert = {
      id: `alert-${String(count).padStart(4, '0')}`,
      taskId: task.id,
      taskName: task.name,
      level: 'level1',
      status: 'pending',
      type: pick(types),
      triggeredAt: new Date(now - randInt(10, 180) * 60000).toISOString(),
      thresholdValue: 45,
      actualValue: +rand(48, 80).toFixed(2),
      affectedRegion: pick(regions),
      description: pick(descs),
    };
    alerts.push(alert);
    db.insert('alerts', alert.id, alert);
  }
  return alerts;
}

export function seedApprovals(tasks: SimulationTask[], users: User[]): ApprovalRecord[] {
  const postdoc = users.find((u) => u.role === 'postdoc')!;
  const professor = users.find((u) => u.role === 'professor')!;
  const approvals: ApprovalRecord[] = [];
  const targets = tasks.filter((t) =>
    ['completed', 'postdoc_approved', 'professor_approved', 'published'].includes(t.status),
  );
  for (const task of targets) {
    if (['postdoc_approved', 'professor_approved', 'published'].includes(task.status)) {
      const ap: ApprovalRecord = {
        id: `approval-postdoc-${task.id}`,
        taskId: task.id,
        approverId: postdoc.id,
        approverName: postdoc.name,
        approverRole: 'postdoc',
        approved: true,
        comments: '数值稳定性良好，收敛曲线平滑，残差降至阈值以下',
        numericalStability: {
          convergenceRate: +rand(0.9, 0.99).toFixed(3),
          residualNorm: +rand(1e-6, 1e-4).toFixed(8),
          massConservation: +rand(0.98, 1.005).toFixed(4),
          overallScore: randInt(82, 97),
        },
        createdAt: new Date(new Date(task.createdAt).getTime() + randInt(86400, 259200) * 1000).toISOString(),
      };
      approvals.push(ap);
      db.insert('approvals', ap.id, ap);
    }
    if (['professor_approved', 'published'].includes(task.status)) {
      const ap: ApprovalRecord = {
        id: `approval-prof-${task.id}`,
        taskId: task.id,
        approverId: professor.id,
        approverName: professor.name,
        approverRole: 'professor',
        approved: true,
        comments: '物理机制合理，应力场分布符合该区域地质背景，滑动势评估可靠',
        physicalReasonability: {
          paramConsistency: +rand(0.88, 0.97).toFixed(3),
          geologicalPlausibility: +rand(0.85, 0.96).toFixed(3),
          resultAgreement: +rand(0.82, 0.95).toFixed(3),
          overallScore: randInt(80, 95),
        },
        createdAt: new Date(new Date(task.createdAt).getTime() + randInt(172800, 432000) * 1000).toISOString(),
      };
      approvals.push(ap);
      db.insert('approvals', ap.id, ap);
    }
    if (task.status === 'completed' && Math.random() > 0.5) {
      const ap: ApprovalRecord = {
        id: `approval-reject-${task.id}`,
        taskId: task.id,
        approverId: postdoc.id,
        approverName: postdoc.name,
        approverRole: 'postdoc',
        approved: false,
        comments: '中段区域收敛不稳定，建议加密网格后重新计算',
        createdAt: new Date(new Date(task.createdAt).getTime() + randInt(86400, 200000) * 1000).toISOString(),
      };
      approvals.push(ap);
      db.insert('approvals', ap.id, ap);
    }
  }
  return approvals;
}

export function seedDailyStats(): DailyStats[] {
  const stats: DailyStats[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now - i * DAY);
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const seedBase = Math.sin(i * 1.7) * 0.1 + 0.85;
    const s: DailyStats = {
      date: dateStr,
      completionRate: +Math.min(1, Math.max(0.6, seedBase + rand(-0.08, 0.08))).toFixed(4),
      avgStressAccuracy: +Math.min(0.99, Math.max(0.75, 0.82 + Math.cos(i * 0.3) * 0.05 + rand(-0.04, 0.04))).toFixed(4),
      avgAlertResponseTime: +rand(25, 75).toFixed(1),
      tasksCreated: randInt(1, 5),
      tasksCompleted: randInt(1, 4),
      alertsTriggered: randInt(1, 8),
      alertsResolved: randInt(0, 7),
      approvalsCompleted: randInt(0, 3),
    };
    stats.push(s);
    db.insert('dailyStats', s.date, s);
  }
  return stats;
}

export function seedRecommendations(faults: Fault[]): ParamRecommendation[] {
  const paramsList = [
    { bc: { northStress: 52, eastStress: 38, verticalStress: 68, porePressure: 14, temperature: 42 }, rp: { youngModulus: 72, poissonRatio: 0.24, cohesion: 15, frictionCoefficient: 0.62, dilationAngle: 12, tensileStrength: 6 } },
    { bc: { northStress: 65, eastStress: 48, verticalStress: 85, porePressure: 18, temperature: 55 }, rp: { youngModulus: 68, poissonRatio: 0.26, cohesion: 18, frictionCoefficient: 0.58, dilationAngle: 14, tensileStrength: 8 } },
    { bc: { northStress: 44, eastStress: 32, verticalStress: 58, porePressure: 11, temperature: 38 }, rp: { youngModulus: 76, poissonRatio: 0.22, cohesion: 12, frictionCoefficient: 0.68, dilationAngle: 10, tensileStrength: 5 } },
    { bc: { northStress: 58, eastStress: 42, verticalStress: 74, porePressure: 16, temperature: 48 }, rp: { youngModulus: 70, poissonRatio: 0.25, cohesion: 16, frictionCoefficient: 0.60, dilationAngle: 13, tensileStrength: 7 } },
  ];
  const recs: ParamRecommendation[] = [];
  for (let i = 0; i < 8; i++) {
    const fault = faults[i % faults.length];
    const combo = paramsList[i % paramsList.length];
    const rec: ParamRecommendation = {
      id: `rec-${String(i + 1).padStart(4, '0')}`,
      faultId: fault.id,
      faultName: fault.name,
      boundaryConditions: combo.bc,
      rockParams: combo.rp,
      successRate: +rand(0.78, 0.96).toFixed(4),
      averageAccuracy: +rand(0.85, 0.97).toFixed(4),
      sampleCount: randInt(12, 58),
      matchedCases: [`task-000${(i % 8) + 1}`, `task-000${((i + 2) % 8) + 1}`],
      sensitivityAnalysis: [
        { param: 'frictionCoefficient', weight: 0.34 },
        { param: 'porePressure', weight: 0.26 },
        { param: 'cohesion', weight: 0.18 },
        { param: 'youngModulus', weight: 0.14 },
        { param: 'poissonRatio', weight: 0.08 },
      ],
      createdAt: new Date(now - (i * 3 + 1) * DAY).toISOString(),
      adopted: i < 3,
      ...(i < 3 ? { adoptedAt: new Date(now - (i * 2 + 1) * DAY).toISOString() } : {}),
    };
    recs.push(rec);
    db.insert('recommendations', rec.id, rec);
  }
  return recs;
}

export function seedDeviations(faults: Fault[], tasks: SimulationTask[]): DeviationRecord[] {
  const deviations: DeviationRecord[] = [];
  const pausedFault = faults.find((f) => f.isPaused);
  if (pausedFault) {
    const relTasks = tasks.filter((t) => t.faultId === pausedFault.id);
    const dev: DeviationRecord = {
      id: 'dev-0001',
      faultId: pausedFault.id,
      triggerTime: iso(-3 * DAY),
      taskIds: relTasks.map((t) => t.id).slice(0, 3),
      slipDeviations: [0.22, 0.28, 0.34],
      maxDeviation: 0.34,
      status: 'active',
    };
    deviations.push(dev);
    db.insert('deviations', dev.id, dev);
  }
  for (let i = 0; i < 3; i++) {
    const fault = faults[(i + 1) % faults.length];
    if (fault.isPaused) continue;
    const relTasks = tasks.filter((t) => t.faultId === fault.id);
    const dev: DeviationRecord = {
      id: `dev-${String(i + 2).padStart(4, '0')}`,
      faultId: fault.id,
      triggerTime: new Date(now - (i + 4) * 7 * DAY).toISOString(),
      taskIds: relTasks.map((t) => t.id).slice(0, 2),
      slipDeviations: [0.21, 0.23],
      maxDeviation: 0.23,
      status: 'resolved',
      resolvedBy: 'user-chief',
      resolvedAt: new Date(now - (i + 2) * 7 * DAY).toISOString(),
      resolutionNote: '已补充断层深部几何数据，更新基础参数后偏差收敛',
    };
    deviations.push(dev);
    db.insert('deviations', dev.id, dev);
  }
  return deviations;
}

export function seedMonitorPoints(tasks: SimulationTask[]): void {
  for (const task of tasks) {
    if (['pending_verify', 'mesh_generating'].includes(task.status)) continue;
    const startTs = new Date(task.createdAt).getTime();
    const points: MonitorDataPoint[] = [];
    const n = randInt(30, 120);
    for (let i = 0; i < n; i++) {
      const baseStress = 35 + Math.sin(i * 0.1) * 10 + rand(-3, 3);
      points.push({
        timestamp: new Date(startTs + i * 60000).toISOString(),
        maxShearStress: +baseStress.toFixed(3),
        coulombStressChange: +(rand(-5, 8) + Math.sin(i * 0.08) * 3).toFixed(3),
        slipRate: +(5 + Math.cos(i * 0.12) * 2 + rand(-0.5, 0.5)).toFixed(3),
        frictionStrength: +(45 + rand(-1.5, 1.5)).toFixed(2),
        temperature: +(40 + rand(-3, 3)).toFixed(1),
      });
    }
    db.appendMonitorPoints(task.id, points);
  }
}

export function seedReports(tasks: SimulationTask[]): void {
  for (const task of tasks) {
    if (
      !['completed', 'postdoc_approved', 'professor_approved', 'published'].includes(task.status)
    )
      continue;
    const fault = db.getById('faults', task.faultId);
    const faultLength = fault?.lengthKm ?? 100;
    const stressField: SimulationReport['stressFieldData'] = [];
    for (let i = 0; i < 50; i++) {
      stressField.push({
        x: +rand(-50, 50).toFixed(2),
        y: +rand(-30, 30).toFixed(2),
        z: +rand(-40, 0).toFixed(2),
        s1: +rand(60, 180).toFixed(2),
        s2: +rand(40, 120).toFixed(2),
        s3: +rand(20, 80).toFixed(2),
        shear: +rand(20, 80).toFixed(2),
        coulomb: +rand(-10, 15).toFixed(2),
      });
    }
    const slipDist: SimulationReport['slipDistribution'] = [];
    for (let i = 0; i < 20; i++) {
      slipDist.push({
        distanceAlongFault: +(i * (faultLength / 20)).toFixed(1),
        slipAmount: +rand(0.1, 2.5).toFixed(3),
        slipPotential: +rand(0.2, 0.95).toFixed(3),
        segmentId: `seg-${String(i + 1).padStart(2, '0')}`,
      });
    }
    const moments: SimulationReport['seismicMomentCurve'] = [];
    for (let i = 0; i < 30; i++) {
      moments.push({
        timeStep: i,
        momentRate: +(1e15 + rand(0, 1e16) + Math.sin(i * 0.3) * 5e15).toExponential(3),
        cumulativeMoment: +(1e17 + i * 3e15).toExponential(3),
      });
    }
    const coulombFrames: SimulationReport['coulombEvolution'] = [];
    for (let f = 0; f < 10; f++) {
      const frame: number[][] = [];
      for (let r = 0; r < 12; r++) {
        frame.push(Array.from({ length: 16 }, () => +rand(-8, 12).toFixed(2)));
      }
      coulombFrames.push({ timeStep: f * 3, stressChangeData: frame });
    }
    const report: SimulationReport = {
      taskId: task.id,
      summary: {
        maxPrincipalStress: +rand(120, 250).toFixed(2),
        maxShearStress: +rand(55, 95).toFixed(2),
        totalSeismicMoment: +(rand(1e17, 5e18)).toExponential(3),
        maxSlipPotential: +rand(0.7, 0.98).toFixed(3),
        highRiskSegments: ['seg-05', 'seg-11', 'seg-17'].slice(0, randInt(2, 3)),
      },
      stressFieldData: stressField,
      slipDistribution: slipDist,
      seismicMomentCurve: moments,
      coulombEvolution: coulombFrames,
    };
    db.insert('reports', task.id, report);
  }
}

export function runSeed(): {
  users: User[];
  faults: Fault[];
  tasks: SimulationTask[];
  alerts: Alert[];
  approvals: ApprovalRecord[];
  stats: DailyStats[];
  recommendations: ParamRecommendation[];
  deviations: DeviationRecord[];
} {
  const users = seedUsers();
  const faults = seedFaults();
  const tasks = seedTasks(users, faults);
  const alerts = seedAlerts(tasks, users);
  const approvals = seedApprovals(tasks, users);
  const stats = seedDailyStats();
  const recommendations = seedRecommendations(faults);
  const deviations = seedDeviations(faults, tasks);
  seedMonitorPoints(tasks);
  seedReports(tasks);
  db.forceSave();
  return { users, faults, tasks, alerts, approvals, stats, recommendations, deviations };
}

export default runSeed;
