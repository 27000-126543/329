import { ReactNode } from "react";
import ReactECharts from "echarts-for-react";
import { cn } from "@/lib/utils";
import { MoreHorizontal, Download, RefreshCw } from "lucide-react";
import type { EChartsOption } from "echarts";

interface ChartCardProps {
  title: string;
  subtitle?: string;
  option: EChartsOption;
  chartHeight?: number | string;
  toolbar?: ReactNode;
  className?: string;
  showDefaultToolbar?: boolean;
  onRefresh?: () => void;
}

export default function ChartCard({
  title,
  subtitle,
  option,
  chartHeight = 320,
  toolbar,
  className,
  showDefaultToolbar = true,
  onRefresh,
}: ChartCardProps) {
  return (
    <div
      className={cn(
        "bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col",
        className
      )}
    >
      <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-bold text-slate-800 text-sm leading-tight">{title}</h3>
          {subtitle && (
            <p className="text-xs text-slate-500 mt-0.5 truncate">{subtitle}</p>
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {toolbar}
          {showDefaultToolbar && (
            <>
              <button
                onClick={onRefresh}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
                title="刷新"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
              <button
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
                title="导出图片"
              >
                <Download className="w-4 h-4" />
              </button>
              <button
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
                title="更多操作"
              >
                <MoreHorizontal className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>
      <div className="p-4 flex-1">
        <ReactECharts option={option} style={{ height: chartHeight, width: "100%" }} notMerge={true} />
      </div>
    </div>
  );
}
