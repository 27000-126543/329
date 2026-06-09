import { useState } from "react";
import ReactECharts from "echarts-for-react";
import {
  Crown, TrendingUp, Target, Users, CheckCircle, XCircle, Clock, ChevronRight, Sparkles, BarChart3, History, ThumbsUp, AlertCircle
} from "lucide-react";

type RecCard = {
  id: string;
  rank: number;
  name: string;
  algorithm: string;
  successRate: number;
  precision: number;
  samples: number;
  description: string;
  tags: string[];
};

const recommendations: RecCard[] = [
  {
    id: "REC-001", rank: 1, name: "深度学习混合模型 v3.2", algorithm: "LSTM+Attention",
    successRate: 94.2, precision: 91.8, samples: 12580,
    description: "基于长短期记忆网络与注意力机制的混合架构，对高滑动势断层段识别精度最优，适合大震预测领先基准模型23%。",
    tags: ["深度学习", "最优推荐", "注意力机制"]
  },
  {
    id: "REC-002", rank: 2, name: "物理约束贝叶斯反演", algorithm: "Physics-Infused Bayesian",
    successRate: 89.6, precision: 88.3, samples: 8920,
    description: "融合物理先验知识的贝叶斯反演方法，可解释性强，适合机理研究与决策支持。",
    tags: ["贝叶斯", "可解释"]
  },
  {
    id: "REC-003", rank: 3, name: "图神经网络时空传播", algorithm: "ST-GNN",
    successRate: 87.1, precision: 85.4, samples: 15240,
    description: "时空图神经网络建模断层相互作用，在多断层联动场景表现突出。",
    tags: ["GNN", "时空分析"]
  },
  {
    id: "REC-004", rank: 4, name: "集成随机森林", algorithm: "Ensemble XGBoost",
    successRate: 84.5, precision: 82.7, samples: 22150,
    description: "经典集成学习方案，训练快部署轻量，适合日常快速筛选。",
    tags: ["集成学习", "轻量"]
  },
];

const paramComparison = [
  { param: "摩擦系数μ", baseline: 0.65, rec1: 0.62, rec2: 0.68, rec3: 0.64, rec4: 0.66, unit: "-" },
  { param: "渗透率k", baseline: "1e-16", rec1: "8.5e-17", rec2: "1.2e-16", rec3: "9.2e-17", rec4: "1.1e-16", unit: "m²" },
  { param: "孔隙压力", baseline: 25.0, rec1: 28.3, rec2: 23.5, rec3: 26.8, rec4: 24.2, unit: "MPa" },
  { param: "应变速率", baseline: "1e-14", rec1: "1.3e-14", rec2: "9.5e-15", rec3: "1.1e-14", rec4: "1.05e-14", unit: "/s" },
  { param: "断层强度", baseline: 85.0, rec1: 92.5, rec2: 81.3, rec3: 87.6, rec4: 84.2, unit: "MPa" },
  { param: "深度截断", baseline: 35.0, rec1: 38.0, rec2: 32.0, rec3: 36.5, rec4: 34.0, unit: "km" },
];

const sensitivityOption = {
  title: { text: "参数敏感性分析", left: "center", textStyle: { fontSize: 14, fontWeight: "bold" } },
  tooltip: { trigger: "axis", axisPointer: { type: "shadow" } },
  grid: { left: "3%", right: "8%", bottom: "3%", top: "15%", containLabel: true },
  xAxis: { type: "value", name: "敏感性指数", max: 100 },
  yAxis: {
    type: "category",
    data: ["震源深度", "介质弹性模量", "泊松比", "地温梯度", "孔隙压力", "渗透率", "摩擦系数", "应变速率", "断层强度"]
  },
  series: [{
    type: "bar",
    data: [
      { value: 42, itemStyle: { color: "#94a3b8" } },
      { value: 56, itemStyle: { color: "#94a3b8" } },
      { value: 63, itemStyle: { color: "#60a5fa" } },
      { value: 68, itemStyle: { color: "#60a5fa" } },
      { value: 78, itemStyle: { color: "#facc15" } },
      { value: 82, itemStyle: { color: "#facc15" } },
      { value: 91, itemStyle: { color: "#f97316" } },
      { value: 94, itemStyle: { color: "#ef4444" } },
      { value: 96, itemStyle: { color: "#dc2626" } }
    ],
    label: { show: true, position: "right", formatter: "{c}" },
    barWidth: "60%"
  }]
};

