import { useState } from "react";
import ReactECharts from "echarts-for-react";
import {
  ArrowLeft, MapPin, Compass, Ruler, Layers, Activity, AlertTriangle, Pause, Play,
  Clock, User, Shield, ChevronRight, Info, FileText, BadgeCheck, Ban, AlertOctagon, Calendar, Eye } from "lucide-react";

type DeviationEvent = {
  id: string;
  time: string;
  level: "critical" | "warning" | "info";
  value: number;
  threshold: number;
  segment: string;
  metric: string;
  user: string;
  note: string;
  taskId: string;
};

const deviationEvents: DeviationEvent[] = [
  { id: "DEV-0609", time: "2026-06-09 03:18:24", level: "critical", value: 32.1, threshold: 20, segment: "S03 映秀-北川中段", metric: "峰值滑动量偏差", user: "系统自动检测", note: "模拟值与观测值严重偏离，建议暂停后复核摩擦系数参数", taskId: "SIM-00329" },
  { id: "DEV-0601", time: "2026-06-01 11:45:02", level: "critical", value: 28.4, threshold: 20, segment: "S05 灌县-江油段", metric: "地震矩估算偏差", user: "系统自动检测", note: "超过阈值20%，触发二级警报，已通知首席地震学家", taskId: "SIM-00311" },
  { id: "DEV-0522", time: "2026-05-22 19:02:51", level: "critical", value: 26.8, threshold: 20, segment: "S08 宝兴-天全段", metric: "库仑应力变化偏差", user: "张首席", note: "人工复核确认，需重新校准孔隙压力边界条件", taskId: "SIM-00298" },
  { id: "DEV-0510", time: "2026-05-10 14:28:33", level: "warning", value: 18.9, threshold: 15, segment: "S02 汶川段", metric: "破裂传播速度偏差", user: "系统自动检测", note: "接近警戒阈值，建议关注后续演化趋势", taskId: "SIM-00277" },
  { id: "DEV-0428", time: "2026-04-28 09:12:18", level: "info", value: 12.5, threshold: 10, segment: "S06 绵竹-安县段", metric: "应力降偏差", user: "李分析师", note: "正常波动范围，无需干预", taskId: "SIM-00263" },
];

const slipCompareOption = {
  title: { text: "历史模拟滑动量对比（各分段 vs 观测值）", left: "center", textStyle: { fontSize: 14, fontWeight: "bold" } },
  tooltip: { trigger: "axis", axisPointer: { type: "shadow" } },
  legend: { data: ["观测值", "SIM-00263", "SIM-00277", "SIM-00298", "SIM-00311", "SIM-00329"], top: "8%" },
  grid: { left: "3%", right: "4%", bottom: "3%", top: "20%", containLabel: true },
  xAxis: { type: "category", data: ["S01", "S02", "S03", "S04", "S05", "S06", "S07", "S08", "S09", "S10"], axisLabel: { rotate: 0 } },
  yAxis: { type: "value", name: "滑动量 (m)" },
  series: [
    {
      name: "观测值", type: "bar", barWidth: "12%",
      data: [2.8, 3.5, 4.2, 3.1, 2.9, 3.8, 3.3, 4.0, 2.6, 3.0],
      itemStyle: { color: "#1e293b" }
    },
    {
      name: "SIM-00263", type: "bar", barWidth: "12%",
      data: [2.9, 3.4, 4.0, 3.2, 3.0, 3.7, 3.4, 3.9, 2.7, 3.1],
      itemStyle: { color: "#60a5fa" }
    },
    {
      name: "SIM-00277", type: "bar", barWidth: "12%",
      data: [2.7, 4.0, 4.1, 3.0, 2.8, 3.9, 3.2, 3.8, 2.5, 2.9],
      itemStyle: { color: "#34d399" }
    },
    {
      name: "SIM-00298", type: "bar", barWidth: "12%",
      data: [3.0, 3.6, 4.4, 3.3, 2.7, 3.6, 3.5, 4.8, 2.8, 3.2],
      itemStyle: { color: "#fbbf24" }
    },
    {
      name: "SIM-00311", type: "bar", barWidth: "12%",
      data: [2.6, 3.8, 3.9, 3.5, 3.7, 4.0, 3.1, 4.3, 2.4, 3.4],
      itemStyle: { color: "#fb923c" }
    },
    {
      name: "SIM-00329", type: "bar", barWidth: "12%",
      data: [3.1, 3.3, 5.5, 3.0, 3.8, 3.5, 3.6, 4.1, 2.9, 3.0],
      itemStyle: { color: "#ef4444" }
    }
  ]
};

