import { useState } from "react";
import { UserCircle, CheckCircle2, XCircle, ArrowRight, Clock, AlertOctagon, FileText, User, Sliders, Droplets, ShieldAlert, TrendingUp, Eye, FileWarning, CheckSquare } from "lucide-react";

interface Metric {
  label: string;
  score: number;
  value: string;
  passLine: number;
  desc: string;
  icon: "converge" | "residual" | "mass" | "energy";
}

const metricColors = {
  pass: { ring: "stroke-emerald-400", bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/30" },
  warn: { ring: "stroke-amber-400", bg: "bg-amber-500/10", text: "text-amber-400", border: "border-amber-500/30" },
  fail: { ring: "stroke-rose-400", bg: "bg-rose-500/10", text: "text-rose-400", border: "border-rose-500/30" },
};

function getMetricStatus(score: number) {
  if (score >= 80) return metricColors.pass;
  if (score >= 60) return metricColors.warn;
  return metricColors.fail;
}

function CircularProgress({ score, size = 88, stroke = 7 }: { score: number; size?: number; stroke?: number }) {
  const status = getMetricStatus(score);
  const radius = (size - stroke) / 2;
  const circum = 2 * Math.PI * radius;
  const offset = circum - (score / 100) * circum;
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#1e293b" strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" className={status.ring} strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={circum} strokeDashoffset={offset} style={{ transition: "stroke-dashoffset 0.8s ease" }} />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className={`text-lg font-bold ${status.text}`}>{score}</span>
      </div>
    </div>
  );
}

const metrics: Metric[] = [
  { label: "收敛率 R", score: 92, value: "2.3×10⁻⁴", passLine: 1e-3, desc: "牛顿迭代残差下降速率，>80为优秀", icon: "converge" },
  { label: "动量残差", score: 78, value: "8.7×10⁻⁵", passLine: 5e-4, desc: "动量守恒方程残差范数", icon: "residual" },
  { label: "质量守恒", score: 85, value: "4.1×10⁻⁶", passLine: 1e-4, desc: "连续性方程满足程度", icon: "mass" },
  { label: "能量守恒", score: 95, value: "1.2×10⁻⁷", passLine: 5e-6, desc: "系统总能量相对误差", icon: "energy" },
];

