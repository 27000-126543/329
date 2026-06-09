import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  ListTodo,
  Plus,
  Search,
  Filter,
  ChevronRight,
  Play,
  Pause,
  Clock,
  Users,
  Mountain,
  AlertCircle,
  CheckCircle2,
  Eye,
} from "lucide-react";
import { cn } from "@/lib/utils";

type TaskStatus = "running" | "pending" | "completed" | "failed" | "paused";
type TaskPriority = "high" | "normal" | "low";

interface Task {
  id: string;
  shortId: string;
  name: string;
  faultName: string;
  faultCode: string;
  status: TaskStatus;
  priority: TaskPriority;
  progress: number;
  owner: string;
  ownerRole: string;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  eta?: string;
  alerts: number;
  steps: { current: number; total: number };
  computeHours: number;
}

const mockTasks: Task[] = [
  {
    id: "TASK-20260609-003",
    shortId: "#0609-003",
    name: "圣安德烈斯断层南段-大震模拟",
    faultName: "圣安德烈斯断层",
    faultCode: "SAF",
    status: "running",
    priority: "high",
    progress: 67,
    owner: "陈思远",
    ownerRole: "助理研究员",
    createdAt: "2026-06-09 10:15",
    startedAt: "2026-06-09 10:30",
    eta: "约48分钟",
    alerts: 2,
    steps: { current: 5672, total: 8400 },
    computeHours: 2.3,
  },
  {
    id: "TASK-20260608-017",
    shortId: "#0608-017",
    name: "海原断裂带多参数耦合模拟",
    faultName: "海原断裂带",
    faultCode: "HY",
    status: "running",
    priority: "high",
    progress: 34,
    owner: "王浩宇",
    ownerRole: "博士后",
    createdAt: "2026-06-08 22:40",
    startedAt: "2026-06-09 06:15",
    eta: "约2小时30分",
    alerts: 1,
    steps: { current: 2856, total: 8400 },
    computeHours: 8.7,
  },
  {
    id: "TASK-20260607-009",
    shortId: "#0607-009",
    name: "龙门山断裂带数值模拟",
    faultName: "龙门山断裂带",
    faultCode: "LMS",
    status: "pending",
    priority: "normal",
    progress: 0,
    owner: "李雪晴",
    ownerRole: "助理研究员",
    createdAt: "2026-06-07 16:30",
    eta: "排队中，约2小时后启动",
    alerts: 0,
    steps: { current: 0, total: 12000 },
    computeHours: 0,
  },
  {
    id: "TASK-20260608-005",
    shortId: "#0608-005",
    name: "鲜水河断裂带稳态模拟",
    faultName: "鲜水河断裂带",
    faultCode: "XSH",
    status: "paused",
    priority: "normal",
    progress: 45,
    owner: "赵天宇",
    ownerRole: "博士生",
    createdAt: "2026-06-08 08:20",
    startedAt: "2026-06-08 09:00",
    alerts: 3,
    steps: { current: 3780, total: 8400 },
    computeHours: 5.2,
  },
  {
    id: "TASK-20260606-021",
    shortId: "#0606-021",
    name: "郯庐断裂带南段模拟",
    faultName: "郯庐断裂带",
    faultCode: "TL",
    status: "completed",
    priority: "normal",
    progress: 100,
    owner: "林晓峰",
    ownerRole: "博士后",
    createdAt: "2026-06-06 11:45",
    startedAt: "2026-06-06 12:00",
    completedAt: "2026-06-06 18:30",
    alerts: 1,
    steps: { current: 6000, total: 6000 },
    computeHours: 6.5,
  },
  {
    id: "TASK-20260605-012",
    shortId: "#0605-012",
    name: "祁连山北缘断裂参数扫描",
    faultName: "祁连山北缘断裂",
    faultCode: "QLS",
    status: "completed",
    priority: "low",
    progress: 100,
    owner: "赵天宇",
    ownerRole: "博士生",
    createdAt: "2026-06-05 09:30",
    startedAt: "2026-06-05 10:00",
    completedAt: "2026-06-05 14:20",
    alerts: 0,
    steps: { current: 4800, total: 4800 },
    computeHours: 4.3,
  },
  {
    id: "TASK-20260604-008",
    shortId: "#0604-008",
    name: "红河断裂带粘滑模拟",
    faultName: "红河断裂带",
    faultCode: "HH",
    status: "failed",
    priority: "high",
    progress: 78,
    owner: "陈思远",
    ownerRole: "助理研究员",
    createdAt: "2026-06-04 14:00",
    startedAt: "2026-06-04 14:30",
    alerts: 5,
    steps: { current: 6552, total: 8400 },
    computeHours: 11.8,
  },
  {
    id: "TASK-20260603-015",
    shortId: "#0603-015",
    name: "小江断裂带分段参数标定",
    faultName: "小江断裂带",
    faultCode: "XJ",
    status: "completed",
    priority: "normal",
    progress: 100,
    owner: "王晓峰",
    ownerRole: "分析师",
    createdAt: "2026-06-03 16:20",
    startedAt: "2026-06-03 17:00",
    completedAt: "2026-06-04 02:15",
    alerts: 2,
    steps: { current: 9600, total: 9600 },
    computeHours: 9.2,
  },
];

