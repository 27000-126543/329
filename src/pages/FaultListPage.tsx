import { useState } from "react";
import {
  Plus, MapPin, Compass, Ruler, Layers, Activity, AlertTriangle, Pause, Search, Filter, ChevronRight, AlertOctagon, Zap, Mountain, Waves } from "lucide-react";

type Fault = {
  id: string;
  code: string;
  name: string;
  location: string;
  strike: string;
  dip: number;
  length: number;
  depth: number;
  simulations: number;
  paused: boolean;
  hasDeviation: boolean;
  deviationCount: number;
  maxDeviation: number;
  riskLevel: "极高" | "高" | "中" | "低";
  lastSim: string;
  segments: number;
};

const faults: Fault[] = [
  { id: "F-01", code: "XSH-001", name: "鲜水河断裂带", location: "四川·甘孜", strike: "N30°W", dip: 75, length: 350, depth: 35, simulations: 1286, paused: false, hasDeviation: true, deviationCount: 3, maxDeviation: 28.4, riskLevel: "极高", lastSim: "2026-06-08", segments: 12 },
  { id: "F-02", code: "LMS-002", name: "龙门山断裂带南段", location: "四川·成都", strike: "N45°E", dip: 55, length: 280, depth: 40, simulations: 2150, paused: true, hasDeviation: true, deviationCount: 5, maxDeviation: 32.1, riskLevel: "极高", lastSim: "2026-05-20", segments: 15 },
  { id: "F-03", code: "XJ-003", name: "小江断裂带", location: "云南·昆明", strike: "N20°W", dip: 80, length: 420, depth: 30, simulations: 986, paused: false, hasDeviation: false, deviationCount: 0, maxDeviation: 12.5, riskLevel: "高", lastSim: "2026-06-09", segments: 18 },
  { id: "F-04", code: "ANH-004", name: "安宁河断裂带", location: "四川·凉山", strike: "N10°W", dip: 72, length: 260, depth: 38, simulations: 1672, paused: false, hasDeviation: true, deviationCount: 2, maxDeviation: 23.8, riskLevel: "高", lastSim: "2026-06-07", segments: 11 },
  { id: "F-05", code: "HH-005", name: "红河断裂带", location: "云南·大理", strike: "N50°W", dip: 68, length: 520, depth: 42, simulations: 834, paused: false, hasDeviation: false, deviationCount: 1, maxDeviation: 18.2, riskLevel: "中", lastSim: "2026-06-05", segments: 22 },
  { id: "F-06", code: "JSJ-006", name: "金沙江断裂带", location: "云南·丽江", strike: "N35°E", dip: 70, length: 380, depth: 36, simulations: 1124, paused: false, hasDeviation: false, deviationCount: 0, maxDeviation: 14.7, riskLevel: "中", lastSim: "2026-06-03", segments: 16 },
  { id: "F-07", code: "NC-007", name: "南汀河断裂带", location: "云南·临沧", strike: "N55°E", dip: 62, length: 220, depth: 28, simulations: 612, paused: true, hasDeviation: false, deviationCount: 1, maxDeviation: 19.5, riskLevel: "中", lastSim: "2026-05-18", segments: 9 },
  { id: "F-08", code: "CD-008", name: "则木河断裂带", location: "四川·西昌", strike: "N25°W", dip: 78, length: 180, depth: 32, simulations: 1458, paused: false, hasDeviation: true, deviationCount: 3, maxDeviation: 25.6, riskLevel: "高", lastSim: "2026-06-06", segments: 8 },
];

