// ====== 通用枚举 ======
export type TaskStatus =
  | 'pending_verify'
  | 'mesh_generating'
  | 'initializing'
  | 'stress_computing'
  | 'slip_evaluating'
  | 'completed'
  | 'rollback'
  | 'postdoc_approved'
  | 'professor_approved'
  | 'published';

export type AlertLevel = 'level1' | 'level2' | 'level3';
export type AlertStatus = 'pending' | 'reviewed' | 'ignored';
export type Role = 'geologist' | 'postdoc' | 'professor' | 'chief' | 'assessor' | 'admin';
export type StressType = 'principal' | 'shear' | 'coulomb';

// ====== 用户 ======
export interface User {
  id: string;
  name: string;
  role: Role;
  email: string;
  avatar?: string;
}

// ====== 模拟任务 ======
export interface SimulationTask {
  id: string;
  name: string;
  faultId: string;
  faultName: string;
  creatorId: string;
  creatorName: string;
  status: TaskStatus;
  statusHistory: StatusRecord[];
  createdAt: string;
  updatedAt: string;
  geometryFile: FileInfo;
  boundaryConditions: BoundaryConditions;
  rockParams: RockMechanicsParams;
  meshInfo?: MeshInfo;
  progress: number;
  currentStep?: string;
  alertCount: number;
  adjustmentLogs: AdjustmentLog[];
}

export interface StatusRecord {
  status: TaskStatus;
  timestamp: string;
  operator?: string;
  remark?: string;
}

export interface FileInfo {
  id: string;
  name: string;
  size: number;
  type: string;
  uploadedAt: string;
}

export interface BoundaryConditions {
  northStress: number;
  eastStress: number;
  verticalStress: number;
  porePressure: number;
  temperature: number;
}

export interface RockMechanicsParams {
  youngModulus: number;
  poissonRatio: number;
  cohesion: number;
  frictionCoefficient: number;
  dilationAngle: number;
  tensileStrength: number;
}

export interface MeshInfo {
  nodeCount: number;
  elementCount: number;
  qualityScore: number;
  minAngle: number;
}

export interface AdjustmentLog {
  id: string;
  timestamp: string;
  operator: string;
  alertId?: string;
  paramChanges: Partial<RockMechanicsParams & BoundaryConditions>;
  reason: string;
}

// ====== 监控与预警 ======
export interface MonitorDataPoint {
  timestamp: string;
  maxShearStress: number;
  coulombStressChange: number;
  slipRate: number;
  frictionStrength: number;
  temperature?: number;
}

export interface Alert {
  id: string;
  taskId: string;
  taskName: string;
  level: AlertLevel;
  status: AlertStatus;
  type: 'shear_exceed' | 'slip_anomaly' | 'convergence_warning';
  triggeredAt: string;
  thresholdValue: number;
  actualValue: number;
  affectedRegion: string;
  description: string;
  reviewerId?: string;
  reviewedAt?: string;
  reviewComment?: string;
  reviewAction?: 'adjust_friction' | 'adjust_pore' | 'confirm_normal';
}

// ====== 审批 ======
export interface ApprovalRecord {
  id: string;
  taskId: string;
  approverId: string;
  approverName: string;
  approverRole: 'postdoc' | 'professor';
  approved: boolean;
  comments: string;
  numericalStability?: {
    convergenceRate: number;
    residualNorm: number;
    massConservation: number;
    overallScore: number;
  };
  physicalReasonability?: {
    paramConsistency: number;
    geologicalPlausibility: number;
    resultAgreement: number;
    overallScore: number;
  };
  createdAt: string;
}

// ====== 报告结果 ======
export interface SimulationReport {
  taskId: string;
  summary: {
    maxPrincipalStress: number;
    maxShearStress: number;
    totalSeismicMoment: number;
    maxSlipPotential: number;
    highRiskSegments: string[];
  };
  stressFieldData: StressFieldPoint[];
  slipDistribution: SlipPoint[];
  seismicMomentCurve: MomentPoint[];
  coulombEvolution: CoulombFrame[];
}

export interface StressFieldPoint {
  x: number;
  y: number;
  z: number;
  s1: number;
  s2: number;
  s3: number;
  shear: number;
  coulomb: number;
}

export interface SlipPoint {
  distanceAlongFault: number;
  slipAmount: number;
  slipPotential: number;
  segmentId: string;
}

export interface MomentPoint {
  timeStep: number;
  momentRate: number;
  cumulativeMoment: number;
}

export interface CoulombFrame {
  timeStep: number;
  stressChangeData: number[][];
}

// ====== 断层 ======
export interface Fault {
  id: string;
  name: string;
  location: string;
  lengthKm: number;
  depthKm: number;
  strike: number;
  dip: number;
  rake: number;
  isPaused: boolean;
  pauseReason?: string;
  pausedAt?: string;
  simulationCount: number;
  lastSimulationAt?: string;
}

export interface DeviationRecord {
  id: string;
  faultId: string;
  triggerTime: string;
  taskIds: string[];
  slipDeviations: number[];
  maxDeviation: number;
  status: 'active' | 'resolved';
  resolvedBy?: string;
  resolvedAt?: string;
  resolutionNote?: string;
}

// ====== 推荐 ======
export interface ParamRecommendation {
  id: string;
  faultId: string;
  faultName: string;
  boundaryConditions: BoundaryConditions;
  rockParams: RockMechanicsParams;
  successRate: number;
  averageAccuracy: number;
  sampleCount: number;
  matchedCases: string[];
  sensitivityAnalysis: { param: string; weight: number }[];
  createdAt: string;
  adopted: boolean;
  adoptedAt?: string;
}

// ====== 统计 ======
export interface DailyStats {
  date: string;
  completionRate: number;
  avgStressAccuracy: number;
  avgAlertResponseTime: number;
  tasksCreated: number;
  tasksCompleted: number;
  alertsTriggered: number;
  alertsResolved: number;
  approvalsCompleted: number;
}

// ====== Dashboard ======
export interface DashboardStats {
  totalTasks: number;
  runningTasks: number;
  completionRate: number;
  avgAccuracy: number;
  avgAlertResponseTime: number;
  pendingApprovals: number;
  activeAlerts: number;
  level1Alerts: number;
  level2Alerts: number;
  level3Alerts: number;
}

export interface TaskListQuery {
  status?: TaskStatus;
  faultId?: string;
  creatorId?: string;
  page?: number;
  pageSize?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
