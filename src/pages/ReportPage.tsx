import { useState, useRef } from "react";
import ReactECharts from "echarts-for-react";
import {
  Download,
  FileJson,
  FileSpreadsheet,
  FileText,
  Filter,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  AlertTriangle,
  Calendar,
  User,
  Hash,
  Clock,
  MapPin,
} from "lucide-react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

export default function ReportPage() {
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [faultFilter, setFaultFilter] = useState("all");
  const [stressFilter, setStressFilter] = useState("all");
  const [timeRange, setTimeRange] = useState({ start: "2025-01-01", end: "2026-06-09" });
  const reportRef = useRef<HTMLDivElement>(null);

  const stressHeatmapOption = {
    title: { text: "应力场2D热力图", left: "center", textStyle: { fontSize: 14, fontWeight: "bold" } },
    tooltip: { position: "top" },
    grid: { height: "60%", top: "15%" },
    xAxis: { type: "category", data: ["0°", "30°", "60°", "90°", "120°", "150°", "180°", "210°", "240°", "270°", "300°", "330°"], splitArea: { show: true } },
    yAxis: { type: "category", data: ["5km", "10km", "15km", "20km", "25km", "30km", "35km", "40km"], splitArea: { show: true } },
    visualMap: { min: -50, max: 120, calculable: true, orient: "horizontal", left: "center", bottom: "0%", inRange: { color: ["#313695", "#4575b4", "#74add1", "#abd9e9", "#ffffbf", "#fee090", "#fdae61", "#f46d43", "#d73027", "#a50026"] } },
    series: [{
      name: "应力值", type: "heatmap",
      data: [[0,0,12],[0,1,25],[0,2,45],[0,3,68],[0,4,89],[0,5,102],[0,6,95],[0,7,78],
             [1,0,18],[1,1,35],[1,2,52],[1,3,75],[1,4,95],[1,5,110],[1,6,108],[1,7,85],
             [2,0,22],[2,1,42],[2,2,65],[2,3,88],[2,4,105],[2,5,118],[2,6,112],[2,7,92],
             [3,0,15],[3,1,30],[3,2,55],[3,3,82],[3,4,108],[3,5,115],[3,6,105],[3,7,88],
             [4,0,10],[4,1,25],[4,2,48],[4,3,72],[4,4,98],[4,5,108],[4,6,102],[4,7,75],
             [5,0,8],[5,1,20],[5,2,40],[5,3,65],[5,4,85],[5,5,95],[5,6,92],[5,7,68],
             [6,0,12],[6,1,28],[6,2,50],[6,3,78],[6,4,100],[6,5,110],[6,6,100],[6,7,72],
             [7,0,16],[7,1,34],[7,2,58],[7,3,85],[7,4,108],[7,5,118],[7,6,108],[7,7,82],
             [8,0,14],[8,1,32],[8,2,54],[8,3,80],[8,4,102],[8,5,112],[8,6,104],[8,7,78],
             [9,0,10],[9,1,24],[9,2,46],[9,3,70],[9,4,92],[9,5,100],[9,6,95],[9,7,70],
             [10,0,6],[10,1,18],[10,2,38],[10,3,60],[10,4,82],[10,5,92],[10,6,88],[10,7,62],
             [11,0,9],[11,1,22],[11,2,44],[11,3,68],[11,4,90],[11,5,102],[11,6,96],[11,7,68]],
      label: { show: false },
      emphasis: { itemStyle: { shadowBlur: 10, shadowColor: "rgba(0, 0, 0, 0.5)" } }
    }]
  };

  const slipPotentialOption = {
    title: { text: "断层滑动势分布", left: "center", textStyle: { fontSize: 14, fontWeight: "bold" } },
    tooltip: { trigger: "axis", axisPointer: { type: "shadow" } },
    grid: { left: "3%", right: "4%", bottom: "3%", top: "18%", containLabel: true },
    xAxis: { type: "category", data: ["F-01", "F-02", "F-03", "F-04", "F-05", "F-06", "F-07", "F-08", "F-09", "F-10"], axisLabel: { rotate: 30 } },
    yAxis: { type: "value", name: "滑动势指数" },
    series: [{
      type: "bar",
      data: [
        { value: 0.85, itemStyle: { color: "#ef4444" } },
        { value: 0.72, itemStyle: { color: "#f97316" } },
        { value: 0.58, itemStyle: { color: "#eab308" } },
        { value: 0.45, itemStyle: { color: "#22c55e" } },
        { value: 0.38, itemStyle: { color: "#22c55e" } },
        { value: 0.91, itemStyle: { color: "#ef4444" } },
        { value: 0.63, itemStyle: { color: "#f97316" } },
        { value: 0.52, itemStyle: { color: "#eab308" } },
        { value: 0.34, itemStyle: { color: "#22c55e" } },
        { value: 0.78, itemStyle: { color: "#ef4444" } }
      ],
      markLine: {
        data: [{ type: "average", name: "平均值" }],
        lineStyle: { color: "#6366f1" }
      },
      label: { show: true, position: "top", formatter: "{c}" }
    }]
  };

  const momentReleaseOption = {
    title: { text: "地震矩释放时序", left: "center", textStyle: { fontSize: 14, fontWeight: "bold" } },
    tooltip: { trigger: "axis" },
    legend: { data: ["累积矩释放", "瞬时释放速率"], top: "8%" },
    grid: { left: "3%", right: "4%", bottom: "3%", top: "20%", containLabel: true },
    xAxis: { type: "category", boundaryGap: false, data: ["2025-Q1", "2025-Q2", "2025-Q3", "2025-Q4", "2026-Q1", "2026-Q2"] },
    yAxis: [
      { type: "value", name: "累积矩(N·m)", position: "left" },
      { type: "value", name: "速率(N·m/yr)", position: "right" }
    ],
    series: [
      {
        name: "累积矩释放", type: "line", smooth: true,
        data: [1.2e17, 3.8e17, 7.5e17, 1.2e18, 1.8e18, 2.5e18],
        areaStyle: { opacity: 0.3, color: "#6366f1" },
        lineStyle: { color: "#6366f1", width: 3 },
        itemStyle: { color: "#6366f1" }
      },
      {
        name: "瞬时释放速率", type: "line", smooth: true, yAxisIndex: 1,
        data: [4.8e17, 1.04e18, 1.48e18, 1.8e18, 2.4e18, 2.8e18],
        lineStyle: { color: "#ec4899", width: 3, type: "dashed" },
        itemStyle: { color: "#ec4899" }
      }
    ]
  };

  const coulombAnimationOption = {
    title: { text: `库仑应力演化 (T=${currentTime + 1}/12)`, left: "center", textStyle: { fontSize: 14, fontWeight: "bold" } },
    tooltip: { trigger: "axis" },
    grid: { left: "3%", right: "4%", bottom: "8%", top: "15%", containLabel: true },
    xAxis: { type: "category", data: ["F-01", "F-02", "F-03", "F-04", "F-05", "F-06", "F-07", "F-08"] },
    yAxis: { type: "value", name: "库仑应力(bar)" },
    series: [{
      type: "bar",
      data: generateCoulombData(currentTime),
      itemStyle: {
        color: (params: { value: number }) => params.value > 0 ? "#ef4444" : "#3b82f6"
      },
      label: { show: true, position: "top", formatter: "{c}", fontSize: 10 }
    }]
  };

  function generateCoulombData(t: number) {
    const base = [0.5, -0.3, 1.2, 0.8, -0.5, 1.8, 0.3, -0.1];
    return base.map(v => parseFloat((v + t * 0.15 * (v > 0 ? 1 : -1)).toFixed(2)));
  }

  const highRiskSegments = [
    { id: "F-06-S3", fault: "龙门山断裂带南段", segment: "映秀-北川段", risk: "极高", probability: 0.92, moment: "2.1e18 N·m", mag: "M7.8+", length: "45km" },
    { id: "F-01-S2", fault: "鲜水河断裂带", segment: "康定段", risk: "极高", probability: 0.85, moment: "1.5e18 N·m", mag: "M7.5+", length: "38km" },
    { id: "F-10-S1", fault: "安宁河断裂带", segment: "冕宁段", risk: "高", probability: 0.78, moment: "9.8e17 N·m", mag: "M7.2+", length: "32km" },
    { id: "F-02-S4", fault: "小江断裂带", segment: "东川段", risk: "高", probability: 0.72, moment: "7.2e17 N·m", mag: "M7.0+", length: "28km" },
    { id: "F-07-S2", fault: "红河断裂带", segment: "元江段", risk: "中高", probability: 0.63, moment: "5.1e17 N·m", mag: "M6.8+", length: "25km" },
  ];

  function handleExportCSV() {
    const headers = ["断层ID", "断层名称", "分段", "风险等级", "破裂概率", "地震矩", "震级", "长度(km)"];
    const rows = highRiskSegments.map(s => [s.id, s.fault, s.segment, s.risk, s.probability, s.moment, s.mag, s.length]);
    const csv = [headers, ...rows].map(r => r.join(",")).join("\n");
    const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `high_risk_report_${Date.now()}.csv`; a.click();
    URL.revokeObjectURL(url);
  }

  function handleExportJSON() {
    const data = {
      exportTime: new Date().toISOString(),
      filters: { faultFilter, stressFilter, timeRange },
      highRiskSegments,
      summary: { totalSegments: highRiskSegments.length, highRisk: 3, mediumRisk: 2 }
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `report_${Date.now()}.json`; a.click();
    URL.revokeObjectURL(url);
  }

  async function handleGeneratePDF() {
    if (!reportRef.current) return;
    const canvas = await html2canvas(reportRef.current, { scale: 2 });
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("l", "mm", "a4");
    const imgWidth = 280;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    pdf.addImage(imgData, "PNG", 10, 10, imgWidth, imgHeight);
    pdf.save(`地震风险报告_${Date.now()}.pdf`);
  }

  function togglePlay() {
    if (playing) {
      setPlaying(false);
    } else {
      setPlaying(true);
      const interval = setInterval(() => {
        setCurrentTime(prev => {
          if (prev >= 11) { clearInterval(interval); setPlaying(false); return 0; }
          return prev + 1;
        });
      }, 800);
    }
  }

  const riskBadgeClass = (risk: string) => {
    switch (risk) {
      case "极高": return "bg-red-100 text-red-800 border-red-200";
      case "高": return "bg-orange-100 text-orange-800 border-orange-200";
      case "中高": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      default: return "bg-green-100 text-green-800 border-green-200";
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div ref={reportRef} className="max-w-7xl mx-auto space-y-6">
        {/* 顶部任务元信息摘要 */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl font-bold text-white">地震风险模拟结果报告</h1>
                <p className="text-indigo-100 text-sm mt-1">任务编号: SIM-2026-0609-00329</p>
              </div>
              <span className="px-3 py-1 bg-green-500/90 text-white text-sm font-medium rounded-full">已完成</span>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 p-6">
            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
              <div className="p-2 bg-indigo-100 rounded-lg"><Hash className="w-5 h-5 text-indigo-600" /></div>
              <div>
                <div className="text-xs text-slate-500">模拟任务ID</div>
                <div className="font-semibold text-slate-800">#329</div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
              <div className="p-2 bg-violet-100 rounded-lg"><User className="w-5 h-5 text-violet-600" /></div>
              <div>
                <div className="text-xs text-slate-500">提交人</div>
                <div className="font-semibold text-slate-800">张首席</div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
              <div className="p-2 bg-blue-100 rounded-lg"><Calendar className="w-5 h-5 text-blue-600" /></div>
              <div>
                <div className="text-xs text-slate-500">创建时间</div>
                <div className="font-semibold text-slate-800">2026-06-08</div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
              <div className="p-2 bg-emerald-100 rounded-lg"><Clock className="w-5 h-5 text-emerald-600" /></div>
              <div>
                <div className="text-xs text-slate-500">耗时</div>
                <div className="font-semibold text-slate-800">2h 38m</div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
              <div className="p-2 bg-amber-100 rounded-lg"><MapPin className="w-5 h-5 text-amber-600" /></div>
              <div>
                <div className="text-xs text-slate-500">研究区域</div>
                <div className="font-semibold text-slate-800">西南地区</div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
              <div className="p-2 bg-red-100 rounded-lg"><AlertTriangle className="w-5 h-5 text-red-600" /></div>
              <div>
                <div className="text-xs text-slate-500">高风险段</div>
                <div className="font-semibold text-red-600">5 段</div>
              </div>
            </div>
          </div>
        </div>

        {/* 4个ECharts图表 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
            <ReactECharts option={stressHeatmapOption} style={{ height: "340px" }} />
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
            <ReactECharts option={slipPotentialOption} style={{ height: "340px" }} />
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
            <ReactECharts option={momentReleaseOption} style={{ height: "340px" }} />
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
            <ReactECharts option={coulombAnimationOption} style={{ height: "280px" }} />
            <div className="flex items-center gap-4 mt-2 px-2">
              <div className="flex items-center gap-2">
                <button onClick={() => setCurrentTime(0)} className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 transition"><SkipBack className="w-4 h-4" /></button>
                <button onClick={togglePlay} className="p-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition">
                  {playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </button>
                <button onClick={() => setCurrentTime(11)} className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 transition"><SkipForward className="w-4 h-4" /></button>
              </div>
              <div className="flex-1">
                <input type="range" min="0" max="11" value={currentTime}
                  onChange={(e) => setCurrentTime(parseInt(e.target.value))}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600" />
                <div className="flex justify-between text-xs text-slate-500 mt-1">
                  <span>2025-Q1</span><span>2025-Q3</span><span>2026-Q1</span><span>2026-Q2</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 数据导出面板 + PDF按钮 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Filter className="w-5 h-5 text-indigo-600" />
              <h2 className="font-bold text-slate-800">数据导出筛选</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">断层段筛选</label>
                <select value={faultFilter} onChange={(e) => setFaultFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
                  <option value="all">全部断层段</option>
                  <option value="longmenshan">龙门山断裂带</option>
                  <option value="xianshuihe">鲜水河断裂带</option>
                  <option value="anninghe">安宁河断裂带</option>
                  <option value="xiaojiang">小江断裂带</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">应力源</label>
                <select value={stressFilter} onChange={(e) => setStressFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
                  <option value="all">全部应力源</option>
                  <option value="tectonic">构造应力</option>
                  <option value="coulomb">库仑应力触发</option>
                  <option value="pore">孔隙压力</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="block text-sm font-medium text-slate-700 mb-1">时间窗口</label>
                <div className="flex gap-2">
                  <input type="date" value={timeRange.start} onChange={(e) => setTimeRange({ ...timeRange, start: e.target.value })}
                    className="flex-1 px-2 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm" />
                  <input type="date" value={timeRange.end} onChange={(e) => setTimeRange({ ...timeRange, end: e.target.value })}
                    className="flex-1 px-2 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm" />
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-3 pt-2">
              <button onClick={handleExportCSV}
                className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition font-medium">
                <FileSpreadsheet className="w-4 h-4" />导出 CSV
              </button>
              <button onClick={handleExportJSON}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium">
                <FileJson className="w-4 h-4" />导出 JSON
              </button>
            </div>
          </div>

          <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl shadow-sm p-6 text-white">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="w-5 h-5 text-amber-400" />
              <h2 className="font-bold">生成 PDF 报告</h2>
            </div>
            <p className="text-sm text-slate-300 mb-4">将当前报告所有图表、筛选数据和高风险段分析打包为标准PDF文档，支持打印与存档。</p>
            <div className="space-y-2 text-xs text-slate-400 mb-4">
              <div className="flex justify-between"><span>报告页数估算</span><span>~ 6 页</span></div>
              <div className="flex justify-between"><span>包含图表</span><span>4 个</span></div>
              <div className="flex justify-between"><span>高风险段记录</span><span>{highRiskSegments.length} 条</span></div>
              <div className="flex justify-between"><span>水印签名</span><span className="text-emerald-400">已启用</span></div>
            </div>
            <button onClick={handleGeneratePDF}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold rounded-lg transition">
              <Download className="w-4 h-4" />下载 PDF 报告
            </button>
          </div>
        </div>

        {/* 高风险段表格 */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <h2 className="font-bold text-slate-800">高风险断层段列表</h2>
              <span className="px-2 py-0.5 text-xs bg-red-100 text-red-700 rounded-full font-medium">{highRiskSegments.length} 段</span>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">ID</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">所属断裂带</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">分段名称</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">风险等级</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">破裂概率</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">预估地震矩</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">震级</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">破裂长度</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {highRiskSegments.map((seg, idx) => (
                  <tr key={seg.id} className={idx < 2 ? "bg-red-50/50" : "hover:bg-slate-50"}>
                    <td className="px-6 py-4 whitespace-nowrap font-mono text-sm text-slate-600">{seg.id}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-800 font-medium">{seg.fault}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">{seg.segment}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2.5 py-0.5 text-xs font-semibold rounded-full border ${riskBadgeClass(seg.risk)}`}>{seg.risk}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-2 bg-slate-200 rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-yellow-400 to-red-600" style={{ width: `${seg.probability * 100}%` }} />
                        </div>
                        <span className="text-sm font-semibold text-slate-700">{(seg.probability * 100).toFixed(0)}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-slate-700">{seg.moment}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-bold text-red-600">{seg.mag}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">{seg.length}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