export default function FaultListPage() {
  const [searchText, setSearchText] = useState("");
  const [filterRisk, setFilterRisk] = useState("all");
  const [showPaused, setShowPaused] = useState(true);

  const filtered = faults.filter(f => {
    const matchText = f.name.includes(searchText) || f.code.includes(searchText) || f.location.includes(searchText);
    const matchRisk = filterRisk === "all" || f.riskLevel === filterRisk;
    const matchPause = showPaused || !f.paused;
    return matchText && matchRisk && matchPause;
  });

  const stats = {
    total: faults.length,
    paused: faults.filter(f => f.paused).length,
    deviated: faults.filter(f => f.hasDeviation && f.deviationCount > 0).length,
    highRisk: faults.filter(f => f.riskLevel === "极高" || f.riskLevel === "高").length,
  };

  function riskBadgeClass(level: string) {
    switch (level) {
      case "极高": return "bg-red-100 text-red-800 border-red-200";
      case "高": return "bg-orange-100 text-orange-800 border-orange-200";
      case "中": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      default: return "bg-green-100 text-green-800 border-green-200";
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-sky-500 to-blue-600 rounded-xl shadow-lg">
              <Mountain className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">断层管理</h1>
              <p className="text-sm text-slate-500">活动断层库配置与偏差监控</p>
            </div>
          </div>
          <button className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-medium rounded-xl shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all">
            <Plus className="w-4 h-4" />新增断层
          </button>
        </div>

        {/* 统计卡片 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-xl"><Waves className="w-5 h-5 text-blue-600" /></div>
            <div>
              <div className="text-xs text-slate-500">断层总数</div>
              <div className="text-2xl font-bold text-slate-900">{stats.total}</div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 flex items-center gap-4">
            <div className="p-3 bg-red-100 rounded-xl"><Pause className="w-5 h-5 text-red-600" /></div>
            <div>
              <div className="text-xs text-slate-500">已暂停</div>
              <div className="text-2xl font-bold text-red-600">{stats.paused}</div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 flex items-center gap-4">
            <div className="p-3 bg-amber-100 rounded-xl"><AlertOctagon className="w-5 h-5 text-amber-600" /></div>
            <div>
              <div className="text-xs text-slate-500">偏差异常</div>
              <div className="text-2xl font-bold text-amber-600">{stats.deviated}</div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 flex items-center gap-4">
            <div className="p-3 bg-orange-100 rounded-xl"><AlertTriangle className="w-5 h-5 text-orange-600" /></div>
            <div>
              <div className="text-xs text-slate-500">高/极高风险</div>
              <div className="text-2xl font-bold text-orange-600">{stats.highRisk}</div>
            </div>
          </div>
        </div>

        {/* 搜索筛选栏 */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={searchText} onChange={(e) => setSearchText(e.target.value)}
              placeholder="搜索断层名称、编号或位置..."
              className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select value={filterRisk} onChange={(e) => setFilterRisk(e.target.value)}
              className="px-3 py-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500">
              <option value="all">全部风险等级</option>
              <option value="极高">极高</option>
              <option value="高">高</option>
              <option value="中">中</option>
              <option value="低">低</option>
            </select>
          </div>
          <label className="inline-flex items-center gap-2 px-3 py-2.5 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50 text-sm">
            <input type="checkbox" checked={showPaused} onChange={(e) => setShowPaused(e.target.checked)}
              className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500" />
            <span className="text-slate-700">显示已暂停</span>
          </label>
        </div>

        {/* 断层卡片网格 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filtered.map(fault => (
            <div key={fault.id}
              className={`relative bg-white rounded-xl shadow-sm p-5 transition-all hover:shadow-lg hover:-translate-y-1 cursor-pointer border-2 ${
                fault.paused ? "border-red-400" :
                fault.hasDeviation && fault.maxDeviation > 20 ? "border-amber-300" : "border-slate-200"
              }`}
            >
              {fault.paused && (
                <div className="absolute top-3 right-3 inline-flex items-center gap-1 px-2.5 py-1 bg-red-500 text-white text-xs font-bold rounded-md shadow-sm animate-pulse">
                  <Pause className="w-3 h-3" />暂停中
                </div>
              )}
              {fault.hasDeviation && fault.deviationCount > 0 && (
                <div className={`absolute top-3 ${fault.paused ? "right-24" : "right-3"} inline-flex items-center gap-1 px-2 py-1 bg-amber-50 text-amber-700 text-xs font-semibold rounded-md border border-amber-200`}>
                  <Zap className="w-3 h-3" />偏差 ×{fault.deviationCount}
                </div>
              )}
              <div className="mb-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-mono text-slate-400">{fault.code}</span>
                  <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full border ${riskBadgeClass(fault.riskLevel)}`}>{fault.riskLevel}</span>
                </div>
                <h3 className="text-lg font-bold text-slate-900 leading-tight">{fault.name}</h3>
              </div>
              <div className="space-y-2 mb-4 text-sm">
                <div className="flex items-center gap-2 text-slate-600">
                  <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                  <span>{fault.location}</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex items-center gap-2 text-slate-600">
                    <Compass className="w-4 h-4 text-slate-400 shrink-0" />
                    <span>走向 {fault.strike}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-600">
                    <Compass className="w-4 h-4 text-slate-400 shrink-0" />
                    <span>倾角 {fault.dip}°</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-600">
                    <Ruler className="w-4 h-4 text-slate-400 shrink-0" />
                    <span>长 {fault.length}km</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-600">
                    <Layers className="w-4 h-4 text-slate-400 shrink-0" />
                    <span>深 {fault.depth}km</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                  <Activity className="w-3.5 h-3.5" />
                  <span>模拟 <span className="font-semibold text-slate-700">{fault.simulations.toLocaleString()}</span> 次</span>
                </div>
                <div className="text-xs text-slate-400">{fault.lastSim}</div>
              </div>
              {fault.hasDeviation && fault.maxDeviation > 20 && (
                <div className="mt-3 p-2.5 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1 font-semibold text-amber-800">
                      <AlertTriangle className="w-3.5 h-3.5" />最大偏差超阈值
                    </span>
                    <span className="font-bold text-red-600 font-mono">+{fault.maxDeviation}%</span>
                  </div>
                </div>
              )}
              <div className="mt-3 flex items-center justify-between">
                <span className="text-xs text-slate-400">含 {fault.segments} 分段</span>
                <span className="inline-flex items-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-700">
                  查看详情 <ChevronRight className="w-4 h-4" />
                </span>
              </div>
            </div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-16 text-center">
            <Search className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <div className="text-slate-500 font-medium">未找到匹配的断层记录</div>
            <div className="text-sm text-slate-400 mt-1">尝试修改搜索条件或筛选器</div>
          </div>
        )}
      </div>
    </div>
  );
}
