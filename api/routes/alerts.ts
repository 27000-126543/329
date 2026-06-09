import { Router, type Request, type Response } from 'express';
import { AlertService } from '../services/AlertService.js';
import { db } from '../db/store.js';
import type { ApiResponse, PaginatedResponse, Alert } from '../../shared/types.js';

const router = Router();

router.get('/', async (req: Request, res: Response): Promise<void> => {
  const query = {
    level: req.query.level as Alert['level'] | undefined,
    status: req.query.status as Alert['status'] | undefined,
    taskId: req.query.taskId as string | undefined,
    page: Number(req.query.page ?? 1),
    pageSize: Number(req.query.pageSize ?? 20),
  };
  const data: PaginatedResponse<Alert> = AlertService.list(query);
  const body: ApiResponse<PaginatedResponse<Alert>> = { success: true, data };
  res.status(200).json(body);
});

router.get('/summary', async (req: Request, res: Response): Promise<void> => {
  const data = AlertService.countByStatus();
  const body: ApiResponse<typeof data> = { success: true, data };
  res.status(200).json(body);
});

router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  const alert = AlertService.getById(req.params.id);
  if (!alert) {
    res.status(404).json({ success: false, error: '预警不存在' });
    return;
  }
  const body: ApiResponse<Alert> = { success: true, data: alert };
  res.status(200).json(body);
});

router.post('/:id/review', async (req: Request, res: Response): Promise<void> => {
  const userId = req.headers['x-user-id'] as string;
  const user = db.getById('users', userId) ?? db.getAll('users')[0];
  const { action, comment, newStatus } = req.body as {
    action: Alert['reviewAction'];
    comment: string;
    newStatus?: Alert['status'];
  };
  if (!action || !comment) {
    res.status(400).json({ success: false, error: '缺少复核操作或意见' });
    return;
  }
  const updated = AlertService.review(req.params.id, user, { action, comment, newStatus });
  if (!updated) {
    res.status(404).json({ success: false, error: '预警不存在' });
    return;
  }
  const body: ApiResponse<Alert> = { success: true, data: updated };
  res.status(200).json(body);
});

export default router;
