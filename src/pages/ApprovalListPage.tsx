import { useState, useMemo } from "react";
import { ClipboardCheck, UserCircle, GraduationCap, Scroll, Clock, ChevronRight, AlertTriangle, AlertOctagon, AlertCircle, User, Search, FileWarning, CheckCircle2, XCircle, Flame, Waves, Activity } from "lucide-react";

type TabKey = "postdoc" | "professor" | "all";
type ApprovalStage = "postdoc" | "professor" | "completed" | "rejected";
type AlertLevel = "1" | "2" | "3";
type AlertType = "shear" | "coulomb" | "slip" | "comprehensive";

interface ApprovalItem {
  id: string;
  alertId: string;
  stage: ApprovalStage;
  level: AlertLevel;
  alertType: AlertType;
  taskName: string;
  taskId: string;
  creator: string;
  creatorRole: string;
  submitTime: string;
  summary: string;
  action: string;
  params?: { label: string; from: string; to: string };
  deadline?: string;
  handler?: string;
  finishTime?: string;
}

const levelMap = {
  "1": { label: "一级", border: "border-rose-500/40", bar: "bg-rose-500", bg: "bg-rose-500/10", text: "text-rose-400", icon: AlertOctagon },
  "2": { label: "二级", border: "border-orange-500/40", bar: "bg-orange-500", bg: "bg-orange-500/10", text: "text-orange-400", icon: AlertTriangle },
  "3": { label: "三级", border: "border-amber-500/40", bar: "bg-amber-500", bg: "bg-amber-500/10", text: "text-amber-400", icon: AlertCircle },
};

const typeMap = {
  shear: { label: "剪应力", icon: Flame, color: "text-rose-400", bg: "bg-rose-500/10" },
  coulomb: { label: "库仑应力", icon: Waves, color: "text-violet-400", bg: "bg-violet-500/10" },
  slip: { label: "滑动速率", icon: Activity, color: "text-emerald-400", bg: "bg-emerald-500/10" },
  comprehensive: { label: "综合", icon: FileWarning, color: "text-amber-400", bg: "bg-amber-500/10" },
};

const stageMap = {
  postdoc: { label: "博士后验证中", color: "text-sky-400", bg: "bg-sky-500/15", icon: UserCircle, showUrgent: true },
  professor: { label: "教授确认中", color: "text-violet-400", bg: "bg-violet-500/15", icon: GraduationCap, showUrgent: true },
  completed: { label: "审批通过", color: "text-emerald-400", bg: "bg-emerald-500/15", icon: CheckCircle2, showUrgent: false },
  rejected: { label: "已驳回", color: "text-rose-400", bg: "bg-rose-500/15", icon: XCircle, showUrgent: false },
};

