import { useState, useMemo } from "react";
import { AlertTriangle, AlertOctagon, AlertCircle, Filter, Search, CheckCircle, Clock, XCircle, ChevronRight, Flame, Waves, Activity, Gauge } from "lucide-react";

type AlertLevel = "1" | "2" | "3";
type AlertStatus = "pending" | "reviewing" | "resolved" | "ignored";
type AlertType = "shear" | "coulomb" | "slip" | "comprehensive";

interface AlertItem {
  id: string;
  level: AlertLevel;
  status: AlertStatus;
  type: AlertType;
  triggerTime: string;
  taskName: string;
  taskId: string;
  threshold: string;
  actualValue: string;
  unit: string;
  description: string;
  location: string;
}

const levelConfig = {
  "1": { label: "一级预警", border: "border-rose-500", bar: "bg-rose-500", bg: "bg-rose-500/5", hoverBg: "hover:bg-rose-500/10", badgeBg: "bg-rose-500/15", badgeText: "text-rose-400", ring: "ring-rose-500/20", icon: AlertOctagon, dot: "bg-rose-500" },
  "2": { label: "二级预警", border: "border-orange-500", bar: "bg-orange-500", bg: "bg-orange-500/5", hoverBg: "hover:bg-orange-500/10", badgeBg: "bg-orange-500/15", badgeText: "text-orange-400", ring: "ring-orange-500/20", icon: AlertTriangle, dot: "bg-orange-500" },
  "3": { label: "三级预警", border: "border-amber-500", bar: "bg-amber-500", bg: "bg-amber-500/5", hoverBg: "hover:bg-amber-500/10", badgeBg: "bg-amber-500/15", badgeText: "text-amber-400", ring: "ring-amber-500/20", icon: AlertCircle, dot: "bg-amber-500" },
};

const statusConfig = {
  pending: { label: "待复核", color: "text-sky-400", bg: "bg-sky-500/15", icon: Clock },
  reviewing: { label: "复核中", color: "text-violet-400", bg: "bg-violet-500/15", icon: Activity },
  resolved: { label: "已解决", color: "text-emerald-400", bg: "bg-emerald-500/15", icon: CheckCircle },
  ignored: { label: "已忽略", color: "text-slate-400", bg: "bg-slate-500/15", icon: XCircle },
};

const typeConfig = {
  shear: { label: "剪应力异常", icon: Flame, color: "text-rose-400" },
  coulomb: { label: "库仑应力异常", icon: Waves, color: "text-violet-400" },
  slip: { label: "滑动速率异常", icon: Activity, color: "text-emerald-400" },
  comprehensive: { label: "综合预警", icon: Gauge, color: "text-amber-400" },
};

const mockAlerts: AlertItem[] = [
  { id: "ALT-2026-0609-001", level: "1", status: "pending", type: "shear", triggerTime: "2026-06-09 14:32:18", taskName: "圣安德烈斯断层南段-大震模拟", taskId: "TASK-20260609-003", threshold: "80.00 kPa", actualValue: "97.35 kPa", unit: "kPa", description: "剪应力瞬时超过阈值21.7%，断层南段LK-7节点出现应力集中", location: "LK-7 节点 · 深度12.4km" },
  { id: "ALT-2026-0609-002", level: "1", status: "reviewing", type: "comprehensive", triggerTime: "2026-06-09 13:18:42", taskName: "海原断裂带多参数耦合模拟", taskId: "TASK-20260608-017", threshold: "0.600", actualValue: "0.723", unit: "μ", description: "库仑破裂函数与滑动速率同时超阈值，综合危险指数0.87", location: "HY-12 剖面 · 深度8.7km" },
  { id: "ALT-2026-0609-003", level: "2", status: "pending", type: "coulomb", triggerTime: "2026-06-09 11:05:56", taskName: "龙门山断裂带数值模拟", taskId: "TASK-20260607-009", threshold: "0.600", actualValue: "0.678", unit: "", description: "库仑应力超过阈值，断层中段P波速比异常", location: "LMS-5 节点 · 深度15.2km" },
  { id: "ALT-2026-0609-004", level: "2", status: "resolved", type: "slip", triggerTime: "2026-06-09 09:44:10", taskName: "郯庐断裂带南段模拟", taskId: "TASK-20260606-021", threshold: "12.00 mm/s", actualValue: "14.62 mm/s", unit: "mm/s", description: "滑动速率突增，调整摩擦系数后指标回归安全区间", location: "TL-23 节点 · 深度6.8km" },
  { id: "ALT-2026-0609-005", level: "3", status: "pending", type: "shear", triggerTime: "2026-06-09 08:22:33", taskName: "鲜水河断裂带稳态模拟", taskId: "TASK-20260608-005", threshold: "80.00 kPa", actualValue: "85.14 kPa", unit: "kPa", description: "剪应力缓慢上升超过阈值5.1%，趋势稳定", location: "XSH-8 节点 · 深度10.1km" },
  { id: "ALT-2026-0609-006", level: "3", status: "ignored", type: "coulomb", triggerTime: "2026-06-08 22:15:07", taskName: "祁连山北缘断裂参数扫描", taskId: "TASK-20260608-002", threshold: "0.600", actualValue: "0.612", unit: "", description: "数值振荡导致的瞬时超阈值，确认系伪异常", location: "QLS-3 节点 · 深度18.5km" },
  { id: "ALT-2026-0608-018", level: "2", status: "resolved", type: "slip", triggerTime: "2026-06-08 18:30:51", taskName: "红河断裂带粘滑模拟", taskId: "TASK-20260607-014", threshold: "12.00 mm/s", actualValue: "13.28 mm/s", unit: "mm/s", description: "调整孔隙压力系数0.03后滑动速率恢复至9.7mm/s", location: "HH-15 节点 · 深度11.3km" },
];

