import { Router, type Request, type Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';
import { TaskService } from '../services/TaskService.js';
import { db } from '../db/store.js';
import type {
  ApiResponse,
  PaginatedResponse,
  SimulationTask,
  MonitorDataPoint,
  FileInfo,
  BoundaryConditions,
  RockMechanicsParams,
} from '../../shared/types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const UPLOAD_DIR = path.resolve(__dirname, '..', '..', 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});
export const upload = multer({ storage, limits: { fileSize: 50 * 1024 * 1024 } });

const router = Router();

router.get('/', async (req: Request, res: Response): Promise<void> => {
  const query = {
    status: req.query.status as SimulationTask['status'] | undefined,
    faultId: req.query.faultId as string | undefined,
    creatorId: req.query.creatorId as string | undefined,
    page: Number(req.query.page ?? 1),
    pageSize: Number(req.query.pageSize ?? 20),
  };
  const data: PaginatedResponse<SimulationTask> = TaskService.list(query);
  const body: ApiResponse<PaginatedResponse<SimulationTask>> = { success: true, data };
  res.status(200).json(body);
});

router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  const task = TaskService.getById(req.params.id);
  if (!task) {
    res.status(404).json({ success: false, error: '任务不存在' });
    return;
  }
  const body: ApiResponse<SimulationTask> = { success: true, data: task };
  res.status(200).json(body);
});

router.post('/', async (req: Request, res: Response): Promise<void> => {
  const userId = req.headers['x-user-id'] as string;
  const user = db.getById('users', userId) ?? db.getAll('users')[0];
  const params = req.body as {
    name: string;
    faultId: string;
    faultName: string;
    geometryFile: FileInfo;
    boundaryConditions: BoundaryConditions;
    rockParams: RockMechanicsParams;
  };
  if (!params.name || !params.faultId) {
    res.status(400).json({ success: false, error: '缺少必填字段' });
    return;
  }
  const geometryFile: FileInfo = params.geometryFile ?? {
    id: uuidv4(),
    name: `${params.faultName}_geometry.vtk`,
    size: 1024 * 1024,
    type: 'application/octet-stream',
    uploadedAt: new Date().toISOString(),
  };
  const task = TaskService.create({
    name: params.name,
    faultId: params.faultId,
    faultName: params.faultName,
    creator: user,
    geometryFile,
    boundaryConditions: params.boundaryConditions ?? {
      northStress: 50,
      eastStress: 35,
      verticalStress: 70,
      porePressure: 15,
      temperature: 45,
    },
    rockParams: params.rockParams ?? {
      youngModulus: 70,
      poissonRatio: 0.25,
      cohesion: 15,
      frictionCoefficient: 0.6,
      dilationAngle: 12,
      tensileStrength: 6,
    },
  });
  const body: ApiResponse<SimulationTask> = { success: true, data: task };
  res.status(201).json(body);
});

router.post('/upload', upload.single('file'), (req: Request, res: Response): void => {
  if (!req.file) {
    res.status(400).json({ success: false, error: '未收到文件' });
    return;
  }
  const info: FileInfo = {
    id: uuidv4(),
    name: req.file.originalname,
    size: req.file.size,
    type: req.file.mimetype,
    uploadedAt: new Date().toISOString(),
  };
  const body: ApiResponse<FileInfo> = { success: true, data: info, message: '上传成功' };
  res.status(200).json(body);
});

router.put('/:id/status', async (req: Request, res: Response): Promise<void> => {
  const userId = req.headers['x-user-id'] as string;
  const { status, remark } = req.body as { status: SimulationTask['status']; remark?: string };
  if (!status) {
    res.status(400).json({ success: false, error: '缺少状态参数' });
    return;
  }
  const task = TaskService.getById(req.params.id);
  if (!task) {
    res.status(404).json({ success: false, error: '任务不存在' });
    return;
  }
  if (!TaskService.canTransitionTo(task.status, status)) {
    res.status(400).json({ success: false, error: `不允许从 ${task.status} 流转到 ${status}` });
    return;
  }
  const updated = TaskService.updateStatus(req.params.id, status, userId, remark);
  const body: ApiResponse<SimulationTask> = { success: true, data: updated! };
  res.status(200).json(body);
});

router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  const ok = TaskService.deleteDraft(req.params.id);
  if (!ok) {
    res.status(400).json({ success: false, error: '仅草稿状态可删除' });
    return;
  }
  res.status(200).json({ success: true, message: '已删除' });
});

router.get('/:id/monitor', async (req: Request, res: Response): Promise<void> => {
  const data = TaskService.getMonitorData(req.params.id);
  const body: ApiResponse<{ points: MonitorDataPoint[]; latest?: MonitorDataPoint }> = {
    success: true,
    data,
  };
  res.status(200).json(body);
});

router.post('/:id/adjustment', async (req: Request, res: Response): Promise<void> => {
  const userId = req.headers['x-user-id'] as string;
  const { alertId, paramChanges, reason } = req.body as {
    alertId?: string;
    paramChanges: Partial<RockMechanicsParams & BoundaryConditions>;
    reason: string;
  };
  if (!reason) {
    res.status(400).json({ success: false, error: '缺少调整原因' });
    return;
  }
  const updated = TaskService.addAdjustment(req.params.id, {
    operatorId: userId,
    alertId,
    paramChanges,
    reason,
  });
  if (!updated) {
    res.status(404).json({ success: false, error: '任务不存在' });
    return;
  }
  const body: ApiResponse<SimulationTask> = { success: true, data: updated };
  res.status(200).json(body);
});

export default router;
