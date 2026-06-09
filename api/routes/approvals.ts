import { Router, type Request, type Response } from 'express';
import { ApprovalService } from '../services/ApprovalService.js';
import { db } from '../db/store.js';
import type { ApiResponse, PaginatedResponse, ApprovalRecord } from '../../shared/types.js';

const router = Router();

router.get('/pending', async (req: Request, res: Response): Promise<void> => {
  const userId = req.headers['x-user-id'] as string;
  const user = db.getById('users', userId);
  const role = user?.role;
  if (role === 'postdoc') {
    const data = ApprovalService.getPendingForRole('postdoc');
    res.status(200).json({ success: true, data, role: 'postdoc' });
    return;
  }
  if (role === 'professor') {
    const data = ApprovalService.getPendingForRole('professor');
    res.status(200).json({ success: true, data, role: 'professor' });
    return;
  }
  const counts = ApprovalService.countPending();
  const postdocList = ApprovalService.getPendingForRole('postdoc');
  const profList = ApprovalService.getPendingForRole('professor');
  res.status(200).json({
    success: true,
    data: { counts, postdoc: postdocList, professor: profList },
  });
});

router.get('/counts', async (req: Request, res: Response): Promise<void> => {
  const data = ApprovalService.countPending();
  const body: ApiResponse<typeof data> = { success: true, data };
  res.status(200).json(body);
});

router.get('/', async (req: Request, res: Response): Promise<void> => {
  const query = {
    taskId: req.query.taskId as string | undefined,
    approverRole: req.query.approverRole as 'postdoc' | 'professor' | undefined,
    approved: req.query.approved !== undefined ? req.query.approved === 'true' : undefined,
    page: Number(req.query.page ?? 1),
    pageSize: Number(req.query.pageSize ?? 20),
  };
  const data: PaginatedResponse<ApprovalRecord> = ApprovalService.list(query);
  const body: ApiResponse<PaginatedResponse<ApprovalRecord>> = { success: true, data };
  res.status(200).json(body);
});

router.get('/task/:taskId', async (req: Request, res: Response): Promise<void> => {
  const data = ApprovalService.getByTask(req.params.taskId);
  const body: ApiResponse<ApprovalRecord[]> = { success: true, data };
  res.status(200).json(body);
});

router.post('/postdoc/:taskId', async (req: Request, res: Response): Promise<void> => {
  const userId = req.headers['x-user-id'] as string;
  const user = db.getById('users', userId) ?? db.findOne('users', (u) => u.role === 'postdoc');
  if (!user) {
    res.status(401).json({ success: false, error: '未授权' });
    return;
  }
  const { approved, comments, numericalStability } = req.body as {
    approved: boolean;
    comments: string;
    numericalStability: ApprovalRecord['numericalStability'];
  };
  if (typeof approved !== 'boolean' || !comments) {
    res.status(400).json({ success: false, error: '缺少审批结果或意见' });
    return;
  }
  const result = ApprovalService.submitPostdocApproval(user, req.params.taskId, {
    approved,
    comments,
    numericalStability: numericalStability ?? {
      convergenceRate: 0.95,
      residualNorm: 1e-5,
      massConservation: 0.998,
      overallScore: 88,
    },
  });
  if (!result) {
    res.status(400).json({ success: false, error: '当前任务不允许博士后审批' });
    return;
  }
  const body: ApiResponse<typeof result> = { success: true, data: result, message: '已提交验证' };
  res.status(200).json(body);
});

router.post('/professor/:taskId', async (req: Request, res: Response): Promise<void> => {
  const userId = req.headers['x-user-id'] as string;
  const user = db.getById('users', userId) ?? db.findOne('users', (u) => u.role === 'professor');
  if (!user) {
    res.status(401).json({ success: false, error: '未授权' });
    return;
  }
  const { approved, comments, physicalReasonability } = req.body as {
    approved: boolean;
    comments: string;
    physicalReasonability: ApprovalRecord['physicalReasonability'];
  };
  if (typeof approved !== 'boolean' || !comments) {
    res.status(400).json({ success: false, error: '缺少审批结果或意见' });
    return;
  }
  const result = ApprovalService.submitProfessorApproval(user, req.params.taskId, {
    approved,
    comments,
    physicalReasonability: physicalReasonability ?? {
      paramConsistency: 0.92,
      geologicalPlausibility: 0.88,
      resultAgreement: 0.9,
      overallScore: 90,
    },
  });
  if (!result) {
    res.status(400).json({ success: false, error: '当前任务不允许教授审批' });
    return;
  }
  const body: ApiResponse<typeof result> = { success: true, data: result, message: '已提交确认' };
  res.status(200).json(body);
});

export default router;
