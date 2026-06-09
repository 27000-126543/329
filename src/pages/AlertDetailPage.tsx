import { useState } from "react";
import { AlertOctagon, ArrowRight, Clock, MapPin, FileText, User, Send, CheckCircle, Sliders, Droplets, ShieldAlert, History, ChevronRight, TrendingUp, AlertTriangle } from "lucide-react";

interface HistoryAlert {
  id: string;
  time: string;
  value: string;
  status: "resolved" | "ignored" | "pending";
  handler: string;
}

const level1Config = {
  label: "一级预警 · 严重",
  capsuleBg: "bg-gradient-to-r from-rose-600 to-rose-500",
  capsuleBorder: "border-rose-400/50",
  cardBg: "bg-rose-500/10",
  cardBorder: "border-rose-500/30",
  text: "text-rose-400",
  textLight: "text-rose-300",
  bar: "bg-rose-500",
};

const mockHistory: HistoryAlert[] = [
  { id: "ALT-2026-0528-004", time: "2026-05-28 09:15:32", value: "92.4 kPa", status: "resolved", handler: "张明华 博士后" },
  { id: "ALT-2026-0517-011", time: "2026-05-17 22:42:11", value: "88.7 kPa", status: "resolved", handler: "李文博 博士后" },
  { id: "ALT-2026-0503-002", time: "2026-05-03 14:08:55", value: "86.1 kPa", status: "ignored", handler: "王建国 教授" },
  { id: "ALT-2026-0422-008", time: "2026-04-22 07:33:18", value: "95.6 kPa", status: "resolved", handler: "张明华 博士后" },
];

const statusBadge = {
  resolved: { label: "已解决", bg: "bg-emerald-500/15", color: "text-emerald-400" },
  ignored: { label: "已忽略", bg: "bg-slate-500/15", color: "text-slate-400" },
  pending: { label: "待复核", bg: "bg-sky-500/15", color: "text-sky-400" },
};

type ReviewAction = "friction" | "pressure" | "ignore" | null;