const statusMap: Record<TaskStatus, { label: string; bg: string; dot: string; bar: string }> = {
  running: {
    label: "运行中",
    bg: "bg-sky-500/10 text-sky-400 border-sky-500/30",
    dot: "bg-sky-400 animate-pulse",
    bar: "from-sky-400 to-indigo-500",
  },
  pending: {
    label: "排队中",
    bg: "bg-amber-500/10 text-amber-400 border-amber-500/30",
    dot: "bg-amber-400",
    bar: "from-amber-400 to-orange-500",
  },
  completed: {
    label: "已完成",
    bg: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
    dot: "bg-emerald-400",
    bar: "from-emerald-400 to-teal-500",
  },
  failed: {
    label: "失败",
    bg: "bg-rose-500/10 text-rose-400 border-rose-500/30",
    dot: "bg-rose-400",
    bar: "from-rose-400 to-red-500",
  },
  paused: {
    label: "已暂停",
    bg: "bg-slate-500/10 text-slate-400 border-slate-500/30",
    dot: "bg-slate-400",
    bar: "from-slate-400 to-slate-500",
  },
};

const priorityMap: Record<TaskPriority, { label: string; bg: string }> = {
  high: { label: "高", bg: "bg-rose-50 text-rose-600 border-rose-200" },
  normal: { label: "中", bg: "bg-sky-50 text-sky-600 border-sky-200" },
  low: { label: "低", bg: "bg-slate-50 text-slate-600 border-slate-200" },
};

