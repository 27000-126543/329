import type {
  DailyStats,
  DashboardStats,
  SimulationTask,
} from '../../shared/types.js';
import { db } from '../db/store.js';

export class StatsService {
  static listDaily(days = 30): DailyStats[] {
    const all = db.getAll('dailyStats');
    return all
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-days);
  }

  static getByDate(date: string): DailyStats | undefined {
    return db.getById('dailyStats', date);
  }

  static getTrends(days = 30) {
    const stats = this.listDaily(days);
    return {
      completionRate: stats.map((s) => ({ date: s.date, value: s.completionRate })),
      avgAccuracy: stats.map((s) => ({ date: s.date, value: s.avgStressAccuracy })),
      avgResponseTime: stats.map((s) => ({ date: s.date, value: s.avgAlertResponseTime })),
      tasksCreated: stats.map((s) => ({ date: s.date, value: s.tasksCreated })),
      tasksCompleted: stats.map((s) => ({ date: s.date, value: s.tasksCompleted })),
      alertsTriggered: stats.map((s) => ({ date: s.date, value: s.alertsTriggered })),
      alertsResolved: stats.map((s) => ({ date: s.date, value: s.alertsResolved })),
      approvalsCompleted: stats.map((s) => ({ date: s.date, value: s.approvalsCompleted })),
    };
  }

  static getDashboard(): DashboardStats {
    const tasks = db.getAll('tasks');
    const alerts = db.getAll('alerts');
    const daily = this.listDaily(7);
    const completed = tasks.filter((t) =>
      ['completed', 'postdoc_approved', 'professor_approved', 'published'].includes(t.status),
    ).length;
    const created7d = daily.reduce((a, b) => a + b.tasksCreated, 0);
    const completionRate = created7d > 0
      ? daily.reduce((a, b) => a + b.tasksCompleted, 0) / Math.max(created7d, 1)
      : (completed / Math.max(tasks.length, 1));
    const pendingApprovals = tasks.filter((t) =>
      ['completed', 'postdoc_approved'].includes(t.status),
    ).length;
    const avgAccuracy = daily.length > 0
      ? daily.reduce((a, b) => a + b.avgStressAccuracy, 0) / daily.length
      : 0.88;
    const avgResponse = daily.length > 0
      ? daily.reduce((a, b) => a + b.avgAlertResponseTime, 0) / daily.length
      : 45;
    return {
      totalTasks: tasks.length,
      runningTasks: tasks.filter((t) =>
        ['mesh_generating', 'initializing', 'stress_computing', 'slip_evaluating'].includes(t.status),
      ).length,
      completionRate: +completionRate.toFixed(4),
      avgAccuracy: +avgAccuracy.toFixed(4),
      avgAlertResponseTime: +avgResponse.toFixed(1),
      pendingApprovals,
      activeAlerts: alerts.filter((a) => a.status === 'pending').length,
      level1Alerts: alerts.filter((a) => a.level === 'level1' && a.status === 'pending').length,
      level2Alerts: alerts.filter((a) => a.level === 'level2' && a.status === 'pending').length,
      level3Alerts: alerts.filter((a) => a.level === 'level3' && a.status === 'pending').length,
    };
  }

  static getTaskStatusDistribution(): Array<{
    status: SimulationTask['status'];
    count: number;
    label: string;
  }> {
    const labels: Record<SimulationTask['status'], string> = {
      pending_verify: '待校验',
      mesh_generating: '网格生成',
      initializing: '初始化',
      stress_computing: '应力计算',
      slip_evaluating: '滑动评估',
      completed: '完成待审批',
      rollback: '异常回退',
      postdoc_approved: '博士后已批',
      professor_approved: '教授已批',
      published: '已推送',
    };
    const tasks = db.getAll('tasks');
    const map = new Map<SimulationTask['status'], number>();
    for (const t of tasks) {
      map.set(t.status, (map.get(t.status) ?? 0) + 1);
    }
    const out: Array<{ status: SimulationTask['status']; count: number; label: string }> = [];
    for (const [status, count] of map.entries()) {
      out.push({ status, count, label: labels[status] });
    }
    return out.sort((a, b) => b.count - a.count);
  }

  static getRecentTasks(limit = 8): SimulationTask[] {
    return db
      .getAll('tasks')
      .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
      .slice(0, limit);
  }

  static getRecentAlerts(limit = 8) {
    return db
      .getAll('alerts')
      .sort((a, b) => +new Date(b.triggeredAt) - +new Date(a.triggeredAt))
      .slice(0, limit);
  }
}

export default StatsService;