const adoptionHistory = [
  { id: "AD-2026-0608", recId: "REC-001", recName: "深度学习混合模型 v3.2", version: "v3.2", user: "张首席", role: "首席地震学家", time: "2026-06-08 14:32", status: "success", note: "应用于龙门山南段监测升级", taskId: "SIM-00328" },
  { id: "AD-2026-0605", recId: "REC-003", recName: "图神经网络时空传播", version: "v2.1", user: "李分析师", role: "分析师", time: "2026-06-05 09:18", status: "success", note: "多断层联动分析", taskId: "SIM-00315" },
  { id: "AD-2026-0603", recId: "REC-002", recName: "物理约束贝叶斯反演", version: "v1.8", user: "王研究", role: "研究员", time: "2026-06-03 16:45", status: "rejected", note: "与观测数据偏差较大，需校准", taskId: "SIM-00302" },
  { id: "AD-2026-0530", recId: "REC-004", recName: "集成随机森林", version: "v4.0", user: "赵工", role: "工程师", time: "2026-05-30 11:20", status: "success", note: "日常快速筛选流程", taskId: "SIM-00289" },
  { id: "AD-2026-0525", recId: "REC-001", recName: "深度学习混合模型 v3.1", version: "v3.1", user: "张首席", role: "首席地震学家", time: "2026-05-25 10:05", status: "success", note: "西南地区季度评估", taskId: "SIM-00271" },
];

