import { Router, type Request, type Response } from 'express';
import { db } from '../db/store.js';
import type { ApiResponse, Role, User } from '../../shared/types.js';

const router = Router();

const VALID_ROLES: Role[] = [
  'geologist',
  'postdoc',
  'professor',
  'chief',
  'assessor',
  'admin',
];

router.post('/login', async (req: Request, res: Response): Promise<void> => {
  const { userId, role } = req.body as {
    userId?: string;
    role?: Role | string;
  };

  let user: User | undefined;

  if (userId) {
    user = db.getById('users', userId);
  }

  if (!user && role) {
    const normalizedRole = String(role).toLowerCase() as Role;
    if (VALID_ROLES.includes(normalizedRole)) {
      user = db.findOne('users', (u) => u.role === normalizedRole);
    }
  }

  if (!user) {
    const users = db.getAll('users');
    if (users.length > 0) {
      user = users[0];
    } else {
      const fallback: User = {
        id: 'user-fallback',
        name: '访客用户',
        role: 'geologist',
        email: 'guest@geolab.cn',
        avatar: 'GK',
      };
      user = fallback;
    }
  }

  const tokenPayload = {
    userId: user!.id,
    role: user!.role,
    issuedAt: Date.now(),
  };
  const token = `mock-token-${Buffer.from(JSON.stringify(tokenPayload)).toString('base64')}`;

  const body: ApiResponse<{ user: User; token: string }> = {
    success: true,
    data: {
      user: user!,
      token,
    },
    message: '登录成功',
  };
  res.status(200).json(body);
});

router.get('/users', async (req: Request, res: Response): Promise<void> => {
  const users = db.getAll('users');
  const body: ApiResponse<User[]> = { success: true, data: users };
  res.status(200).json(body);
});

router.get('/me', async (req: Request, res: Response): Promise<void> => {
  const userId = (req.headers['x-user-id'] as string | undefined) ?? req.user?.id;
  if (!userId) {
    res.status(401).json({ success: false, error: '未登录' });
    return;
  }
  const user = db.getById('users', userId);
  if (!user) {
    res.status(404).json({ success: false, error: '用户不存在' });
    return;
  }
  const body: ApiResponse<User> = { success: true, data: user };
  res.status(200).json(body);
});

router.post('/logout', async (req: Request, res: Response): Promise<void> => {
  const body: ApiResponse = { success: true, message: '已退出登录' };
  res.status(200).json(body);
});

export default router;