export default function AlertDetailPage() {
  const [selectedAction, setSelectedAction] = useState<ReviewAction>(null);
  const [frictionValue, setFrictionValue] = useState(0.62);
  const [pressureValue, setPressureValue] = useState(0.35);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const actualVal = 97.35;
  const thresholdVal = 80.0;
  const overPct = ((actualVal - thresholdVal) / thresholdVal * 100).toFixed(1);

  const handleSubmit = () => {
    if (!selectedAction) return;
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitted(true);
    }, 1500);
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 p-5 flex items-center justify-center">
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-12 max-w-md text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-emerald-500/15 flex items-center justify-center">
            <CheckCircle className="w-12 h-12 text-emerald-400" />
          </div>
          <h2 className="text-xl font-bold mb-2">复核提交成功</h2>
          <p className="text-slate-400 text-sm mb-6">
            已记录您的复核意见，预警状态已更新。{selectedAction === "friction" && "调整摩擦系数的参数已重新入队计算。"}
            {selectedAction === "pressure" && "调整孔隙压力的参数已重新入队计算。"}
            {selectedAction === "ignore" && "系统将在后续同类预警中学习此判断模式。"}
          </p>
          <button onClick={() => { setSubmitted(false); setSelectedAction(null); setComment(""); }}
            className="px-6 py-2 rounded-lg bg-sky-500/20 border border-sky-500/50 text-sky-400 text-sm hover:bg-sky-500/30 transition-all">
            继续查看详情
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-5">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <button className="px-3 py-1.5 rounded-lg bg-slate-800/60 border border-slate-700 text-slate-400 text-xs hover:bg-slate-800 hover:text-slate-200 transition-all flex items-center gap-1">
              ← 返回预警列表
            </button>
            <div className="w-px h-6 bg-slate-700 mx-1"></div>
            <div>
              <h1 className="text-xl font-bold">预警详情</h1>
              <p className="text-xs text-slate-500 font-mono">ALT-2026-0609-001</p>
            </div>
          </div>
          <div className={`px-4 py-2 rounded-full ${level1Config.capsuleBg} ${level1Config.capsuleBorder} border flex items-center gap-2 shadow-lg shadow-rose-500/20`}>
            <AlertOctagon className="w-4 h-4 text-white" />
            <span className="text-sm font-semibold text-white">{level1Config.label}</span>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-5">
          <div className="col-span-7 space-y-5">
            <div className={`${level1Config.cardBg} ${level1Config.cardBorder} border rounded-xl p-5`}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold flex items-center gap-2">
                  <TrendingUp className={`w-4 h-4 ${level1Config.text}`} />
                  异常数值对比
                </h2>
                <span className="text-xs text-slate-400 font-mono">LK-7 节点 · 深度 12.4 km</span>
              </div>
              <div className="grid grid-cols-2 gap-5">
                <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-800">
                  <div className="text-xs text-slate-400 mb-1">阈值 (安全上限)</div>
                  <div className="text-3xl font-bold text-emerald-400 mb-2">{thresholdVal.toFixed(2)}<span className="text-sm font-normal text-slate-500 ml-1">kPa</span></div>
                  <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full w-4/5 bg-emerald-500/70 rounded-full"></div>
                  </div>
                </div>
                <div className="bg-slate-900/50 rounded-lg p-4 border border-rose-500/30">
                  <div className="text-xs text-slate-400 mb-1 flex items-center justify-between">
                    <span>实际监测值</span>
                    <span className="text-rose-400 font-semibold">↑ {overPct}%</span>
                  </div>
                  <div className="text-3xl font-bold text-rose-400 mb-2">{actualVal}<span className="text-sm font-normal text-slate-500 ml-1">kPa</span></div>
                  <div className="h-2 bg-slate-800 rounded-full overflow-hidden relative">
                    <div className="absolute left-4/5 top-0 bottom-0 w-px bg-white/30 z-10"></div>
                    <div className="h-full bg-gradient-to-r from-amber-500 to-rose-500 rounded-full" style={{ width: `${Math.min(100, (actualVal / 120) * 100)}%` }}></div>
                  </div>
                </div>
              </div>
              <div className="mt-4 p-3 rounded-lg bg-slate-900/40 border border-slate-800/50 flex items-start gap-3">
                <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                <div className="text-xs text-slate-300 leading-relaxed">
                  <span className="text-amber-400 font-semibold">风险提示：</span>
                  该节点剪应力值已显著超过安全阈值，根据历史数据统计，LK-7节点在该应力水平下发生粘滑失稳的条件概率为 <span className="text-rose-400 font-semibold">37.6%</span>，建议立即采取参数调整措施或提交上级确认。
                </div>
              </div>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5">
              <h2 className="text-sm font-semibold mb-4 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-sky-400" />
                影响范围描述
              </h2>
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-3 rounded-lg bg-slate-800/40 border border-slate-700/50 text-center">
                    <div className="text-[11px] text-slate-500 mb-1">空间范围</div>
                    <div className="text-sm font-semibold text-slate-200">~ 4.2 km³</div>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-800/40 border border-slate-700/50 text-center">
                    <div className="text-[11px] text-slate-500 mb-1">影响节点数</div>
                    <div className="text-sm font-semibold text-amber-400">18 个</div>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-800/40 border border-slate-700/50 text-center">
                    <div className="text-[11px] text-slate-500 mb-1">邻近断面</div>
                    <div className="text-sm font-semibold text-slate-200">LK-6, LK-8</div>
                  </div>
                </div>
                <div className="p-4 rounded-lg bg-slate-800/30 border border-slate-700/40">
                  <div className="text-xs text-slate-400 mb-2">详细描述</div>
                  <p className="text-sm text-slate-300 leading-relaxed">
                    异常位于圣安德烈斯断层南段LK-7节点，坐标 <span className="font-mono text-slate-400">(N35°42′18″, W117°38′44″)</span>，深度12.4km。
                    应力异常椭球长轴走向 N35°W，与断层走向基本一致。高应力区向LK-6方向延伸约1.8km，向LK-8方向延伸约1.2km。
                    该区域岩性以花岗岩与片麻岩互层为主，摩擦系数本构参数取0.58~0.68，孔隙流体压力系数0.32~0.38。
                    当前应力集中可能受周边3个网格节点的边界条件加载速率影响，需重点关注时间步5800~6200的演化趋势。
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5">
              <h2 className="text-sm font-semibold mb-4 flex items-center gap-2">
                <History className="w-4 h-4 text-violet-400" />
                历史同类预警记录 <span className="text-xs font-normal text-slate-500">(LK-7节点 · 近90天)</span>
              </h2>
              <div className="space-y-2">
                {mockHistory.map((h, idx) => (
                  <div key={h.id} className="flex items-center gap-4 p-3 rounded-lg bg-slate-800/30 border border-slate-700/40 hover:bg-slate-800/50 transition-all cursor-pointer group">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-xs font-semibold text-slate-400">{idx + 1}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-mono text-slate-400">{h.id}</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${statusBadge[h.status].bg} ${statusBadge[h.status].color}`}>{statusBadge[h.status].label}</span>
                      </div>
                      <div className="flex items-center gap-4 text-xs">
                        <span className="text-slate-500 flex items-center gap-1"><Clock className="w-3 h-3" />{h.time}</span>
                        <span className="text-rose-400 font-semibold">峰值 {h.value}</span>
                        <span className="text-slate-500 flex items-center gap-1"><User className="w-3 h-3" />{h.handler}</span>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-slate-400 transition-all" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="col-span-5">
            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 sticky top-5">
              <h2 className="text-sm font-semibold mb-4 flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-400" />
                复核处置表单
              </h2>

              <div className="space-y-3 mb-5">
                <div className="text-xs text-slate-400 mb-2">请选择一项处置措施：</div>
                <button onClick={() => setSelectedAction("friction")}
                  className={`w-full text-left p-4 rounded-xl border transition-all ${selectedAction === "friction" ? "bg-sky-500/10 border-sky-500/60 ring-2 ring-sky-500/20" : "bg-slate-800/30 border-slate-700/50 hover:border-slate-600 hover:bg-slate-800/50"}`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${selectedAction === "friction" ? "bg-sky-500/20" : "bg-slate-800"}`}>
                      <Sliders className={`w-5 h-5 ${selectedAction === "friction" ? "text-sky-400" : "text-slate-500"}`} />
                    </div>
                    <div className="flex-1">
                      <div className={`text-sm font-semibold mb-0.5 ${selectedAction === "friction" ? "text-sky-300" : "text-slate-200"}`}>调整摩擦系数 μ</div>
                      <div className="text-xs text-slate-500">重新标定 Rate-and-State 参数，提高断层稳定性</div>
                    </div>
                    {selectedAction === "friction" && <CheckCircle className="w-5 h-5 text-sky-400 flex-shrink-0" />}
                  </div>
                  {selectedAction === "friction" && (
                    <div className="mt-4 pt-4 border-t border-sky-500/20">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs text-slate-400">摩擦系数 μ</span>
                        <span className="text-lg font-bold text-sky-400 font-mono">{frictionValue.toFixed(3)}</span>
                      </div>
                      <input type="range" min="0.50" max="0.75" step="0.005" value={frictionValue} onChange={(e) => setFrictionValue(parseFloat(e.target.value))}
                        className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-500" />
                      <div className="flex justify-between mt-2 text-[10px] text-slate-600 font-mono">
                        <span>0.500</span><span className="text-slate-500">原值 0.580</span><span>0.750</span>
                      </div>
                      <div className="mt-3 p-2.5 rounded-lg bg-sky-500/5 border border-sky-500/15 text-[11px] text-slate-400 leading-relaxed">
                        预计调整后剪应力峰值将回落至 <span className="text-emerald-400 font-semibold">72.4~76.8 kPa</span> 区间，回归安全阈值以下。重算耗时约 <span className="text-sky-400 font-semibold">48 分钟</span>。
                      </div>
                    </div>
                  )}
                </button>

                <button onClick={() => setSelectedAction("pressure")}
                  className={`w-full text-left p-4 rounded-xl border transition-all ${selectedAction === "pressure" ? "bg-cyan-500/10 border-cyan-500/60 ring-2 ring-cyan-500/20" : "bg-slate-800/30 border-slate-700/50 hover:border-slate-600 hover:bg-slate-800/50"}`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${selectedAction === "pressure" ? "bg-cyan-500/20" : "bg-slate-800"}`}>
                      <Droplets className={`w-5 h-5 ${selectedAction === "pressure" ? "text-cyan-400" : "text-slate-500"}`} />
                    </div>
                    <div className="flex-1">
                      <div className={`text-sm font-semibold mb-0.5 ${selectedAction === "pressure" ? "text-cyan-300" : "text-slate-200"}`}>调整孔隙压力系数 λ</div>
                      <div className="text-xs text-slate-500">改变孔隙流体压力场分布，降低有效应力</div>
                    </div>
                    {selectedAction === "pressure" && <CheckCircle className="w-5 h-5 text-cyan-400 flex-shrink-0" />}
                  </div>
                  {selectedAction === "pressure" && (
                    <div className="mt-4 pt-4 border-t border-cyan-500/20">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs text-slate-400">孔隙压力系数 λ</span>
                        <span className="text-lg font-bold text-cyan-400 font-mono">{pressureValue.toFixed(3)}</span>
                      </div>
                      <input type="range" min="0.20" max="0.50" step="0.005" value={pressureValue} onChange={(e) => setPressureValue(parseFloat(e.target.value))}
                        className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500" />
                      <div className="flex justify-between mt-2 text-[10px] text-slate-600 font-mono">
                        <span>0.200</span><span className="text-slate-500">原值 0.320</span><span>0.500</span>
                      </div>
                      <div className="mt-3 p-2.5 rounded-lg bg-cyan-500/5 border border-cyan-500/15 text-[11px] text-slate-400 leading-relaxed">
                        预计调整后库仑应力降至 <span className="text-emerald-400 font-semibold">0.51~0.54</span>，综合失稳概率下降至 <span className="text-emerald-400 font-semibold">8.3%</span>。重算耗时约 <span className="text-cyan-400 font-semibold">62 分钟</span>。
                      </div>
                    </div>
                  )}
                </button>

                <button onClick={() => setSelectedAction("ignore")}
                  className={`w-full text-left p-4 rounded-xl border transition-all ${selectedAction === "ignore" ? "bg-slate-500/10 border-slate-500/60 ring-2 ring-slate-500/20" : "bg-slate-800/30 border-slate-700/50 hover:border-slate-600 hover:bg-slate-800/50"}`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${selectedAction === "ignore" ? "bg-slate-600/30" : "bg-slate-800"}`}>
                      <ShieldAlert className={`w-5 h-5 ${selectedAction === "ignore" ? "text-slate-300" : "text-slate-500"}`} />
                    </div>
                    <div className="flex-1">
                      <div className={`text-sm font-semibold mb-0.5 ${selectedAction === "ignore" ? "text-slate-200" : "text-slate-200"}`}>确认无异常</div>
                      <div className="text-xs text-slate-500">经人工判断为数值振荡或伪异常，不做修改</div>
                    </div>
                    {selectedAction === "ignore" && <CheckCircle className="w-5 h-5 text-slate-300 flex-shrink-0" />}
                  </div>
                </button>
              </div>

              <div className="mb-5">
                <label className="block text-xs text-slate-400 mb-2">复核意见 <span className="text-rose-400">*</span></label>
                <textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={4}
                  placeholder="请详细说明判断依据、参考资料或计算背景，为后续审批提供支撑..."
                  className="w-full px-3 py-2.5 bg-slate-800/50 border border-slate-700 rounded-lg text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500/50 resize-none" />
                <div className="flex justify-between mt-1.5 text-[10px] text-slate-600">
                  <span>建议不少于20字</span>
                  <span>{comment.length} / 500</span>
                </div>
              </div>

              <button onClick={handleSubmit} disabled={!selectedAction || isSubmitting || comment.length < 5}
                className={`w-full py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all ${!selectedAction || isSubmitting || comment.length < 5
                    ? "bg-slate-800 border border-slate-700 text-slate-500 cursor-not-allowed"
                    : "bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white shadow-lg shadow-sky-500/20"
                  }`}>
                {isSubmitting ? (
                  <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> 提交中...</>
                ) : (
                  <><Send className="w-4 h-4" /> 提交复核并进入审批流程 <ArrowRight className="w-4 h-4" /></>
                )}
              </button>
              <div className="mt-4 p-3 rounded-lg bg-slate-800/30 border border-slate-700/40 text-[11px] text-slate-500 leading-relaxed">
                <div className="flex items-center gap-1.5 mb-1.5 text-slate-400">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span className="font-semibold">审批流程</span>
                </div>
                提交后将依次由 <span className="text-slate-300">博士后工作站</span>（T+1工作日）进行数值稳定性验证，验证通过后提交 <span className="text-slate-300">教授委员会</span>（T+2工作日）进行最终确认。
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