export default function RecommendationPage() {
  const [selectedId, setSelectedId] = useState<string>("REC-001");
  const selected = recommendations.find(r => r.id === selectedId)!;

  function renderTag(tag: string) {
    const map: Record<string, string> = {
      "深度学习": "bg-indigo-100 text-indigo-700 border-indigo-200",
      "最优推荐": "bg-amber-100 text-amber-700 border-amber-200",
      "注意力机制": "bg-violet-100 text-violet-700 border-violet-200",
      "贝叶斯": "bg-emerald-100 text-emerald-700 border-emerald-200",
      "可解释": "bg-blue-100 text-blue-700 border-blue-200",
      "GNN": "bg-pink-100 text-pink-700 border-pink-200",
      "时空分析": "bg-teal-100 text-teal-700 border-teal-200",
      "集成学习": "bg-orange-100 text-orange-700 border-orange-200",
      "轻量": "bg-cyan-100 text-cyan-700 border-cyan-200",
    };
    return map[tag] || "bg-slate-100 text-slate-700 border-slate-200";
  }

  const successCardClass = "bg-emerald-100 text-emerald-600";
  const failCardClass = "bg-red-100 text-red-600";
  const successBadgeClass = "bg-emerald-50 text-emerald-700 border-emerald-200";
  const failBadgeClass = "bg-red-50 text-red-700 border-red-200";

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-xl shadow-lg">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">智能推荐引擎</h1>
              <p className="text-sm text-slate-500">基于 AI 模型的地震风险分析模型与物理约束推荐最优参数配置方案</p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-sm font-medium border border-emerald-200">
            <CheckCircle className="w-4 h-4" />引擎运行中
          </span>
        </div>

        {/* 推荐卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {recommendations.map(rec => {
            const isTop = rec.rank === 1;
            const isSelected = selectedId === rec.id;
            const borderClass = isTop ? "border-amber-400 shadow-lg shadow-amber-100" : "border-slate-200";
            const selectedBorder = isTop ? "#f59e0b" : "#6366f1";
            const selectedShadow = isTop ? "0 10px 25px -5px rgba(245, 158, 11, 0.25)" : "0 10px 25px -5px rgba(99, 102, 241, 0.25)";
            const rankClass = rec.rank === 1 ? "bg-amber-100 text-amber-700"
              : rec.rank === 2 ? "bg-slate-200 text-slate-700"
              : rec.rank === 3 ? "bg-orange-100 text-orange-700"
              : "bg-slate-100 text-slate-500";
            const successColorClass = rec.successRate >= 90 ? "text-emerald-600"
              : rec.successRate >= 85 ? "text-blue-600"
              : "text-slate-700";
            return (
              <div key={rec.id}
                onClick={() => setSelectedId(rec.id)}
                className={"relative cursor-pointer rounded-xl p-5 bg-white border-2 transition-all hover:shadow-lg hover:-translate-y-1 " + borderClass}
                style={isSelected ? { borderColor: selectedBorder, boxShadow: selectedShadow } : {}}
              >
                {isTop && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-amber-400 to-yellow-500 text-white text-xs font-bold rounded-full shadow-md">
                    <Crown className="w-3 h-3 fill-white" /> TOP 1 最佳推荐
                  </div>
                )}
                <div className="flex items-start justify-between mb-3 mt-1">
                  <div>
                    <div className="text-xs font-mono text-slate-400 mb-1">{rec.id}</div>
                    <div className="font-bold text-slate-900 leading-tight">{rec.name}</div>
                  </div>
                  <div className={"w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold " + rankClass}>#{rec.rank}</div>
                </div>
                <div className="text-xs text-slate-500 mb-4 font-mono">{rec.algorithm}</div>
                <div className="space-y-2.5 mb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                      <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />成功率
                    </div>
                    <span className={"text-sm font-bold " + successColorClass}>{rec.successRate}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                      <Target className="w-3.5 h-3.5 text-indigo-500" />精度
                    </div>
                    <span className="text-sm font-bold text-slate-800">{rec.precision}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                      <Users className="w-3.5 h-3.5 text-violet-500" />训练样本
                    </div>
                    <span className="text-sm font-bold text-slate-800">{rec.samples.toLocaleString()}</span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {rec.tags.map(t => (
                    <span key={t} className={"inline-flex px-2 py-0.5 text-xs font-medium rounded-full border " + renderTag(t)}>{t}</span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* 参数对比表格 + 敏感性图 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-indigo-600" />
              <h2 className="font-bold text-slate-800">参数方案对比</h2>
              <span className="ml-2 text-sm text-slate-500">已选: {selected.name}</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600">参数</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">基准值</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-amber-700 bg-amber-50/50">TOP1</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">方案2</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">方案3</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">方案4</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">单位</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paramComparison.map(row => (
                    <tr key={row.param} className="hover:bg-slate-50">
                      <td className="px-6 py-3 text-sm font-medium text-slate-800">{row.param}</td>
                      <td className="px-4 py-3 text-sm font-mono text-slate-500">{row.baseline}</td>
                      <td className="px-4 py-3 text-sm font-mono font-bold text-amber-700 bg-amber-50/30">{row.rec1}</td>
                      <td className="px-4 py-3 text-sm font-mono text-slate-700">{row.rec2}</td>
                      <td className="px-4 py-3 text-sm font-mono text-slate-700">{row.rec3}</td>
                      <td className="px-4 py-3 text-sm font-mono text-slate-700">{row.rec4}</td>
                      <td className="px-4 py-3 text-sm text-slate-400">{row.unit}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <AlertCircle className="w-4 h-4 text-amber-500" />
                <span>与基准方案相比，TOP1方案在摩擦系数和应变速率上做了关键调整</span>
              </div>
              <button className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition">
                <ThumbsUp className="w-4 h-4" />采纳此方案
              </button>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
            <ReactECharts option={sensitivityOption} style={{ height: "420px" }} />
          </div>
        </div>

        {/* 采纳历史列表 */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 flex items-center gap-2">
            <History className="w-5 h-5 text-indigo-600" />
            <h2 className="font-bold text-slate-800">方案采纳历史</h2>
          </div>
          <div className="divide-y divide-slate-100">
            {adoptionHistory.map(h => {
              const cardClass = h.status === "success" ? successCardClass : failCardClass;
              const badgeClass = h.status === "success" ? successBadgeClass : failBadgeClass;
              const statusIcon = h.status === "success"
                ? <CheckCircle className="w-5 h-5" />
                : <XCircle className="w-5 h-5" />;
              const statusText = h.status === "success" ? "已采纳" : "已拒绝";
              return (
                <div key={h.id} className="px-6 py-4 hover:bg-slate-50 transition">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 flex items-start gap-4">
                      <div className={"shrink-0 w-10 h-10 rounded-xl flex items-center justify-center " + cardClass}>
                        {statusIcon}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-slate-800">{h.recName}</span>
                          <span className="text-xs font-mono text-slate-400">{h.recId}</span>
                          <span className="px-2 py-0.5 text-xs bg-slate-100 text-slate-600 rounded-full font-mono">{h.version}</span>
                        </div>
                        <div className="mt-1 text-sm text-slate-600">{h.note}</div>
                        <div className="mt-1.5 flex items-center gap-3 text-xs text-slate-400">
                          <span className="inline-flex items-center gap-1"><Clock className="w-3 h-3" />{h.time}</span>
                          <span>执行人: <span className="text-slate-600 font-medium">{h.user}</span></span>
                          <span className="px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded">{h.role}</span>
                          <span className="font-mono">任务: {h.taskId}</span>
                        </div>
                      </div>
                    </div>
                    <div className="shrink-0 flex items-center gap-3">
                      <span className={"inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-full border " + badgeClass}>
                        {statusIcon}
                        {statusText}
                      </span>
                      <ChevronRight className="w-5 h-5 text-slate-300" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