export default function FaultDetailPage() {
  const [status, setStatus] = useState<"active" | "paused">("paused");
  const [showRoleModal, setShowRoleModal] = useState(false);
  const currentRole = "首席地震学家";
  const hasChiefRole = currentRole.includes("首席");

  const faultInfo = {
    name: "龙门山断裂带南段",
    code: "LMS-002",
    id: "F-02",
    location: "四川·成都 - 阿坝",
    coords: "E103°~105°, N30°~33°",
    strike: "N45°E",
    dip: 55,
    length: 280,
    depth: 40,
    width: 60,
    rake: 120,
    type: "逆冲-走滑复合型",
    segments: 15,
    risk: "极高",
    simulations: 2150,
    createdAt: "2023-03-15",
    lastSim: "2026-05-20",
    pausedAt: "2026-05-20 16:42",
    pausedBy: "张首席",
    pauseReason: "连续3次滑动量偏差超过20%阈值，需暂停校准参数",
  };

  function handleResume() {
    if (!hasChiefRole) { setShowRoleModal(true); return; }
    setStatus("active");
  }

  function levelBadge(level: string) {
    switch (level) {
      case "critical": return "bg-red-50 text-red-700 border-red-200";
      case "warning": return "bg-amber-50 text-amber-700 border-amber-200";
      default: return "bg-blue-50 text-blue-700 border-blue-200";
    }
  }

  function levelIcon(level: string) {
    switch (level) {
      case "critical": return <AlertOctagon className="w-4 h-4" />;
      case "warning": return <AlertTriangle className="w-4 h-4" />;
      default: return <Info className="w-4 h-4" />;
    }
  }

  function levelDot(level: string) {
    switch (level) {
      case "critical": return "bg-red-500";
      case "warning": return "bg-amber-500";
      default: return "bg-blue-500";
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* 面包屑和返回 */}
        <div className="flex items-center gap-3">
          <button className="inline-flex items-center gap-1.5 px-3 py-1.5 text-slate-600 hover:text-indigo-600 hover:bg-white rounded-lg transition">
            <ArrowLeft className="w-4 h-4" />返回断层列表
          </button>
          <div className="text-slate-300">/</div>
          <span className="text-sm text-slate-500">{faultInfo.code}</span>
          <ChevronRight className="w-4 h-4 text-slate-300" />
          <span className="text-sm font-medium text-slate-800">{faultInfo.name}</span>
        </div>

        {/* 基本信息头部 */}
        <div className={`bg-white rounded-xl shadow-sm border-2 overflow-hidden transition-colors ${
          status === "paused" ? "border-red-400" : "border-slate-200"
        }`}>
          <div className={`px-6 py-5 flex items-start justify-between flex-wrap gap-4 ${
            status === "paused" ? "bg-gradient-to-r from-red-50 to-orange-50" : "bg-gradient-to-r from-indigo-50 to-violet-50"
          }`}>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl font-bold text-slate-900">{faultInfo.name}</h1>
                <span className="px-2.5 py-0.5 text-xs font-mono text-slate-600 bg-white rounded border border-slate-200">{faultInfo.code}</span>
                <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-red-100 text-red-800 border border-red-200">{faultInfo.risk}风险</span>
                {status === "paused" && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-bold rounded-full bg-red-500 text-white shadow-sm animate-pulse">
                    <Pause className="w-3 h-3" />模拟已暂停
                  </span>
                )}
                {status === "active" && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-bold rounded-full bg-emerald-500 text-white shadow-sm">
                    <Play className="w-3 h-3" />模拟运行中
                  </span>
                )}
              </div>
              <div className="mt-2 flex items-center gap-2 text-sm text-slate-600">
                <MapPin className="w-4 h-4" />
                <span>{faultInfo.location}</span>
                <span className="text-slate-300">·</span>
                <span className="font-mono">{faultInfo.coords}</span>
              </div>
            </div>
            <div className="flex flex-col gap-2 items-end">
              {status === "paused" ? (
                <button onClick={handleResume}
                  className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium shadow-md transition-all ${
                    hasChiefRole
                      ? "bg-gradient-to-r from-emerald-500 to-green-600 hover:shadow-lg text-white hover:-translate-y-0.5"
                      : "bg-slate-300 text-slate-500 cursor-not-allowed"
                  }`}>
                  <Play className="w-4 h-4" />
                  {hasChiefRole ? "解除暂停 · 恢复模拟" : "需首席权限解除暂停"}
                </button>
              ) : (
                <button className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl font-medium shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all">
                  <Pause className="w-4 h-4" />暂停模拟
                </button>
              )}
              {!hasChiefRole && (
                <span className="text-xs text-slate-500 inline-flex items-center gap-1">
                  <Shield className="w-3 h-3" />当前角色：{currentRole}
                </span>
              )}
              {hasChiefRole && (
                <span className="text-xs text-emerald-600 inline-flex items-center gap-1">
                  <BadgeCheck className="w-3 h-3" />角色已验证：{currentRole}
                </span>
              )}
            </div>
          </div>

          {status === "paused" && (
            <div className="px-6 py-3 bg-red-50/70 border-y border-red-100 flex items-start gap-3">
              <Ban className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <div className="flex-1 text-sm">
                <div className="font-semibold text-red-800">
                  暂停原因：{faultInfo.pauseReason}
                </div>
                <div className="mt-1 text-red-600 text-xs flex items-center gap-3 flex-wrap">
                  <span className="inline-flex items-center gap-1"><User className="w-3 h-3" />操作人：{faultInfo.pausedBy}</span>
                  <span className="inline-flex items-center gap-1"><Clock className="w-3 h-3" />时间：{faultInfo.pausedAt}</span>
                </div>
              </div>
            </div>
          )}

          {/* 参数网格 */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 p-6">
            {[
              { label: "走向", value: faultInfo.strike, icon: Compass, color: "text-indigo-600 bg-indigo-100" },
              { label: "倾角", value: `${faultInfo.dip}°`, icon: Compass, color: "text-violet-600 bg-violet-100" },
              { label: "滑动角", value: `${faultInfo.rake}°`, icon: Activity, color: "text-blue-600 bg-blue-100" },
              { label: "长度", value: `${faultInfo.length} km`, icon: Ruler, color: "text-emerald-600 bg-emerald-100" },
              { label: "宽度", value: `${faultInfo.width} km`, icon: Ruler, color: "text-teal-600 bg-teal-100" },
              { label: "下切深度", value: `${faultInfo.depth} km`, icon: Layers, color: "text-amber-600 bg-amber-100" },
              { label: "断层类型", value: faultInfo.type, icon: Activity, color: "text-orange-600 bg-orange-100" },
              { label: "分段数", value: `${faultInfo.segments} 段`, icon: Layers, color: "text-pink-600 bg-pink-100" },
              { label: "创建日期", value: faultInfo.createdAt, icon: Calendar, color: "text-cyan-600 bg-cyan-100" },
              { label: "最近模拟", value: faultInfo.lastSim, icon: Clock, color: "text-sky-600 bg-sky-100" },
              { label: "模拟总数", value: faultInfo.simulations.toLocaleString(), icon: Activity, color: "text-purple-600 bg-purple-100" },
              { label: "偏差事件", value: `${deviationEvents.filter(d => d.level === "critical").length} 次超20%`, icon: AlertTriangle, color: "text-red-600 bg-red-100" },
            ].map((item, idx) => (
              <div key={idx} className="p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition">
                <div className={`w-8 h-8 rounded-lg mb-2 flex items-center justify-center ${item.color.split(" ")[1]}`}>
                  <item.icon className={`w-4 h-4 ${item.color.split(" ")[0]}`} />
                </div>
                <div className="text-xs text-slate-500">{item.label}</div>
                <div className="text-sm font-semibold text-slate-800 mt-0.5">{item.value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* 主体内容 */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* 偏差时间线 */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertOctagon className="w-5 h-5 text-red-500" />
                <h2 className="font-bold text-slate-800">偏差检测记录时间线</h2>
              </div>
              <span className="text-xs px-2 py-1 bg-red-50 text-red-600 rounded-full border border-red-100 font-semibold">
                3 次超20%
              </span>
            </div>
            <div className="p-6">
              <div className="relative">
                <div className="absolute left-3.5 top-0 bottom-0 w-0.5 bg-slate-200" />
                <div className="space-y-6">
                  {deviationEvents.map((ev, idx) => (
                    <div key={ev.id} className="relative pl-10">
                      <div className={`absolute left-0 top-1.5 w-7 h-7 rounded-full border-2 border-white shadow flex items-center justify-center ${levelDot(ev.level)}`}>
                        <span className="text-white">{levelIcon(ev.level)}</span>
                      </div>
                      {idx === 0 && (
                        <div className="absolute left-2.5 -top-3 w-3 h-3 rounded-full bg-red-500 border-2 border-white shadow-lg animate-pulse" />
                      )}
                      <div className={`p-3 rounded-xl border ${levelBadge(ev.level)}`}>
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono text-slate-500">{ev.id}</span>
                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${levelBadge(ev.level)} border`}>
                              {ev.level === "critical" ? "严重" : ev.level === "warning" ? "警告" : "提示"}
                            </span>
                          </div>
                          <span className="text-sm font-bold font-mono">
                            {ev.value > ev.threshold ? "+" : ""}{ev.value}%
                            <span className="text-xs text-slate-500 font-normal"> / {ev.threshold}%</span>
                          </span>
                        </div>
                        <div className="text-sm font-semibold text-slate-800 mt-1">{ev.metric}</div>
                        <div className="text-xs text-slate-500 mt-1">
                          分段：<span className="text-slate-700 font-medium">{ev.segment}</span>
                        </div>
                        <div className="text-xs text-slate-600 mt-2 border-t border-slate-200/50 pt-2">
                          {ev.note}
                        </div>
                        <div className="mt-2 flex items-center justify-between text-xs text-slate-400">
                          <span className="inline-flex items-center gap-1"><User className="w-3 h-3" />{ev.user}</span>
                          <span className="inline-flex items-center gap-1"><Clock className="w-3 h-3" />{ev.time}</span>
                        </div>
                        <div className="mt-1 text-xs text-slate-400 inline-flex items-center gap-1">
                          <FileText className="w-3 h-3" />任务 <span className="font-mono text-indigo-500">{ev.taskId}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* 滑动量对比图 */}
          <div className="lg:col-span-3 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-indigo-600" />
                <h2 className="font-bold text-slate-800">历史模拟滑动量对比</h2>
              </div>
              <button className="inline-flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-700 font-medium">
                <Eye className="w-4 h-4" />查看完整报告
              </button>
            </div>
            <div className="p-4">
              <ReactECharts option={slipCompareOption} style={{ height: "420px" }} />
            </div>
            <div className="px-6 py-3 bg-slate-50 border-t border-slate-200">
              <div className="flex items-start gap-2 text-xs text-slate-600">
                <Info className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-amber-700">S03 映秀-北川中段</span> 最新模拟（SIM-00329）滑动量与观测值偏差
                  <span className="font-bold text-red-600"> 32.1% </span>，已触发暂停保护，建议优先校准该段摩擦系数与强度参数。
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 角色权限弹窗 */}
        {showRoleModal && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-red-100 text-red-600 flex items-center justify-center">
                  <Shield className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">权限不足</h3>
                  <p className="text-sm text-slate-500">解除暂停需首席角色权限</p>
                </div>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl mb-4">
                <div className="text-sm text-slate-700 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-500">当前角色</span>
                    <span className="font-medium">{currentRole}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">所需角色</span>
                    <span className="font-semibold text-indigo-600">首席地震学家</span>
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <button onClick={() => setShowRoleModal(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium transition">
                  关闭
                </button>
                <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition">
                  申请临时授权
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
