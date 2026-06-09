import { useState } from "react";
import { GraduationCap, CheckCircle2, XCircle, ArrowRight, Clock, AlertOctagon, FileText, User, Sliders, Droplets, ShieldAlert, TrendingUp, Eye, FileWarning, Award, CheckSquare, UserCircle, History } from "lucide-react";

interface Metric {
  label: string;
  score: number;
  value: string;
  passLine: number;
  desc: string;
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
  { label: "收敛率 R", score: 92, value: "2.3×10⁻⁴", passLine: 1e-3, desc: "牛顿迭代残差下降速率" },
  { label: "动量残差", score: 78, value: "8.7×10⁻⁵", passLine: 5e-4, desc: "动量守恒方程残差范数" },
  { label: "质量守恒", score: 85, value: "4.1×10⁻⁶", passLine: 1e-4, desc: "连续性方程满足程度" },
  { label: "能量守恒", score: 95, value: "1.2×10⁻⁷", passLine: 5e-6, desc: "系统总能量相对误差" },
];

export default function ProfessorApprovalPage() {
  const [comment, setComment] = useState("经核查，博士后工作站提交的数值验证数据完整，参数调整依据充分。LK-7节点调整后的应力分布符合区域构造背景特征，摩擦系数取值0.620处于花岗岩类岩石合理范围（0.55~0.70）。综合失稳概率由37.6%降至3.4%，建议通过终审，同意将新参数纳入本构模型。");
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
            {pass ? <Award className="w-12 h-12 text-emerald-400" /> : <XCircle className="w-12 h-12 text-rose-400" />}
          </div>
          <h2 className="text-xl font-bold mb-2">{pass ? "终审通过" : "终审驳回"}</h2>
          <p className="text-slate-400 text-sm mb-6">
            {pass ? "两级审批流程已完成。调整后的参数将自动同步至任务配置，计算任务将于15分钟后以新参数重启。" : "已退回至博士后工作站。请等待复核人补充完善后重新提交。"}
          </p>
          <button onClick={() => { setResult("pending"); setShowConfirm(false); }}
            className="px-6 py-2 rounded-lg bg-violet-500/20 border border-violet-500/50 text-violet-400 text-sm hover:bg-violet-500/30 transition-all">
            返回审批中心
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
              <h1 className="text-xl font-bold">教授终审 · 方案确认</h1>
              <p className="text-xs text-slate-500 font-mono">APV-2026-0609-005 · 关联预警 ALT-2026-0609-003</p>
            </div>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-violet-500/15 border border-violet-500/40">
            <GraduationCap className="w-4 h-4 text-violet-400" />
            <span className="text-sm font-medium text-violet-300">终审岗位：教授委员会</span>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-5">
          <div className="col-span-7 space-y-5">
            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-violet-400" />
                  数值稳定性指标 <span className="text-xs font-normal text-slate-500">(博士后验证提交)</span>
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

            <div className="grid grid-cols-2 gap-5">
              <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5">
                <h2 className="text-sm font-semibold mb-4 flex items-center gap-2">
                  <UserCircle className="w-4 h-4 text-sky-400" />
                  初审情况（博士后）
                </h2>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-xs">
                    <div className="w-8 h-8 rounded-full bg-sky-500/20 flex items-center justify-center text-sky-400 font-semibold text-sm">张</div>
                    <div>
                      <div className="text-slate-200 font-medium">张明华 博士后</div>
                      <div className="text-slate-500 text-[11px]">验证耗时 1h 23min · 2026-06-09 16:21</div>
                    </div>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 ml-auto" />
                  </div>
                  <div className="p-3 rounded-lg bg-slate-800/40 border border-slate-700/40">
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      数值验证结果显示调整方案有效，四项稳定性指标三项达到优秀水平，
                      动量残差78分略低但处于可接受范围。调整后LK-7应力集中区显著缓解，
                      建议通过验证提交终审。
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5">
                <h2 className="text-sm font-semibold mb-4 flex items-center gap-2">
                  <History className="w-4 h-4 text-amber-400" />
                  历史审批参考
                </h2>
                <div className="space-y-2 text-xs">
                  {[
                    { date: "5月28日", case: "LK-7同类应力异常", result: "通过", param: "μ +0.035" },
                    { date: "5月17日", case: "LK-6应力聚集", result: "通过", param: "λ +0.040" },
                    { date: "4月22日", case: "LK-8双参数超限", result: "通过", param: "μ +0.045" },
                  ].map((h, i) => (
                    <div key={i} className="p-2 rounded-lg bg-slate-800/30 border border-slate-700/30 flex items-center justify-between">
                      <div>
                        <div className="text-slate-300 text-[11px]">{h.case}</div>
                        <div className="text-slate-500 text-[10px]">{h.date} · {h.param}</div>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[10px] ${h.result === "通过" ? "bg-emerald-500/15 text-emerald-400" : "bg-rose-500/15 text-rose-400"}`}>{h.result}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5">
              <h2 className="text-sm font-semibold mb-4 flex items-center gap-2">
                <FileWarning className="w-4 h-4 text-orange-400" />
                复核方案摘要
              </h2>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="p-4 rounded-lg bg-orange-500/8 border border-orange-500/25">
                  <div className="text-[11px] text-slate-500 mb-1">异常状态</div>
                  <div className="flex items-center gap-2 mb-2">
                    <AlertOctagon className="w-5 h-5 text-orange-400" />
                    <span className="text-orange-400 font-semibold text-lg">0.678</span>
                    <span className="text-xs text-orange-400/80">超阈值 13.0%</span>
                  </div>
                  <div className="text-[11px] text-slate-400">LMS-5节点 · 龙门山断裂带中段</div>
                </div>
                <div className="p-4 rounded-lg bg-sky-500/8 border border-sky-500/25">
                  <div className="text-[11px] text-slate-500 mb-1">拟调整参数</div>
                  <div className="flex items-center gap-2 mb-2">
                    <Sliders className="w-5 h-5 text-sky-400" />
                    <span className="text-sky-400 font-semibold text-lg">摩擦系数 μ</span>
                  </div>
                  <div className="text-xs font-mono flex items-center gap-2">
                    <span className="text-slate-400">0.590</span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
                    <span className="text-sky-300 font-semibold">0.645</span>
                    <span className="text-[10px] bg-sky-500/20 px-1.5 py-0.5 rounded text-sky-400">+0.055</span>
                  </div>
                </div>
              </div>
              <div className="p-4 rounded-lg bg-slate-800/40 border border-slate-700/50">
                <div className="grid grid-cols-3 gap-4 text-xs mb-3">
                  <div>
                    <div className="text-slate-500 mb-1">创建人</div>
                    <div className="flex items-center gap-1.5 text-slate-200"><User className="w-3.5 h-3.5 text-slate-400" />李雪晴 (助理研究员)</div>
                  </div>
                  <div>
                    <div className="text-slate-500 mb-1">提交时间</div>
                    <div className="flex items-center gap-1.5 text-slate-200"><Clock className="w-3.5 h-3.5 text-slate-400" />2026-06-09 11:30</div>
                  </div>
                  <div>
                    <div className="text-slate-500 mb-1">所属任务</div>
                    <div className="font-mono text-slate-200">TASK-20260607-009</div>
                  </div>
                </div>
                <div className="pt-3 border-t border-slate-700/50">
                  <div className="text-[11px] text-slate-500 mb-1.5">复核人意见</div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    LMS-5库仑应力0.678超阈值，结合S波分裂观测结果与区域构造应力场，
                    判断该异常具有物理背景而非数值振荡。建议将摩擦系数上调至0.645，
                    与龙门山北段已标定结果保持一致。敏感性分析验证后库仑应力可回落至0.56。
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5">
              <h2 className="text-sm font-semibold mb-4 flex items-center gap-2">
                <Eye className="w-4 h-4 text-emerald-400" />
                终审评估参考 <span className="text-xs font-normal text-slate-500">(系统推荐)</span>
              </h2>
              <div className="grid grid-cols-4 gap-3 mb-4">
                <div className="p-3 rounded-lg bg-slate-800/40 border border-slate-700/40 text-center">
                  <div className="text-[10px] text-slate-500 mb-1">推荐操作</div>
                  <div className="text-sm font-bold text-emerald-400">✓ 通过</div>
                </div>
                <div className="p-3 rounded-lg bg-slate-800/40 border border-slate-700/40 text-center">
                  <div className="text-[10px] text-slate-500 mb-1">置信度</div>
                  <div className="text-sm font-bold text-slate-200 font-mono">92.3%</div>
                </div>
                <div className="p-3 rounded-lg bg-slate-800/40 border border-slate-700/40 text-center">
                  <div className="text-[10px] text-slate-500 mb-1">调后峰值</div>
                  <div className="text-sm font-bold text-emerald-400 font-mono">0.560</div>
                </div>
                <div className="p-3 rounded-lg bg-slate-800/40 border border-slate-700/40 text-center">
                  <div className="text-[10px] text-slate-500 mb-1">失稳概率</div>
                  <div className="text-sm font-bold text-emerald-400 font-mono">2.1%</div>
                </div>
              </div>
              <div className="p-3 rounded-lg bg-violet-500/8 border border-violet-500/25 text-xs text-violet-200 leading-relaxed flex items-start gap-2">
                <Award className="w-4 h-4 flex-shrink-0 mt-0.5 text-violet-400" />
                <span><strong className="text-violet-300">AI 辅助结论：</strong>该调参方案与历史37起同类案例的最优决策一致度达92.3%，
                  参数取值处于岩石力学实验合理区间，地质构造背景匹配度高。建议批准本方案，关注后续1000步瞬态响应。</span>
              </div>
            </div>
          </div>

          <div className="col-span-5">
            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 sticky top-5">
              <h2 className="text-sm font-semibold mb-4 flex items-center gap-2">
                <FileText className="w-4 h-4 text-violet-400" />
                终审意见与操作
              </h2>

              <div className="mb-5 p-4 rounded-xl bg-slate-800/40 border border-slate-700/40">
                <div className="text-xs text-slate-400 mb-3 flex items-center gap-1.5">
                  <GraduationCap className="w-3.5 h-3.5" />
                  您的身份：王建国 · 教授委员会 · 评审组组长 · PROF-003
                </div>
                <div className="text-[11px] text-slate-500 mb-2">终审核查清单</div>
                <div className="space-y-2">
                  {[
                    { label: "初审数据完整、逻辑自洽", pass: true },
                    { label: "参数取值符合岩石力学实验范围", pass: true },
                    { label: "与区域构造背景匹配", pass: true },
                    { label: "历史同类案例支持", pass: true },
                    { label: "不存在数值伪迹迹象", pass: true },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        {item.pass ? (
                          <CheckSquare className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                        ) : (
                          <XCircle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                        )}
                        <span className={item.pass ? "text-slate-300" : "text-amber-300"}>{item.label}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mb-5">
                <label className="block text-xs text-slate-400 mb-2">终审意见 <span className="text-rose-400">*</span></label>
                <textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={7}
                  placeholder="请从构造地质学、岩石力学、数值方法三个维度给出终审意见。如有驳回需详细说明理由..."
                  className="w-full px-3 py-2.5 bg-slate-800/50 border border-slate-700 rounded-lg text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-violet-500/50 resize-none" />
                <div className="flex justify-between mt-1.5 text-[10px] text-slate-600">
                  <span>建议不少于50字</span>
                  <span>{comment.length} / 1200</span>
                </div>
              </div>

              <div className="space-y-3">
                {showConfirm === "pass" && (
                  <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-300 leading-relaxed">
                    <strong>确认终审通过？</strong>此为两级审批最终环节，确认后新参数将自动入模型并重启计算任务，操作不可撤回。
                  </div>
                )}
                {showConfirm === "reject" && (
                  <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300 leading-relaxed">
                    <strong>确认终审驳回？</strong>需在上方意见中详细说明驳回理由及补正要求。将退回至博士后工作站重新验证。
                  </div>
                )}

                <button onClick={() => {
                  const cur = showConfirm as string;
                  if (cur === "reject") { setResult("reject"); return; }
                  setShowConfirm(cur === "reject" ? false : "reject");
                }} disabled={comment.length < 15}
                  className={`w-full py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all ${comment.length < 15
                      ? "bg-slate-800 border border-slate-700 text-slate-500 cursor-not-allowed"
                      : showConfirm === "reject"
                        ? "bg-gradient-to-r from-rose-600 to-rose-500 text-white shadow-lg shadow-rose-500/20"
                        : "bg-rose-500/10 border border-rose-500/40 text-rose-400 hover:bg-rose-500/20"
                    }`}>
                  {showConfirm === "reject" ? (
                    <><XCircle className="w-4 h-4" /> 确认驳回并退回</>
                  ) : (
                    <><XCircle className="w-4 h-4" /> 驳回 · 退回重新验证</>
                  )}
                </button>

                <button onClick={() => {
                  const cur = showConfirm as string;
                  if (cur === "pass") { setResult("pass"); return; }
                  setShowConfirm(cur === "pass" ? false : "pass");
                }} disabled={comment.length < 15}
                  className={`w-full py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all ${comment.length < 15
                      ? "bg-slate-800 border border-slate-700 text-slate-500 cursor-not-allowed"
                      : showConfirm === "pass"
                        ? "bg-gradient-to-r from-violet-600 to-sky-600 text-white shadow-lg shadow-violet-500/20"
                        : "bg-gradient-to-r from-violet-500/20 to-sky-500/20 border border-violet-500/50 text-violet-300 hover:from-violet-500/30 hover:to-sky-500/30"
                    }`}>
                  {showConfirm === "pass" ? (
                    <><Award className="w-4 h-4" /> 确认终审通过 · 生效执行</>
                  ) : (
                    <><CheckCircle2 className="w-4 h-4" /> 终审通过 · 方案生效 <ArrowRight className="w-4 h-4" /></>
                  )}
                </button>
              </div>

              <div className="mt-5 p-3 rounded-lg bg-slate-800/30 border border-slate-700/40 text-[11px] text-slate-500 leading-relaxed">
                <div className="flex items-center gap-1.5 mb-1.5 text-slate-400 font-semibold">
                  <ShieldAlert className="w-3.5 h-3.5" /> 教授终审权责
                </div>
                <ol className="list-decimal list-inside space-y-0.5">
                  <li>从构造地质与岩石力学角度核查方案的物理合理性</li>
                  <li>结合历史同类案例与区域应力场综合判断</li>
                  <li>如参数变动 &gt;0.05 需填写特别说明</li>
                  <li>终审为最终决策，通过后立即生效执行</li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