export default function AlertListPage() {
  const [levelFilter, setLevelFilter] = useState<AlertLevel | "all">("all");
  const [statusFilter, setStatusFilter] = useState<AlertStatus | "all">("all");
  const [typeFilter, setTypeFilter] = useState<AlertType | "all">("all");
  const [searchText, setSearchText] = useState("");

  const filteredAlerts = useMemo(() => {
    return mockAlerts.filter((a) => {
      if (levelFilter !== "all" && a.level !== levelFilter) return false;
      if (statusFilter !== "all" && a.status !== statusFilter) return false;
      if (typeFilter !== "all" && a.type !== typeFilter) return false;
      if (searchText && !a.taskName.includes(searchText) && !a.id.includes(searchText) && !a.location.includes(searchText)) return false;
      return true;
    });
  }, [levelFilter, statusFilter, typeFilter, searchText]);

  const stats = useMemo(() => ({
    total: mockAlerts.length,
    pending: mockAlerts.filter((a) => a.status === "pending").length,
    level1: mockAlerts.filter((a) => a.level === "1").length,
    reviewing: mockAlerts.filter((a) => a.status === "reviewing").length,
  }), []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-5">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-rose-500/15 border border-rose-500/30">
            <AlertTriangle className="w-6 h-6 text-rose-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold">预警中心</h1>
            <p className="text-sm text-slate-400">实时监测与管理所有触发的预警事件</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-5">
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
          <div className="text-xs text-slate-400 mb-1">全部预警</div>
          <div className="text-2xl font-bold">{stats.total}<span className="text-sm text-slate-500 ml-1">条</span></div>
        </div>
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
          <div className="text-xs text-slate-400 mb-1">待复核</div>
          <div className="text-2xl font-bold text-sky-400">{stats.pending}<span className="text-sm text-slate-500 ml-1">条</span></div>
        </div>
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
          <div className="text-xs text-slate-400 mb-1">复核中</div>
          <div className="text-2xl font-bold text-violet-400">{stats.reviewing}<span className="text-sm text-slate-500 ml-1">条</span></div>
        </div>
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
          <div className="text-xs text-slate-400 mb-1">一级预警</div>
          <div className="text-2xl font-bold text-rose-400">{stats.level1}<span className="text-sm text-slate-500 ml-1">条</span></div>
        </div>
      </div>

      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 mb-5">
        <div className="flex items-center gap-3 mb-4">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-sm font-medium text-slate-200">筛选条件</span>
        </div>
        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-4">
            <label className="block text-xs text-slate-400 mb-2">预警级别</label>
            <div className="flex gap-2">
              {(["all", "1", "2", "3"] as const).map((lv) => (
                <button key={lv} onClick={() => setLevelFilter(lv)}
                  className={`px-3 py-1.5 text-xs rounded-lg border transition-all ${levelFilter === lv ? "bg-sky-500/20 border-sky-500/50 text-sky-400" : "bg-slate-800/50 border-slate-700 text-slate-400 hover:border-slate-600"}`}>
                  {lv === "all" ? "全部" : `${lv}级`}
                </button>
              ))}
            </div>
          </div>
          <div className="col-span-4">
            <label className="block text-xs text-slate-400 mb-2">处理状态</label>
            <div className="flex gap-2 flex-wrap">
              {(["all", "pending", "reviewing", "resolved", "ignored"] as const).map((st) => (
                <button key={st} onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1.5 text-xs rounded-lg border transition-all ${statusFilter === st ? "bg-sky-500/20 border-sky-500/50 text-sky-400" : "bg-slate-800/50 border-slate-700 text-slate-400 hover:border-slate-600"}`}>
                  {st === "all" ? "全部" : statusConfig[st].label}
                </button>
              ))}
            </div>
          </div>
          <div className="col-span-4">
            <label className="block text-xs text-slate-400 mb-2">预警类型</label>
            <div className="flex gap-2 flex-wrap">
              {(["all", "shear", "coulomb", "slip", "comprehensive"] as const).map((tp) => (
                <button key={tp} onClick={() => setTypeFilter(tp)}
                  className={`px-3 py-1.5 text-xs rounded-lg border transition-all ${typeFilter === tp ? "bg-sky-500/20 border-sky-500/50 text-sky-400" : "bg-slate-800/50 border-slate-700 text-slate-400 hover:border-slate-600"}`}>
                  {tp === "all" ? "全部" : typeConfig[tp].label}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="mt-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input value={searchText} onChange={(e) => setSearchText(e.target.value)} placeholder="搜索任务名 / 预警ID / 节点位置..."
              className="w-full pl-10 pr-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500/50" />
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {filteredAlerts.length === 0 && (
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-12 text-center">
            <AlertCircle className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-500">暂无符合条件的预警记录</p>
          </div>
        )}
        {filteredAlerts.map((alert) => {
          const lc = levelConfig[alert.level];
          const sc = statusConfig[alert.status];
          const tc = typeConfig[alert.type];
          const LevelIcon = lc.icon;
          const StatusIcon = sc.icon;
          const TypeIcon = tc.icon;
          const overPercent = alert.level === "1" ? 21.7 : alert.level === "2" ? 12.3 : 5.1;
          return (
            <div key={alert.id} className={`relative bg-slate-900/60 border rounded-xl overflow-hidden transition-all ${lc.border} ${lc.hoverBg} group`}>
              <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${lc.bar}`}></div>
              <div className="flex items-stretch p-4 pl-5">
                <div className={`flex-shrink-0 w-14 h-14 rounded-xl flex items-center justify-center ${lc.badgeBg} ring-2 ${lc.ring} mr-4 relative`}>
                  <LevelIcon className={`w-7 h-7 ${lc.badgeText}`} />
                  <span className={`absolute -top-1 -right-1 w-3 h-3 rounded-full ${lc.dot} animate-ping opacity-75`}></span>
                  <span className={`absolute -top-1 -right-1 w-3 h-3 rounded-full ${lc.dot}`}></span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`px-2.5 py-0.5 rounded-md text-xs font-semibold ${lc.badgeBg} ${lc.badgeText} border ${lc.border}/30`}>{lc.label}</span>
                      <span className={`px-2.5 py-0.5 rounded-md text-xs flex items-center gap-1 ${sc.bg} ${sc.color}`}><StatusIcon className="w-3 h-3" />{sc.label}</span>
                      <span className={`px-2.5 py-0.5 rounded-md text-xs flex items-center gap-1 bg-slate-800/70 ${tc.color}`}><TypeIcon className="w-3 h-3" />{tc.label}</span>
                      <span className="text-xs text-slate-500 font-mono">{alert.id}</span>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button className="px-3 py-1.5 text-xs rounded-lg bg-slate-800/70 border border-slate-700 text-slate-300 hover:bg-slate-700/70 hover:border-slate-600 transition-all">忽略</button>
                      <button className="px-4 py-1.5 text-xs rounded-lg bg-sky-500/20 border border-sky-500/50 text-sky-400 hover:bg-sky-500/30 transition-all font-medium flex items-center gap-1">
                        快捷复核 <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                  <h3 className="text-sm font-semibold text-slate-100 mb-1.5 truncate">{alert.taskName}</h3>
                  <p className="text-xs text-slate-400 mb-3 line-clamp-1">{alert.description} · <span className="text-slate-500">{alert.location}</span></p>
                  <div className="grid grid-cols-4 gap-4">
                    <div>
                      <div className="text-[11px] text-slate-500 mb-1">触发时间</div>
                      <div className="text-xs text-slate-200 font-mono flex items-center gap-1"><Clock className="w-3 h-3 text-slate-500" />{alert.triggerTime}</div>
                    </div>
                    <div>
                      <div className="text-[11px] text-slate-500 mb-1">阈值</div>
                      <div className="text-xs text-slate-300 font-mono">{alert.threshold}</div>
                    </div>
                    <div>
                      <div className="text-[11px] text-slate-500 mb-1">实际值</div>
                      <div className={`text-xs font-mono font-semibold ${lc.badgeText}`}>{alert.actualValue} <span className="text-[10px]">↑{overPercent}%</span></div>
                    </div>
                    <div>
                      <div className="text-[11px] text-slate-500 mb-1">所属任务</div>
                      <div className="text-xs text-slate-300 font-mono truncate">{alert.taskId}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