const mockData: ApprovalItem[] = [
  {
    id: "APV-2026-0609-007",
    alertId: "ALT-2026-0609-001",
    stage: "postdoc",
    level: "1",
    alertType: "shear",
    taskName: "圣安德烈斯断层南段-大震模拟",
    taskId: "TASK-20260609-003",
    creator: "陈思远",
    creatorRole: "助理研究员",
    submitTime: "2026-06-09 14:58:22",
    summary: "LK-7节点剪应力达97.35kPa超阈值21.7%，建议调整摩擦系数至0.620以降低失稳风险",
    action: "调整摩擦系数 μ",
    params: { label: "摩擦系数", from: "0.580", to: "0.620" },
    deadline: "2026-06-10 14:58",
  },
  {
    id: "APV-2026-0609-006",
    alertId: "ALT-2026-0609-002",
    stage: "postdoc",
    level: "1",
    alertType: "comprehensive",
    taskName: "海原断裂带多参数耦合模拟",
    taskId: "TASK-20260608-017",
    creator: "王浩宇",
    creatorRole: "博士后",
    submitTime: "2026-06-09 13:42:10",
    summary: "HY-12剖面库仑应力0.723+滑速14.2mm/s双超阈值，拟调孔隙压力系数至0.375",
    action: "调整孔隙压力系数 λ",
    params: { label: "压力系数", from: "0.320", to: "0.375" },
    deadline: "2026-06-10 13:42",
  },
  {
    id: "APV-2026-0609-005",
    alertId: "ALT-2026-0609-003",
    stage: "professor",
    level: "2",
    alertType: "coulomb",
    taskName: "龙门山断裂带数值模拟",
    taskId: "TASK-20260607-009",
    creator: "李雪晴",
    creatorRole: "助理研究员",
    submitTime: "2026-06-09 11:30:55",
    summary: "LMS-5节点库仑应力0.678，博士后已验证调摩擦系数至0.645后应力回落至0.56，符合预期",
    action: "调整摩擦系数 μ",
    params: { label: "摩擦系数", from: "0.590", to: "0.645" },
    handler: "张明华 博士后",
  },
  {
    id: "APV-2026-0609-004",
    alertId: "ALT-2026-0609-005",
    stage: "professor",
    level: "3",
    alertType: "shear",
    taskName: "鲜水河断裂带稳态模拟",
    taskId: "TASK-20260608-005",
    creator: "赵天宇",
    creatorRole: "博士生",
    submitTime: "2026-06-09 09:10:33",
    summary: "XSH-8节点剪应力85.14kPa小幅超阈值，博士后验证认为趋势稳定建议确认无异常",
    action: "确认无异常",
    handler: "李文博 博士后",
  },
  {
    id: "APV-2026-0608-015",
    alertId: "ALT-2026-0608-018",
    stage: "completed",
    level: "2",
    alertType: "slip",
    taskName: "红河断裂带粘滑模拟",
    taskId: "TASK-20260607-014",
    creator: "陈思远",
    creatorRole: "助理研究员",
    submitTime: "2026-06-08 19:02:41",
    summary: "HH-15节点滑速13.28mm/s，调孔隙压力0.03后回归9.7mm/s，教授审批通过",
    action: "调整孔隙压力系数 λ",
    params: { label: "压力系数", from: "0.300", to: "0.330" },
    handler: "王建国 教授",
    finishTime: "2026-06-08 21:45:12",
  },
  {
    id: "APV-2026-0608-014",
    alertId: "ALT-2026-0608-015",
    stage: "completed",
    level: "2",
    alertType: "shear",
    taskName: "郯庐断裂带南段模拟",
    taskId: "TASK-20260606-021",
    creator: "林晓峰",
    creatorRole: "博士后",
    submitTime: "2026-06-08 10:15:18",
    summary: "TL-23节点调整摩擦系数0.60→0.64后剪应力从88.2降至74.5，验证通过",
    action: "调整摩擦系数 μ",
    params: { label: "摩擦系数", from: "0.600", to: "0.640" },
    handler: "周明辉 教授",
    finishTime: "2026-06-08 15:22:08",
  },
  {
    id: "APV-2026-0607-009",
    alertId: "ALT-2026-0607-006",
    stage: "rejected",
    level: "3",
    alertType: "coulomb",
    taskName: "祁连山北缘断裂参数扫描",
    taskId: "TASK-20260605-012",
    creator: "赵天宇",
    creatorRole: "博士生",
    submitTime: "2026-06-07 16:44:09",
    summary: "调参依据不充分，建议补充相邻节点敏感性分析后重新提交",
    action: "调整孔隙压力系数 λ",
    params: { label: "压力系数", from: "0.310", to: "0.340" },
    handler: "王建国 教授",
    finishTime: "2026-06-07 19:30:55",
  },
];

