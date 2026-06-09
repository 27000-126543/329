import { Router, type Request, type Response } from 'express';
import { RecommendationService } from '../services/RecommendationService.js';
import { db } from '../db/store.js';
import type { ApiResponse, PaginatedResponse, ParamRecommendation } from '../../shared/types.js';

const router = Router();

router.get('/', async (req: Request, res: Response): Promise<void> => {
  const query = {
    faultId: req.query.faultId as string | undefined,
    adopted:
      req.query.adopted !== undefined ? req.query.adopted === 'true' : undefined,
    page: Number(req.query.page ?? 1),
    pageSize: Number(req.query.pageSize ?? 20),
  };
  const data: PaginatedResponse<ParamRecommendation> = RecommendationService.list(query);
  const body: ApiResponse<PaginatedResponse<ParamRecommendation>> = { success: true, data };
  res.status(200).json(body);
});

router.get('/fault/:faultId', async (req: Request, res: Response): Promise<void> => {
  const fault = db.getById('faults', req.params.faultId);
  if (!fault) {
    res.status(404).json({ success: false, error: '断层不存在' });
    return;
  }
  let list = RecommendationService.getByFault(req.params.faultId);
  if (list.length === 0) {
    list = RecommendationService.generateForFault(fault);
  }
  const body: ApiResponse<ParamRecommendation[]> = { success: true, data: list };
  res.status(200).json(body);
});

router.get('/generate/:faultId', async (req: Request, res: Response): Promise<void> => {
  const fault = db.getById('faults', req.params.faultId);
  if (!fault) {
    res.status(404).json({ success: false, error: '断层不存在' });
    return;
  }
  const list = RecommendationService.generateForFault(fault);
  const body: ApiResponse<ParamRecommendation[]> = { success: true, data: list };
  res.status(200).json(body);
});

router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  const rec = RecommendationService.getById(req.params.id);
  if (!rec) {
    res.status(404).json({ success: false, error: '推荐不存在' });
    return;
  }
  const body: ApiResponse<ParamRecommendation> = { success: true, data: rec };
  res.status(200).json(body);
});

router.post('/:id/adopt', async (req: Request, res: Response): Promise<void> => {
  const userId = req.headers['x-user-id'] as string;
  const user = db.getById('users', userId) ?? db.getAll('users')[0];
  const updated = RecommendationService.adopt(req.params.id, user);
  if (!updated) {
    res.status(404).json({ success: false, error: '推荐不存在' });
    return;
  }
  const body: ApiResponse<ParamRecommendation> = {
    success: true,
    data: updated,
    message: '已采纳推荐参数',
  };
  res.status(200).json(body);
});

export default router;
