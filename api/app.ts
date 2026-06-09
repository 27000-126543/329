import express, {
  type Request,
  type Response,
  type NextFunction,
} from 'express';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';
import multer from 'multer';
import { fileURLToPath } from 'url';
import { initDatabase } from './db/init-db.js';
import { db } from './db/store.js';
import authRoutes from './routes/auth.js';
import dashboardRoutes from './routes/dashboard.js';
import tasksRoutes from './routes/tasks.js';
import alertsRoutes from './routes/alerts.js';
import approvalsRoutes from './routes/approvals.js';
import reportRoutes from './routes/report.js';
import recommendationsRoutes from './routes/recommendations.js';
import faultsRoutes from './routes/faults.js';
import statsRoutes from './routes/stats.js';
import type { User } from '../shared/types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

initDatabase();

const app: express.Application = express();

declare module 'express' {
  interface Request {
    user?: User;
  }
}

const UPLOADS_DIR = path.resolve(__dirname, '..', 'uploads');
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    const basename = path.basename(file.originalname, ext);
    cb(null, `${basename}-${uniqueSuffix}${ext}`);
  },
});

export const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 },
});

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use('/uploads', express.static(UPLOADS_DIR));

app.use((req: Request, res: Response, next: NextFunction): void => {
  const userId = req.headers['x-user-id'] as string | undefined;
  if (userId) {
    const user = db.getById('users', userId);
    if (user) {
      req.user = user;
    }
  }
  next();
});

app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/tasks', tasksRoutes);
app.use('/api/alerts', alertsRoutes);
app.use('/api/approvals', approvalsRoutes);
app.use('/api/report', reportRoutes);
app.use('/api/recommendations', recommendationsRoutes);
app.use('/api/faults', faultsRoutes);
app.use('/api/stats', statsRoutes);

app.get(
  '/api/health',
  (req: Request, res: Response, next: NextFunction): void => {
    res.status(200).json({
      success: true,
      message: 'ok',
    });
  },
);

app.post(
  '/api/upload',
  upload.single('file'),
  (req: Request, res: Response): void => {
    if (!req.file) {
      res.status(400).json({ success: false, error: '未上传文件' });
      return;
    }
    res.status(200).json({
      success: true,
      data: {
        id: req.file.filename,
        name: req.file.originalname,
        size: req.file.size,
        type: req.file.mimetype,
        path: `/uploads/${req.file.filename}`,
        uploadedAt: new Date().toISOString(),
      },
    });
  },
);

app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('[Error]', error.message, error.stack);
  if (error instanceof SyntaxError && 'body' in error) {
    res.status(400).json({
      success: false,
      error: '请求体 JSON 格式错误',
    });
    return;
  }
  res.status(500).json({
    success: false,
    error: '服务器内部错误',
  });
});

app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'API 不存在',
  });
});

export default app;