export default function ApprovalListPage() {
  const [activeTab, setActiveTab] = useState<TabKey>("postdoc");
  const [searchText, setSearchText] = useState("");

  const tabs: { key: TabKey; label: string; icon: typeof ClipboardCheck; count: number }[] = useMemo(() => [
    { key: "postdoc", label: "博士后待验证", icon: UserCircle, count: mockData.filter((d) => d.stage === "postdoc").length },
    { key: "professor", label: "教授待确认", icon: GraduationCap, count: mockData.filter((d) => d.stage === "professor").length },
    { key: "all", label: "全部历史", icon: Scroll, count: mockData.length },
  ], []);

  const filtered = useMemo(() => {
    let arr = mockData;
    if (activeTab === "postdoc") arr = arr.filter((d) => d.stage === "postdoc");
    else if (activeTab === "professor") arr = arr.filter((d) => d.stage === "professor");
    if (searchText) arr = arr.filter((d) => d.taskName.includes(searchText) || d.alertId.includes(searchText) || d.creator.includes(searchText));
    return arr;
  }, [activeTab, searchText]);

  const isUrgent = (item: ApprovalItem) => {
    if (item.stage !== "postdoc" && item.stage !== "professor") return false;
    if (!item.deadline) return false;
    const remain = (new Date(item.deadline).getTime() - Date.now()) / (1000 * 60 * 60);
    return remain < 6;
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-5">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-violet-500/15 border border-violet-500/30">
              <ClipboardCheck className="w-6 h-6 text-violet-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold">审批中心</h1>
              <p className="text-sm text-slate-400">两级复核审批流程 · 博士后验证 + 教授确认</p>
            </div>
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden mb-5">
          <div className="flex items-center border-b border-slate-800">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.key;
              return (
                <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                  className={`flex-1 flex items-center justify-center gap-2 px-5 py-4 text-sm font-medium transition-all relative ${active ? "text-violet-300 bg-slate-800/40" : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/20"}`}>
                  <Icon className={`w-4 h-4 ${active ? "text-violet-400" : ""}`} />
                  {tab.label}
                  {tab.count > 0 && (
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${active ? "bg-violet-500/25 text-violet-300" : "bg-slate-700/70 text-slate-300"}`}>{tab.count}</span>
                  )}
                  {active && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-violet-500 to-sky-500"></div>}
                </button>
              );
            })}
          </div>
          <div className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input value={searchText} onChange={(e) => setSearchText(e.target.value)} placeholder="搜索任务名 / 预警ID / 提交人..."
                className="w-full pl-10 pr-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-violet-500/50" />
            </div>
          </div>
        </div>

        <div className="space-y-3">
          {filtered.length === 0 && (
            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-12 text-center">
              <Scroll className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-500">暂无审批事项</p>
            </div>
          )}
          {filtered.map((item) => {
            const lc = levelMap[item.level];
            const tc = typeMap[item.alertType];
            const sc = stageMap[item.stage];
            const LevelIcon = lc.icon;
            const TypeIcon = tc.icon;
            const StageIcon = sc.icon;
            const urgent = isUrgent(item);
            return (
              <div key={item.id} className={`bg-slate-900/60 border rounded-xl p-5 transition-all hover:bg-slate-900/80 ${lc.border} relative overflow-hidden group`}>
                <div className={`absolute left-0 top-0 bottom-0 w-1 ${lc.bar}`}></div>
                <div className="flex items-start gap-4 pl-2">
                  <div className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center ${lc.bg} ring-2 ring-slate-800`}>
                    <LevelIcon className={`w-6 h-6 ${lc.text}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-2">
                          <span className={`px-2.5 py-0.5 rounded text-xs font-semibold ${lc.bg} ${lc.text} border ${lc.border}/40`}>{lc.label}预警</span>
                          <span className={`px-2 py-0.5 rounded text-[11px] flex items-center gap-1 ${tc.bg} ${tc.color}`}><TypeIcon className="w-3 h-3" />{tc.label}</span>
                          <span className={`px-2 py-0.5 rounded text-[11px] flex items-center gap-1 ${sc.bg} ${sc.color}`}><StageIcon className="w-3 h-3" />{sc.label}</span>
                          {urgent && (
                            <span className="px-2 py-0.5 rounded text-[11px] bg-rose-500/15 text-rose-400 border border-rose-500/30 flex items-center gap-1 animate-pulse">
                              <Clock className="w-3 h-3" /> 紧急 · 剩余不足6小时
                            </span>
                          )}
                        </div>
                        <h3 className="text-sm font-semibold text-slate-100 mb-1 truncate">{item.taskName}</h3>
                        <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">{item.summary}</p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {(item.stage === "postdoc") && (
                          <>
                            <button className="px-3 py-1.5 text-xs rounded-lg bg-rose-500/15 border border-rose-500/40 text-rose-400 hover:bg-rose-500/25 transition-all">驳回</button>
                            <button className="px-4 py-1.5 text-xs rounded-lg bg-sky-500/20 border border-sky-500/50 text-sky-400 hover:bg-sky-500/30 transition-all font-medium flex items-center gap-1">
                              开始验证 <ChevronRight className="w-3 h-3" />
                            </button>
                          </>
                        )}
                        {(item.stage === "professor") && (
                          <>
                            <button className="px-3 py-1.5 text-xs rounded-lg bg-rose-500/15 border border-rose-500/40 text-rose-400 hover:bg-rose-500/25 transition-all">驳回</button>
                            <button className="px-4 py-1.5 text-xs rounded-lg bg-violet-500/20 border border-violet-500/50 text-violet-400 hover:bg-violet-500/30 transition-all font-medium flex items-center gap-1">
                              审批确认 <ChevronRight className="w-3 h-3" />
                            </button>
                          </>
                        )}
                        {(item.stage === "completed" || item.stage === "rejected") && (
                          <button className="px-4 py-1.5 text-xs rounded-lg bg-slate-800/70 border border-slate-700 text-slate-300 hover:bg-slate-800 transition-all font-medium flex items-center gap-1">
                            查看详情 <ChevronRight className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-12 gap-3 text-xs">
                      <div className="col-span-3">
                        <div className="text-[11px] text-slate-500 mb-1 flex items-center gap-1"><FileWarning className="w-3 h-3" /> 关联预警</div>
                        <div className="text-slate-300 font-mono">{item.alertId}</div>
                      </div>
                      <div className="col-span-2">
                        <div className="text-[11px] text-slate-500 mb-1 flex items-center gap-1"><User className="w-3 h-3" /> 创建人</div>
                        <div className="text-slate-300">{item.creator} <span className="text-slate-500">({item.creatorRole})</span></div>
                      </div>
                      <div className="col-span-2">
                        <div className="text-[11px] text-slate-500 mb-1 flex items-center gap-1"><Clock className="w-3 h-3" /> 提交时间</div>
                        <div className="text-slate-300 font-mono">{item.submitTime}</div>
                      </div>
                      <div className="col-span-3">
                        <div className="text-[11px] text-slate-500 mb-1">处置措施</div>
                        <div className="text-slate-300 flex items-center gap-2">
                          <span className="text-slate-200">{item.action}</span>
                          {item.params && (
                            <span className="text-[10px] text-sky-400 font-mono bg-sky-500/10 px-1.5 py-0.5 rounded">{item.params.from} → {item.params.to}</span>
                          )}
                        </div>
                      </div>
                      <div className="col-span-2 text-right">
                        {item.finishTime ? (
                          <>
                            <div className="text-[11px] text-slate-500 mb-1">处理人 / 时间</div>
                            <div className="text-slate-300">
                              <div>{item.handler}</div>
                              <div className="font-mono text-slate-400">{item.finishTime}</div>
                            </div>
                          </>
                        ) : item.handler ? (
                          <>
                            <div className="text-[11px] text-slate-500 mb-1">当前处理人</div>
                            <div className="text-slate-300">{item.handler}</div>
                          </>
                        ) : item.deadline ? (
                          <>
                            <div className="text-[11px] text-slate-500 mb-1">处理期限</div>
                            <div className={`font-mono ${urgent ? "text-rose-400 font-semibold" : "text-slate-300"}`}>{item.deadline}</div>
                          </>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