export default function PostdocApprovalPage() {
  const [comment, setComment] = useState("数值验证结果显示调整方案有效，四项稳定性指标中三项达到优秀水平，动量残差项略低但仍处于可接受范围。建议通过验证，提交教授委员会最终确认。");
  const [result, setResult] = useState<"pending" | "pass" | "reject">("pending");
  const [showConfirm, setShowConfirm] = useState<false | "pass" | "reject">(false);

  const avgScore = Math.round(metrics.reduce((s, m) => s + m.score, 0) / metrics.length);
  const avgStatus = getMetricStatus(avgScore);

  if (result !== "pending") {
    const pass = result === "pass";
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 p-5 flex items-center justify-center">
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-12 max-w-md text-center">
          <div className={`w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center ${pass ? "bg-emerald-500/15" : "bg-rose-500/15"}`}>
            {pass ? <CheckCircle2 className="w-12 h-12 text-emerald-400" /> : <XCircle className="w-12 h-12 text-rose-400" />}
          </div>
          <h2 className="text-xl font-bold mb-2">{pass ? "验证通过" : "已驳回"}</h2>
          <p className="text-slate-400 text-sm mb-6">
            {pass ? "已成功提交至教授委员会进行最终确认。预计T+2工作日内完成终审。" : "已记录驳回意见，已通知复核人补充相关材料后重新提交。"}
          </p>
          <button onClick={() => { setResult("pending"); setShowConfirm(false); }}
            className="px-6 py-2 rounded-lg bg-sky-500/20 border border-sky-500/50 text-sky-400 text-sm hover:bg-sky-500/30 transition-all">
            继续查看审批详情
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
            <button className="px-3 py-1.5 rounded-lg bg-slate-800/60 border border-slate-700 text-slate-400 text-xs hover:bg-slate-800 hover:text-slate-200 transition-all">
              ← 返回审批中心
            </button>
            <div className="w-px h-6 bg-slate-700 mx-1"></div>
            <div>
              <h1 className="text-xl font-bold">博士后审批 · 数值稳定性验证</h1>
              <p className="text-xs text-slate-500 font-mono">APV-2026-0609-007 · 关联预警 ALT-2026-0609-001</p>
            </div>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-sky-500/15 border border-sky-500/40">
            <UserCircle className="w-4 h-4 text-sky-400" />
            <span className="text-sm font-medium text-sky-300">验证岗位：博士后工作站</span>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-5">
          <div className="col-span-7 space-y-5">
            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-sky-400" />
                  数值稳定性指标评分
                </h2>
                <div className={`flex items-center gap-3 px-4 py-2 rounded-xl ${avgStatus.bg} border ${avgStatus.border}`}>
                  <CircularProgress score={avgScore} size={56} stroke={5} />
                  <div>
                    <div className="text-xs text-slate-400">综合评分</div>
                    <div className={`text-xl font-bold ${avgStatus.text}`}>{avgScore}<span className="text-xs font-normal text-slate-500"> / 100</span></div>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {metrics.map((m) => {
                  const status = getMetricStatus(m.score);
                  return (
                    <div key={m.label} className={`p-4 rounded-xl border ${status.border} ${status.bg}`}>
                      <div className="flex items-center gap-4">
                        <CircularProgress score={m.score} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <h3 className="text-sm font-semibold text-slate-100">{m.label}</h3>
                            <span className={`text-xs font-mono font-semibold ${status.text}`}>{m.value}</span>
                          </div>
                          <p className="text-[11px] text-slate-500 leading-relaxed mb-2">{m.desc}</p>
                          <div className="flex items-center justify-between text-[10px]">
                            <span className="text-slate-500">合格线: <span className="font-mono text-slate-400">{m.passLine.toExponential(1)}</span></span>
                            <span className={`font-semibold ${m.score >= 80 ? "text-emerald-400" : m.score >= 60 ? "text-amber-400" : "text-rose-400"}`}>
                              {m.score >= 80 ? "优秀" : m.score >= 60 ? "良好" : "不达标"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5">
              <h2 className="text-sm font-semibold mb-4 flex items-center gap-2">
                <FileWarning className="w-4 h-4 text-rose-400" />
                复核方案摘要
              </h2>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="p-4 rounded-lg bg-rose-500/8 border border-rose-500/25">
                  <div className="text-[11px] text-slate-500 mb-1">异常状态</div>
                  <div className="flex items-center gap-2 mb-2">
                    <AlertOctagon className="w-5 h-5 text-rose-400" />
                    <span className="text-rose-400 font-semibold text-lg">97.35 kPa</span>
                    <span className="text-xs text-rose-400/80">超阈值 21.7%</span>
                  </div>
                  <div className="text-[11px] text-slate-400">LK-7节点 · 圣安德烈斯断层南段</div>
                </div>
                <div className="p-4 rounded-lg bg-sky-500/8 border border-sky-500/25">
                  <div className="text-[11px] text-slate-500 mb-1">拟调整参数</div>
                  <div className="flex items-center gap-2 mb-2">
                    <Sliders className="w-5 h-5 text-sky-400" />
                    <span className="text-sky-400 font-semibold text-lg">摩擦系数 μ</span>
                  </div>
                  <div className="text-xs font-mono flex items-center gap-2">
                    <span className="text-slate-400">0.580</span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
                    <span className="text-sky-300 font-semibold">0.620</span>
                    <span className="text-[10px] bg-sky-500/20 px-1.5 py-0.5 rounded text-sky-400">+0.040</span>
                  </div>
                </div>
              </div>
              <div className="p-4 rounded-lg bg-slate-800/40 border border-slate-700/50">
                <div className="grid grid-cols-3 gap-4 text-xs">
                  <div>
                    <div className="text-slate-500 mb-1">创建人</div>
                    <div className="flex items-center gap-1.5 text-slate-200"><User className="w-3.5 h-3.5 text-slate-400" />陈思远 (助理研究员)</div>
                  </div>
                  <div>
                    <div className="text-slate-500 mb-1">提交时间</div>
                    <div className="flex items-center gap-1.5 text-slate-200"><Clock className="w-3.5 h-3.5 text-slate-400" />2026-06-09 14:58</div>
                  </div>
                  <div>
                    <div className="text-slate-500 mb-1">所属任务</div>
                    <div className="font-mono text-slate-200">TASK-20260609-003</div>
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-700/50">
                  <div className="text-[11px] text-slate-500 mb-1.5">复核意见</div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    LK-7节点剪应力达97.35kPa，较阈值80kPa超出21.7%。结合LK-6、LK-8相邻节点应力状态分析，
                    应力集中椭球长轴沿断层走向分布。拟将摩擦系数由0.580调整至0.620，
                    敏感性分析显示调整后剪应力峰值可回落至74kPa附近，库仑应力同步下降至0.49。
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5">
              <h2 className="text-sm font-semibold mb-4 flex items-center gap-2">
                <Eye className="w-4 h-4 text-emerald-400" />
                验证参考数据 <span className="text-xs font-normal text-slate-500">(模拟回放)</span>
              </h2>
              <div className="grid grid-cols-4 gap-3 mb-4">
                <div className="p-3 rounded-lg bg-slate-800/40 border border-slate-700/40 text-center">
                  <div className="text-[10px] text-slate-500 mb-1">重算步数</div>
                  <div className="text-base font-bold text-slate-200 font-mono">8,400</div>
                </div>
                <div className="p-3 rounded-lg bg-slate-800/40 border border-slate-700/40 text-center">
                  <div className="text-[10px] text-slate-500 mb-1">峰值剪应力</div>
                  <div className="text-base font-bold text-emerald-400 font-mono">74.2</div>
                </div>
                <div className="p-3 rounded-lg bg-slate-800/40 border border-slate-700/40 text-center">
                  <div className="text-[10px] text-slate-500 mb-1">峰值库仑</div>
                  <div className="text-base font-bold text-emerald-400 font-mono">0.492</div>
                </div>
                <div className="p-3 rounded-lg bg-slate-800/40 border border-slate-700/40 text-center">
                  <div className="text-[10px] text-slate-500 mb-1">失稳概率</div>
                  <div className="text-base font-bold text-emerald-400 font-mono">3.4%</div>
                </div>
              </div>
              <div className="p-3 rounded-lg bg-emerald-500/8 border border-emerald-500/25 text-xs text-emerald-300 leading-relaxed flex items-start gap-2">
                <CheckSquare className="w-4 h-4 flex-shrink-0 mt-0.5 text-emerald-400" />
                <span><strong className="text-emerald-400">验证结论：</strong>调整方案有效。摩擦系数提高0.04后，LK-7节点应力集中区显著缓解，
                  四项数值稳定性指标均处于合格区间（动量残差78分略低于优秀线），综合评分87.5分。
                  建议通过本环节验证，提交教授委员会终审。</span>
              </div>
            </div>
          </div>

          <div className="col-span-5">
            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 sticky top-5">
              <h2 className="text-sm font-semibold mb-4 flex items-center gap-2">
                <FileText className="w-4 h-4 text-sky-400" />
                审批意见与操作
              </h2>

              <div className="mb-5 p-4 rounded-xl bg-slate-800/40 border border-slate-700/40">
                <div className="text-xs text-slate-400 mb-3 flex items-center gap-1.5">
                  <UserCircle className="w-3.5 h-3.5" />
                  您的身份：张明华 · 博士后工作站 · STAFF-P007
                </div>
                <div className="space-y-2">
                  {[
                    { label: "收敛率 R ≥ 90", pass: metrics[0].score >= 90, actual: `${metrics[0].score}分` },
                    { label: "残差 < 5×10⁻⁴", pass: metrics[1].score >= 60, actual: `${metrics[1].value}` },
                    { label: "质量守恒 < 1×10⁻⁴", pass: metrics[2].score >= 60, actual: `${metrics[2].value}` },
                    { label: "能量守恒 < 5×10⁻⁶", pass: metrics[3].score >= 60, actual: `${metrics[3].value}` },
                    { label: "失稳概率 ≤ 5%", pass: true, actual: "3.4%" },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        {item.pass ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                        ) : (
                          <XCircle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                        )}
                        <span className={item.pass ? "text-slate-300" : "text-amber-300"}>{item.label}</span>
                      </div>
                      <span className={`font-mono ${item.pass ? "text-slate-400" : "text-amber-400"}`}>{item.actual}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mb-5">
                <label className="block text-xs text-slate-400 mb-2">验证意见 <span className="text-rose-400">*</span></label>
                <textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={6}
                  placeholder="请根据数值稳定性验证结果，给出详细的验证意见，说明是否通过、存在的问题或改进建议..."
                  className="w-full px-3 py-2.5 bg-slate-800/50 border border-slate-700 rounded-lg text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500/50 resize-none" />
                <div className="flex justify-between mt-1.5 text-[10px] text-slate-600">
                  <span>建议不少于30字</span>
                  <span>{comment.length} / 800</span>
                </div>
              </div>

              <div className="space-y-3">
                {showConfirm === "pass" && (
                  <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-300 leading-relaxed">
                    <strong>确认提交？</strong>此操作将把审批结果推送至教授委员会进行最终确认，提交后不可撤回。
                  </div>
                )}
                {showConfirm === "reject" && (
                  <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300 leading-relaxed">
                    <strong>确认驳回？</strong>此操作将退回至复核人补充材料，需在下方意见框中说明驳回理由。
                  </div>
                )}

                <button onClick={() => {
                  const cur = showConfirm as string;
                  if (cur === "reject") { setResult("reject"); return; }
                  setShowConfirm(cur === "reject" ? false : "reject");
                }} disabled={comment.length < 10}
                  className={`w-full py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all ${comment.length < 10
                      ? "bg-slate-800 border border-slate-700 text-slate-500 cursor-not-allowed"
                      : showConfirm === "reject"
                        ? "bg-gradient-to-r from-rose-600 to-rose-500 text-white shadow-lg shadow-rose-500/20"
                        : "bg-rose-500/10 border border-rose-500/40 text-rose-400 hover:bg-rose-500/20"
                    }`}>
                  {showConfirm === "reject" ? (
                    <><XCircle className="w-4 h-4" /> 确认驳回并退回</>
                  ) : (
                    <><XCircle className="w-4 h-4" /> 驳回 · 退回补充材料</>
                  )}
                </button>

                <button onClick={() => {
                  const cur = showConfirm as string;
                  if (cur === "pass") { setResult("pass"); return; }
                  setShowConfirm(cur === "pass" ? false : "pass");
                }} disabled={comment.length < 10}
                  className={`w-full py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all ${comment.length < 10
                      ? "bg-slate-800 border border-slate-700 text-slate-500 cursor-not-allowed"
                      : showConfirm === "pass"
                        ? "bg-gradient-to-r from-emerald-600 to-sky-600 text-white shadow-lg shadow-emerald-500/20"
                        : "bg-gradient-to-r from-sky-500/20 to-emerald-500/20 border border-sky-500/50 text-sky-300 hover:from-sky-500/30 hover:to-emerald-500/30"
                    }`}>
                  {showConfirm === "pass" ? (
                    <><CheckCircle2 className="w-4 h-4" /> 确认通过并提交教授委员会</>
                  ) : (
                    <><CheckCircle2 className="w-4 h-4" /> 验证通过 · 提交教授确认 <ArrowRight className="w-4 h-4" /></>
                  )}
                </button>
              </div>

              <div className="mt-5 p-3 rounded-lg bg-slate-800/30 border border-slate-700/40 text-[11px] text-slate-500 leading-relaxed">
                <div className="flex items-center gap-1.5 mb-1.5 text-slate-400 font-semibold">
                  <ShieldAlert className="w-3.5 h-3.5" /> 验证工作指引
                </div>
                <ol className="list-decimal list-inside space-y-0.5">
                  <li>核对4项数值稳定性指标，重点关注动量残差波动</li>
                  <li>回放重算过程前100步数据，观察初期收敛行为</li>
                  <li>如任一指标低于60分，原则上应驳回重新校准</li>
                  <li>通过后系统自动流转至教授委员会终审</li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
