import { Router, type Request, type Response } from 'express';
import { StatsService } from '../services/StatsService.js';
import type { ApiResponse, DailyStats } from '../../shared/types.js';

const router = Router();

router.get('/daily', async (req: Request, res: Response): Promise<void> => {
  const days = Number(req.query.days ?? 30);
  const data: DailyStats[] = StatsService.listDaily(days);
  const body: ApiResponse<DailyStats[]> = { success: true, data };
  res.status(200).json(body);
});

router.get('/summary', async (req: Request, res: Response): Promise<void> => {
  const days = Number(req.query.days ?? 30);
  const stats = StatsService.listDaily(days);
  if (stats.length === 0) {
    res.status(200).json({ success: true, data: null });
    return;
  }
  const avg = (key: keyof DailyStats) =>
    +(stats.reduce((a, b) => a + (b[key] as number), 0) / stats.length).toFixed(4);
  const sum = (key: keyof DailyStats) =>
    stats.reduce((a, b) => a + (b[key] as number), 0);
  const summary = {
    periodDays: stats.length,
    avgCompletionRate: avg('completionRate'),
    avgStressAccuracy: avg('avgStressAccuracy'),
    avgAlertResponseTime: +(
      stats.reduce((a, b) => a + b.avgAlertResponseTime, 0) / stats.length
    ).toFixed(1),
    totalTasksCreated: sum('tasksCreated'),
    totalTasksCompleted: sum('tasksCompleted'),
    totalAlertsTriggered: sum('alertsTriggered'),
    totalAlertsResolved: sum('alertsResolved'),
    totalApprovalsCompleted: sum('approvalsCompleted'),
    latest: stats[stats.length - 1],
  };
  const body: ApiResponse<typeof summary> = { success: true, data: summary };
  res.status(200).json(body);
});

router.get('/trends', async (req: Request, res: Response): Promise<void> => {
  const days = Number(req.query.days ?? 30);
  const trends = StatsService.getTrends(days);
  const body: ApiResponse<typeof trends> = { success: true, data: trends };
  res.status(200).json(body);
});

router.get('/:date', async (req: Request, res: Response): Promise<void> => {
  const data = StatsService.getByDate(req.params.date);
  if (!data) {
    res.status(404).json({ success: false, error: '该日统计不存在' });
    return;
  }
  const body: ApiResponse<DailyStats> = { success: true, data };
  res.status(200).json(body);
});

export default router;