export default function TaskListPage() {
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState<TaskStatus | "all">("all");
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | "all">("all");

  const filtered = useMemo(() => {
    return mockTasks.filter((t) => {
      if (searchText && !t.name.includes(searchText) && !t.id.includes(searchText) && !t.faultName.includes(searchText)) {
        return false;
      }
      if (statusFilter !== "all" && t.status !== statusFilter) return false;
      if (priorityFilter !== "all" && t.priority !== priorityFilter) return false;
      return true;
    });
  }, [searchText, statusFilter, priorityFilter]);

  const stats = useMemo(
    () => ({
      total: mockTasks.length,
      running: mockTasks.filter((t) => t.status === "running").length,
      pending: mockTasks.filter((t) => t.status === "pending").length,
      completed: mockTasks.filter((t) => t.status === "completed").length,
    }),
    []
  );

  const statusTabs: { key: TaskStatus | "all"; label: string; count: number; icon?: typeof Play }[] = [
    { key: "all", label: "全部", count: stats.total },
    { key: "running", label: "运行中", count: stats.running, icon: Play },
    { key: "pending", label: "排队中", count: stats.pending, icon: Clock },
    { key: "completed", label: "已完成", count: stats.completed, icon: CheckCircle2 },
  ];

  return (
    <div className="min-h-screen bg-slate-50 p-5 lg:p-6">
      <div className="max-w-[1400px] mx-auto space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl shadow-lg">
              <ListTodo className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">任务管理</h1>
              <p className="text-sm text-slate-500">数值模拟任务的创建、调度与状态监控</p>
            </div>
          </div>
          <Link
            to="/tasks/create"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-medium rounded-xl shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all"
          >
            <Plus className="w-4 h-4" />
            新建任务
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "任务总数", value: stats.total, suffix: "个", color: "from-indigo-500 to-violet-500" },
            { label: "运行中", value: stats.running, suffix: "个", color: "from-sky-500 to-cyan-500" },
            { label: "排队中", value: stats.pending, suffix: "个", color: "from-amber-500 to-orange-500" },
            { label: "本月完成", value: stats.completed, suffix: "个", color: "from-emerald-500 to-teal-500" },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-xl border border-slate-200 p-5">
              <div className="text-xs text-slate-500 mb-2">{s.label}</div>
              <div className="flex items-baseline gap-1">
                <span
                  className={cn(
                    "text-3xl font-bold bg-gradient-to-r bg-clip-text text-transparent",
                    s.color
                  )}
                >
                  {s.value}
                </span>
                <span className="text-sm text-slate-400">{s.suffix}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 space-y-4">
            <div className="flex flex-wrap gap-2">
              {statusTabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.key}
                    onClick={() => setStatusFilter(tab.key)}
                    className={cn(
                      "inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
                      statusFilter === tab.key
                        ? "bg-indigo-50 text-indigo-600 border border-indigo-200"
                        : "text-slate-600 hover:bg-slate-50 border border-transparent"
                    )}
                  >
                    {Icon && <Icon className="w-3.5 h-3.5" />}
                    {tab.label}
                    <span
                      className={cn(
                        "px-1.5 py-0.5 rounded text-xs font-bold",
                        statusFilter === tab.key ? "bg-indigo-100 text-indigo-700" : "bg-slate-100 text-slate-600"
                      )}
                    >
                      {tab.count}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="flex flex-wrap gap-3 items-center">
              <div className="relative flex-1 min-w-[200px] max-w-md">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  placeholder="搜索任务名称、编号、断层..."
                  className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                />
              </div>
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-slate-400" />
                <select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value as TaskPriority | "all")}
                  className="px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="all">全部优先级</option>
                  <option value="high">高优先级</option>
                  <option value="normal">中优先级</option>
                  <option value="low">低优先级</option>
                </select>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600">任务信息</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600">状态 / 进度</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600">负责人</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600">时间信息</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600">预警</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-slate-600">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-16 text-center">
                      <Search className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                      <p className="text-slate-500 font-medium">没有匹配的任务</p>
                      <p className="text-sm text-slate-400 mt-1">试试修改筛选条件</p>
                    </td>
                  </tr>
                )}
                {filtered.map((task) => {
                  const sm = statusMap[task.status];
                  const pm = priorityMap[task.priority];
                  return (
                    <tr key={task.id} className="hover:bg-slate-50 transition">
                      <td className="px-6 py-4">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center flex-shrink-0">
                            <ListTodo className="w-5 h-5 text-indigo-500" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <Link
                                to={`/tasks/${task.id.replace("TASK-", "")}`}
                                className="text-sm font-semibold text-slate-800 hover:text-indigo-600 transition truncate max-w-xs"
                              >
                                {task.name}
                              </Link>
                              <span className={cn("px-1.5 py-0.5 rounded text-[10px] font-semibold border", pm.bg)}>
                                P{pm.label}
                              </span>
                              {task.alerts > 0 && (
                                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-rose-50 text-rose-600 border border-rose-200">
                                  <AlertCircle className="w-3 h-3" />
                                  {task.alerts}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-xs text-slate-500">
                              <span className="font-mono text-slate-400">{task.shortId}</span>
                              <span>·</span>
                              <span className="inline-flex items-center gap-1">
                                <Mountain className="w-3 h-3 text-slate-400" />
                                {task.faultName}
                                <span className="text-slate-400">({task.faultCode})</span>
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-2 min-w-[180px]">
                          <span
                            className={cn(
                              "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border",
                              sm.bg
                            )}
                          >
                            <span className={cn("w-1.5 h-1.5 rounded-full", sm.dot)} />
                            {sm.label}
                          </span>
                          <div>
                            <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
                              <span>
                                {task.steps.current.toLocaleString()} / {task.steps.total.toLocaleString()} 步
                              </span>
                              <span className="font-mono font-semibold text-slate-700">{task.progress}%</span>
                            </div>
                            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className={cn("h-full rounded-full bg-gradient-to-r transition-all duration-500", sm.bar)}
                                style={{ width: `${task.progress}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-sky-400 to-indigo-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                            {task.owner.charAt(0)}
                          </div>
                          <div>
                            <div className="text-sm font-medium text-slate-800">{task.owner}</div>
                            <div className="text-[11px] text-slate-500">{task.ownerRole}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1 text-xs">
                          <div className="text-slate-500">
                            <span className="inline-flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              创建: {task.createdAt}
                            </span>
                          </div>
                          {task.startedAt && (
                            <div className="text-slate-500">启动: {task.startedAt}</div>
                          )}
                          {task.completedAt ? (
                            <div className="text-emerald-600 font-medium">完成: {task.completedAt}</div>
                          ) : task.eta ? (
                            <div className="text-indigo-600 font-medium inline-flex items-center gap-1">
                              {task.status === "pending" ? (
                                <Clock className="w-3 h-3" />
                              ) : (
                                <Play className="w-3 h-3" />
                              )}
                              {task.eta}
                            </div>
                          ) : null}
                          <div className="text-slate-400">计算耗时: {task.computeHours.toFixed(1)} 机时</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {task.alerts > 0 ? (
                          <Link
                            to="/alerts"
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100 transition"
                          >
                            <AlertCircle className="w-3.5 h-3.5" />
                            {task.alerts} 条
                          </Link>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs text-slate-400">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            正常
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="inline-flex items-center gap-1">
                          {task.status === "running" && (
                            <button className="p-2 rounded-lg text-slate-500 hover:text-amber-600 hover:bg-amber-50 transition" title="暂停">
                              <Pause className="w-4 h-4" />
                            </button>
                          )}
                          {task.status === "paused" && (
                            <button className="p-2 rounded-lg text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 transition" title="继续">
                              <Play className="w-4 h-4" />
                            </button>
                          )}
                          <Link
                            to={`/tasks/${task.id.replace("TASK-", "")}`}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 transition"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            详情
                            <ChevronRight className="w-3 h-3" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-sm text-slate-500">
            <span>
              共 <span className="font-semibold text-slate-700">{filtered.length}</span> 条任务
            </span>
            <div className="flex items-center gap-1">
              <button className="px-3 py-1 rounded border border-slate-200 text-slate-400 cursor-not-allowed">
                上一页
              </button>
              <button className="px-3 py-1 rounded bg-indigo-50 text-indigo-600 border border-indigo-200 font-medium">
                1
              </button>
              <button className="px-3 py-1 rounded border border-slate-200 hover:bg-slate-100 text-slate-600">
                2
              </button>
              <button className="px-3 py-1 rounded border border-slate-200 hover:bg-slate-100 text-slate-600">
                下一页
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
