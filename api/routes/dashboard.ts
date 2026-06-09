import { Router, type Request, type Response } from 'express';
import { StatsService } from '../services/StatsService.js';
import type {
  ApiResponse,
  DashboardStats,
  DailyStats,
  SimulationTask,
  Alert,
} from '../../shared/types.js';

const router = Router();

router.get('/stats', async (req: Request, res: Response): Promise<void> => {
  const stats: DashboardStats = StatsService.getDashboard();
  const body: ApiResponse<DashboardStats> = {
    success: true,
    data: stats,
    message: '获取统计数据成功',
  };
  res.status(200).json(body);
});

router.get('/trends', async (req: Request, res: Response): Promise<void> => {
  const days = Math.min(90, Math.max(1, Number(req.query.days ?? 30)));
  const trends: DailyStats[] = StatsService.listDaily(days);
  const body: ApiResponse<DailyStats[]> = {
    success: true,
    data: trends,
    message: `获取最近 ${trends.length} 天趋势数据成功`,
  };
  res.status(200).json(body);
});

router.get('/status-distribution', async (req: Request, res: Response): Promise<void> => {
  const data = StatsService.getTaskStatusDistribution();
  const body: ApiResponse<typeof data> = { success: true, data };
  res.status(200).json(body);
});

router.get('/recent-tasks', async (req: Request, res: Response): Promise<void> => {
  const limit = Math.min(50, Math.max(1, Number(req.query.limit ?? 8)));
  const data: SimulationTask[] = StatsService.getRecentTasks(limit);
  const body: ApiResponse<SimulationTask[]> = { success: true, data };
  res.status(200).json(body);
});

router.get('/recent-alerts', async (req: Request, res: Response): Promise<void> => {
  const limit = Math.min(50, Math.max(1, Number(req.query.limit ?? 8)));
  const data: Alert[] = StatsService.getRecentAlerts(limit);
  const body: ApiResponse<Alert[]> = { success: true, data };
  res.status(200).json(body);
});

export default router;
