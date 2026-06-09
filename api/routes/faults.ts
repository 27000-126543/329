import { Router, type Request, type Response } from 'express';
import { DeviationService } from '../services/DeviationService.js';
import { db } from '../db/store.js';
import type { ApiResponse, PaginatedResponse, Fault, DeviationRecord } from '../../shared/types.js';

const router = Router();

router.get('/', async (req: Request, res: Response): Promise<void> => {
  const faults = db.getAll('faults');
  faults.sort((a, b) => b.simulationCount - a.simulationCount);
  const body: ApiResponse<Fault[]> = { success: true, data: faults };
  res.status(200).json(body);
});

router.get('/active-count', async (req: Request, res: Response): Promise<void> => {
  const n = DeviationService.getActiveCount();
  res.status(200).json({ success: true, data: { activeDeviations: n } });
});

router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  const fault = db.getById('faults', req.params.id);
  if (!fault) {
    res.status(404).json({ success: false, error: '断层不存在' });
    return;
  }
  const deviations = DeviationService.getByFault(req.params.id);
  const relatedTasks = db.find('tasks', (t) => t.faultId === req.params.id).sort(
    (a, b) => +new Date(b.createdAt) - +new Date(a.createdAt),
  );
  const body: ApiResponse<{ fault: Fault; deviations: DeviationRecord[]; tasks: typeof relatedTasks }> = {
    success: true,
    data: { fault, deviations, tasks: relatedTasks },
  };
  res.status(200).json(body);
});

router.post('/:id/resume', async (req: Request, res: Response): Promise<void> => {
  const userId = req.headers['x-user-id'] as string;
  const user = db.getById('users', userId);
  if (!user || user.role !== 'chief') {
    res.status(403).json({ success: false, error: '仅首席科学家可解除暂停' });
    return;
  }
  const { note } = req.body as { note?: string };
  const updated = db.update('faults', req.params.id, (prev) => ({
    ...prev,
    isPaused: false,
    pauseReason: undefined,
    pausedAt: undefined,
    lastSimulationAt: new Date().toISOString(),
  }));
  if (!updated) {
    res.status(404).json({ success: false, error: '断层不存在' });
    return;
  }
  if (note) {
    const actives = db.find('deviations', (d) => d.faultId === req.params.id && d.status === 'active');
    for (const d of actives) {
      DeviationService.resolve(d.id, user, note, false);
    }
  }
  const fault = db.getById('faults', req.params.id);
  const body: ApiResponse<Fault> = { success: true, data: fault!, message: '已解除断层暂停' };
  res.status(200).json(body);
});

router.post('/:id/check-deviation', async (req: Request, res: Response): Promise<void> => {
  const fault = db.getById('faults', req.params.id);
  if (!fault) {
    res.status(404).json({ success: false, error: '断层不存在' });
    return;
  }
  const record = DeviationService.checkFault(fault);
  res.status(200).json({
    success: true,
    data: { triggered: !!record, record },
    message: record ? '触发偏差预警' : '偏差检测正常',
  });
});

router.get('/:id/deviations', async (req: Request, res: Response): Promise<void> => {
  const data = DeviationService.list({ faultId: req.params.id });
  const body: ApiResponse<PaginatedResponse<DeviationRecord>> = { success: true, data };
  res.status(200).json(body);
});

router.post('/deviations/:id/resolve', async (req: Request, res: Response): Promise<void> => {
  const userId = req.headers['x-user-id'] as string;
  const user = db.getById('users', userId) ?? db.getAll('users')[0];
  const { note, resumeFault } = req.body as { note: string; resumeFault?: boolean };
  if (!note) {
    res.status(400).json({ success: false, error: '缺少处理说明' });
    return;
  }
  const updated = DeviationService.resolve(req.params.id, user, note, resumeFault !== false);
  if (!updated) {
    res.status(404).json({ success: false, error: '偏差记录不存在' });
    return;
  }
  const body: ApiResponse<DeviationRecord> = { success: true, data: updated, message: '已处理' };
  res.status(200).json(body);
});

export default router;
