import { useState, useEffect, useRef, useMemo } from "react";
import ReactECharts from "echarts-for-react";
import { Activity, Wifi, WifiOff, AlertTriangle, CheckCircle, Clock, Zap } from "lucide-react";

interface DataPoint {
  time: string;
  shear: number;
  coulomb: number;
  slipRate: number;
}

interface AnomalyPoint {
  index: number;
  type: "shear" | "coulomb" | "slipRate";
  value: number;
}

const SHEAR_THRESHOLD = 80;
const COULOMB_THRESHOLD = 0.6;
const SLIP_RATE_THRESHOLD = 12;

export default function MonitorPage() {
  const [data, setData] = useState<DataPoint[]>([]);
  const [anomalies, setAnomalies] = useState<AnomalyPoint[]>([]);
  const [isConnected, setIsConnected] = useState(true);
  const [progress, setProgress] = useState(67);
  const [status, setStatus] = useState<"running" | "paused" | "warning">("running");
  const [tick, setTick] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);

  const initialData = useMemo<DataPoint[]>(() => {
    const arr: DataPoint[] = [];
    const now = Date.now();
    for (let i = 59; i >= 0; i--) {
      const t = new Date(now - i * 2000);
      const shearBase = 45 + Math.sin(i * 0.15) * 20 + (Math.random() - 0.5) * 10;
      const coulombBase = 0.35 + Math.sin(i * 0.1 + 0.5) * 0.15 + (Math.random() - 0.5) * 0.08;
      const slipBase = 5 + Math.sin(i * 0.2 + 1) * 3 + (Math.random() - 0.5) * 2;
      arr.push({
        time: `${t.getHours().toString().padStart(2, "0")}:${t.getMinutes().toString().padStart(2, "0")}:${t.getSeconds().toString().padStart(2, "0")}`,
        shear: Number(shearBase.toFixed(2)),
        coulomb: Number(coulombBase.toFixed(3)),
        slipRate: Number(slipBase.toFixed(2)),
      });
    }
    return arr;
  }, []);

  useEffect(() => {
    setData(initialData);
  }, [initialData]);

  useEffect(() => {
    const interval = setInterval(() => {
      setTick((t) => t + 1);
      setData((prev) => {
        const last = prev[prev.length - 1];
        const now = new Date();
        const timeStr = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}:${now.getSeconds().toString().padStart(2, "0")}`;
        const anomalyRoll = Math.random();
        let newShear = last.shear + (Math.random() - 0.5) * 8;
        let newCoulomb = last.coulomb + (Math.random() - 0.5) * 0.06;
        let newSlip = last.slipRate + (Math.random() - 0.5) * 1.5;
        const newAnomalies: AnomalyPoint[] = [];
        if (anomalyRoll < 0.08) {
          newShear = SHEAR_THRESHOLD + 5 + Math.random() * 15;
          newAnomalies.push({ index: prev.length, type: "shear", value: Number(newShear.toFixed(2)) });
        }
        if (anomalyRoll > 0.92) {
          newCoulomb = COULOMB_THRESHOLD + 0.05 + Math.random() * 0.1;
          newAnomalies.push({ index: prev.length, type: "coulomb", value: Number(newCoulomb.toFixed(3)) });
        }
        if (anomalyRoll > 0.48 && anomalyRoll < 0.52) {
          newSlip = SLIP_RATE_THRESHOLD + 1 + Math.random() * 4;
          newAnomalies.push({ index: prev.length, type: "slipRate", value: Number(newSlip.toFixed(2)) });
        }
        newShear = Math.max(10, Math.min(120, newShear));
        newCoulomb = Math.max(0.05, Math.min(0.95, newCoulomb));
        newSlip = Math.max(1, Math.min(25, newSlip));
        if (newAnomalies.length > 0) {
          setAnomalies((a) => [...a.slice(-10), ...newAnomalies]);
          setStatus("warning");
          setTimeout(() => setStatus("running"), 3000);
        }
        const newPoint: DataPoint = {
          time: timeStr,
          shear: Number(newShear.toFixed(2)),
          coulomb: Number(newCoulomb.toFixed(3)),
          slipRate: Number(newSlip.toFixed(2)),
        };
        return [...prev.slice(1), newPoint];
      });
      setProgress((p) => (p >= 100 ? 20 : p + 0.3));
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const W = canvas.width;
    const H = canvas.height;
    const layers = 5;
    const gridSize = 12;
    let phase = tick * 0.05;

    const render = () => {
      phase += 0.008;
      ctx.clearRect(0, 0, W, H);
      const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
      bgGrad.addColorStop(0, "#0a0f1e");
      bgGrad.addColorStop(1, "#131b2e");
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, W, H);

      for (let layer = 0; layer < layers; layer++) {
        const layerOffset = layer * 18;
        const alpha = 0.12 + (layer / layers) * 0.25;
        const scale = 1 + layer * 0.06;
        const offsetY = layer * 8;
        for (let i = 0; i <= gridSize; i++) {
          const x1 = (W / gridSize) * i * scale + layerOffset;
          const y1 = 10 + offsetY;
          const x2 = (W / gridSize) * i * scale + layerOffset;
          const y2 = H - 30 - offsetY;
          const wave = Math.sin(i * 0.4 + phase + layer * 0.6) * 6;
          ctx.strokeStyle = `rgba(56, 189, 248, ${alpha})`;
          ctx.lineWidth = 0.8;
          ctx.beginPath();
          ctx.moveTo(x1, y1 + wave);
          ctx.lineTo(x2, y2 + wave);
          ctx.stroke();
        }
        for (let j = 0; j <= gridSize; j++) {
          const y = 10 + offsetY + ((H - 40 - offsetY * 2) / gridSize) * j;
          const wave = Math.sin(j * 0.5 + phase * 1.3 + layer * 0.4) * 5;
          ctx.strokeStyle = `rgba(34, 211, 238, ${alpha})`;
          ctx.lineWidth = 0.8;
          ctx.beginPath();
          ctx.moveTo(layerOffset + 10 + wave, y);
          ctx.lineTo(W - layerOffset - 10 - wave, y);
          ctx.stroke();
        }
      }

      const centerX = W / 2;
      const centerY = H / 2 + 10;
      for (let r = 1; r <= 6; r++) {
        const radius = r * 28;
        const stressIntensity = 0.5 + Math.sin(phase * 2 + r * 0.7) * 0.4;
        ctx.strokeStyle = `rgba(251, 146, 60, ${0.08 + stressIntensity * 0.25})`;
        ctx.lineWidth = 1 + r * 0.15;
        ctx.beginPath();
        ctx.ellipse(centerX, centerY, radius, radius * 0.55, 0, 0, Math.PI * 2);
        ctx.stroke();
      }

      const hotSpots = [
        { x: centerX - 60, y: centerY - 20, hue: 0 },
        { x: centerX + 70, y: centerY + 15, hue: 25 },
        { x: centerX - 10, y: centerY + 40, hue: 10 },
      ];
      hotSpots.forEach((spot, idx) => {
        const pulse = 0.6 + Math.sin(phase * 3 + idx) * 0.4;
        const grad = ctx.createRadialGradient(spot.x, spot.y, 0, spot.x, spot.y, 40 * pulse);
        grad.addColorStop(0, `hsla(${spot.hue}, 95%, 60%, 0.7)`);
        grad.addColorStop(0.5, `hsla(${spot.hue}, 90%, 50%, 0.25)`);
        grad.addColorStop(1, `hsla(${spot.hue}, 85%, 45%, 0)`);
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(spot.x, spot.y, 40 * pulse, 0, Math.PI * 2);
        ctx.fill();
      });

      const vectorCount = 14;
      for (let v = 0; v < vectorCount; v++) {
        const angle = (v / vectorCount) * Math.PI * 2 + phase * 0.5;
        const len = 35 + Math.sin(phase * 2 + v) * 12;
        const x1 = centerX + Math.cos(angle) * 20;
        const y1 = centerY + Math.sin(angle) * 12;
        const x2 = centerX + Math.cos(angle) * (20 + len);
        const y2 = centerY + Math.sin(angle) * (12 + len * 0.6);
        const arrowIntensity = Math.abs(Math.sin(phase * 2 + v * 0.8));
        ctx.strokeStyle = `rgba(129, 230, 217, ${0.4 + arrowIntensity * 0.5})`;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
        const ang = Math.atan2(y2 - y1, x2 - x1);
        ctx.beginPath();
        ctx.moveTo(x2, y2);
        ctx.lineTo(x2 - 5 * Math.cos(ang - 0.4), y2 - 5 * Math.sin(ang - 0.4));
        ctx.lineTo(x2 - 5 * Math.cos(ang + 0.4), y2 - 5 * Math.sin(ang + 0.4));
        ctx.closePath();
        ctx.fillStyle = `rgba(129, 230, 217, ${0.6 + arrowIntensity * 0.4})`;
        ctx.fill();
      }

      animFrameRef.current = requestAnimationFrame(render);
    };
    render();
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [tick]);

  const chartOption = {
    backgroundColor: "transparent",
    tooltip: {
      trigger: "axis",
      backgroundColor: "rgba(15, 23, 42, 0.95)",
      borderColor: "#334155",
      textStyle: { color: "#e2e8f0" },
    },
    legend: {
      data: ["剪应力 (kPa)", "库仑应力", "滑动速率 (mm/s)"],
      textStyle: { color: "#94a3b8" },
      top: 5,
      right: 10,
    },
    grid: { left: 50, right: 55, top: 45, bottom: 35 },
    xAxis: {
      type: "category",
      data: data.map((d) => d.time),
      axisLabel: { color: "#64748b", fontSize: 10, interval: 9 },
      axisLine: { lineStyle: { color: "#334155" } },
      splitLine: { show: false },
    },
    yAxis: [
      {
        type: "value",
        name: "剪应力/滑动速率",
        nameTextStyle: { color: "#64748b", fontSize: 11 },
        min: 0,
        max: 130,
        axisLabel: { color: "#64748b", fontSize: 10 },
        splitLine: { lineStyle: { color: "#1e293b", type: "dashed" } },
      },
      {
        type: "value",
        name: "库仑应力",
        nameTextStyle: { color: "#64748b", fontSize: 11 },
        min: 0,
        max: 1,
        position: "right",
        axisLabel: { color: "#64748b", fontSize: 10 },
        splitLine: { show: false },
      },
    ],
    series: [
      {
        name: "剪应力 (kPa)",
        type: "line",
        smooth: true,
        symbol: "circle",
        symbolSize: 4,
        lineStyle: { width: 2, color: "#f43f5e" },
        itemStyle: { color: "#f43f5e" },
        areaStyle: {
          color: {
            type: "linear",
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: "rgba(244, 63, 94, 0.28)" },
              { offset: 1, color: "rgba(244, 63, 94, 0)" },
            ],
          },
        },
        data: data.map((d) => d.shear),
        markLine: {
          silent: true,
          symbol: "none",
          lineStyle: { color: "#ef4444", type: "dashed", width: 1.5 },
          data: [{ yAxis: SHEAR_THRESHOLD, label: { formatter: `阈值 ${SHEAR_THRESHOLD}`, color: "#ef4444", fontSize: 10 } }],
        },
        markPoint: {
          symbol: "pin",
          symbolSize: 14,
          itemStyle: { color: "#fca5a5" },
          label: { color: "#450a0a", fontSize: 9, fontWeight: "bold" },
          data: anomalies.filter((a) => a.type === "shear").map((a) => ({ coord: [a.index, a.value], value: "!" })),
        },
      },
      {
        name: "库仑应力",
        type: "line",
        smooth: true,
        yAxisIndex: 1,
        symbol: "circle",
        symbolSize: 4,
        lineStyle: { width: 2, color: "#8b5cf6" },
        itemStyle: { color: "#8b5cf6" },
        areaStyle: {
          color: {
            type: "linear",
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: "rgba(139, 92, 246, 0.25)" },
              { offset: 1, color: "rgba(139, 92, 246, 0)" },
            ],
          },
        },
        data: data.map((d) => d.coulomb),
        markLine: {
          silent: true,
          symbol: "none",
          lineStyle: { color: "#ef4444", type: "dashed", width: 1.5 },
          data: [{ yAxis: COULOMB_THRESHOLD, label: { formatter: `阈值 ${COULOMB_THRESHOLD}`, color: "#ef4444", fontSize: 10 } }],
        },
        markPoint: {
          symbol: "pin",
          symbolSize: 14,
          itemStyle: { color: "#c4b5fd" },
          label: { color: "#2e1065", fontSize: 9, fontWeight: "bold" },
          data: anomalies.filter((a) => a.type === "coulomb").map((a) => ({ coord: [a.index, a.value], value: "!" })),
        },
      },
      {
        name: "滑动速率 (mm/s)",
        type: "line",
        smooth: true,
        symbol: "circle",
        symbolSize: 4,
        lineStyle: { width: 2, color: "#10b981" },
        itemStyle: { color: "#10b981" },
        areaStyle: {
          color: {
            type: "linear",
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: "rgba(16, 185, 129, 0.25)" },
              { offset: 1, color: "rgba(16, 185, 129, 0)" },
            ],
          },
        },
        data: data.map((d) => d.slipRate),
        markLine: {
          silent: true,
          symbol: "none",
          lineStyle: { color: "#ef4444", type: "dashed", width: 1.5 },
          data: [{ yAxis: SLIP_RATE_THRESHOLD, label: { formatter: `阈值 ${SLIP_RATE_THRESHOLD}`, color: "#ef4444", fontSize: 10 } }],
        },
        markPoint: {
          symbol: "pin",
          symbolSize: 14,
          itemStyle: { color: "#6ee7b7" },
          label: { color: "#052e16", fontSize: 9, fontWeight: "bold" },
          data: anomalies.filter((a) => a.type === "slipRate").map((a) => ({ coord: [a.index, a.value], value: "!" })),
        },
      },
    ],
  };

  const current = data[data.length - 1];
  const statusConfig = {
    running: { label: "运行中", color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/30", icon: CheckCircle },
    paused: { label: "已暂停", color: "text-slate-400", bg: "bg-slate-500/10", border: "border-slate-500/30", icon: Clock },
    warning: { label: "异常告警", color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/30", icon: AlertTriangle },
  };
  const StatusIcon = statusConfig[status].icon;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-5">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-sky-500/15 border border-sky-500/30">
            <Activity className="w-6 h-6 text-sky-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold">断层应力实时监控台</h1>
            <p className="text-sm text-slate-400">任务编号 TASK-20260609-003 · 圣安德烈斯断层段</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border ${statusConfig[status].bg} ${statusConfig[status].border}`}>
            <StatusIcon className={`w-4 h-4 ${statusConfig[status].color} ${status === "running" ? "animate-pulse" : ""}`} />
            <span className={`text-sm font-medium ${statusConfig[status].color}`}>{statusConfig[status].label}</span>
          </div>
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border ${isConnected ? "bg-emerald-500/10 border-emerald-500/30" : "bg-rose-500/10 border-rose-500/30"}`}>
            {isConnected ? <Wifi className="w-4 h-4 text-emerald-400" /> : <WifiOff className="w-4 h-4 text-rose-400" />}
            <span className={`text-sm ${isConnected ? "text-emerald-400" : "text-rose-400"}`}>{isConnected ? "WebSocket 已连接" : "连接断开"}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-5 mb-5">
        <div className="col-span-5 bg-slate-900/60 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" />
              伪3D应力场分布
            </h2>
            <div className="flex gap-3 text-xs">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-rose-500"></span>高应力区</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400"></span>中应力区</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-cyan-400"></span>低应力区</span>
            </div>
          </div>
          <canvas ref={canvasRef} width={520} height={340} className="w-full rounded-lg border border-slate-800" />
          <div className="grid grid-cols-3 gap-2 mt-3 text-xs">
            <div className="p-2 rounded bg-slate-800/50 text-center">
              <div className="text-slate-400">最大主应力</div>
              <div className="text-base font-bold text-rose-400">{(current?.shear * 1.3 || 0).toFixed(1)} kPa</div>
            </div>
            <div className="p-2 rounded bg-slate-800/50 text-center">
              <div className="text-slate-400">最小主应力</div>
              <div className="text-base font-bold text-cyan-400">{(current?.shear * 0.4 || 0).toFixed(1)} kPa</div>
            </div>
            <div className="p-2 rounded bg-slate-800/50 text-center">
              <div className="text-slate-400">应力比 λ</div>
              <div className="text-base font-bold text-amber-400">0.{(current?.coulomb * 100 || 0).toFixed(0)}</div>
            </div>
          </div>
        </div>

        <div className="col-span-7 bg-slate-900/60 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
              <Activity className="w-4 h-4 text-rose-400" />
              多参数时序监测曲线
            </h2>
            <div className="flex gap-3 text-xs text-slate-400">
              {current && (
                <>
                  <span>剪应力: <span className="text-rose-400 font-semibold">{current.shear} kPa</span></span>
                  <span>库仑: <span className="text-violet-400 font-semibold">{current.coulomb}</span></span>
                  <span>滑速: <span className="text-emerald-400 font-semibold">{current.slipRate} mm/s</span></span>
                </>
              )}
            </div>
          </div>
          <ReactECharts option={chartOption} style={{ height: 380 }} notMerge={true} lazyUpdate={true} />
        </div>
      </div>

      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-slate-200">模拟进度</span>
            <span className="text-xs text-slate-400">时间步 5672 / 8400 · Δt=0.01s</span>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <span className="text-slate-400">内存占用: <span className="text-slate-200 font-medium">1.42 GB</span></span>
            <span className="text-slate-400">迭代耗时: <span className="text-slate-200 font-medium">42.8 ms/步</span></span>
            <span className="text-slate-400">累计异常: <span className="text-amber-400 font-medium">{anomalies.length} 次</span></span>
          </div>
        </div>
        <div className="h-3 bg-slate-800 rounded-full overflow-hidden mb-2">
          <div
            className="h-full rounded-full transition-all duration-1000 relative"
            style={{
              width: `${progress}%`,
              background: "linear-gradient(90deg, #0ea5e9 0%, #6366f1 50%, #ec4899 100%)",
            }}
          >
            <div className="absolute inset-0 bg-white/10 animate-pulse"></div>
          </div>
        </div>
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span>{progress.toFixed(1)}%</span>
          <span>预计剩余: ~{Math.ceil((100 - progress) * 0.6)} 分钟</span>
        </div>
      </div>
    </div>
  );
}
