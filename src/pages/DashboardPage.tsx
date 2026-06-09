import ReactECharts from 'echarts-for-react';
import {
  TrendingUp,
  Clock,
  AlertTriangle,
  FileCheck,
  ListTodo,
  Activity,
  Target,
  ChevronRight,
  Zap,
  AlertOctagon,
  ShieldAlert,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import StatusBadge from '@/components/common/StatusBadge';

const statCards = [
  {
    title: '运行中任务',
    value: 23,
    unit: '个',
    trend: '+12%',
    trendUp: true,
    icon: Activity,
    iconClass: 'from-primary-500 to-blue-600',
    glowClass: 'shadow-glow-primary',
    valueClass: 'text-primary-400',
    subtitle: '今日新增 5 个',
  },
  {
    title: '平均完成率',
    value: 87.5,
    unit: '%',
    trend: '+3.2%',
    trendUp: true,
    icon: Target,
    iconClass: 'from-emerald-500 to-teal-600',
    glowClass: 'shadow-glow-success',
    valueClass: 'text-emerald-400',
    subtitle: '近30天统计',
  },
  {
    title: '待处理预警',
    value: 26,
    unit: '条',
    trend: '-8.5%',
    trendUp: false,
    icon: AlertTriangle,
    iconClass: 'from-warning-500 to-orange-600',
    glowClass: 'shadow-glow-warning',
    valueClass: 'text-warning-400',
    subtitle: '一级预警 3 条',
  },
  {
    title: '待审批数量',
    value: 14,
    unit: '项',
    trend: '+5',
    trendUp: true,
    icon: FileCheck,
    iconClass: 'from-violet-500 to-purple-600',
    glowClass: 'shadow-glow-info',
    valueClass: 'text-violet-400',
    subtitle: '教授级审批 4 项',
  },
];

const topAlerts = [
  {
    id: 'ALT-20260609-001',
    level: 'level1' as const,
    type: '剪切应力超限',
    fault: '龙门山南段',
    task: 'SIM-00342',
    value: '92.4 MPa',
    threshold: '80 MPa',
    time: '2分钟前',
  },
  {
    id: 'ALT-20260609-002',
    level: 'level1' as const,
    type: '滑动速率异常',
    fault: '鲜水河断裂',
    task: 'SIM-00338',
    value: '18.3 mm/yr',
    threshold: '12 mm/yr',
    time: '15分钟前',
  },
  {
    id: 'ALT-20260609-003',
    level: 'level2' as const,
    type: '收敛警告',
    fault: '安宁河断层',
    task: 'SIM-00345',
    value: '残差 1.2e-3',
    threshold: '1.0e-4',
    time: '48分钟前',
  },
  {
    id: 'ALT-20260608-015',
    level: 'level2' as const,
    type: '库仑应力升高',
    fault: '小江断裂北段',
    task: 'SIM-00329',
    value: 'ΔCFS 0.82 bar',
    threshold: '0.6 bar',
    time: '2小时前',
  },
  {
    id: 'ALT-20260608-011',
    level: 'level3' as const,
    type: '温度波动',
    fault: '红河断裂中段',
    task: 'SIM-00317',
    value: 'ΔT 3.8℃',
    threshold: '3.0℃',
    time: '4小时前',
  },
];

function getDaysArray(days: number) {
  const arr: string[] = [];
  const today = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    arr.push(`${d.getMonth() + 1}/${d.getDate()}`);
  }
  return arr;
}

function generateTrendData(days: number, base: number, variance: number, seed: number) {
  const arr: number[] = [];
  let v = base;
  for (let i = 0; i < days; i++) {
    const noise = (Math.sin(i * 0.7 + seed) + Math.sin(i * 0.3 + seed * 1.3)) * variance * 0.4;
    const random = ((Math.sin(i * 1.7 + seed * 2.1) + 1) / 2 - 0.5) * variance;
    v = base + noise + random;
    arr.push(Number(v.toFixed(1)));
  }
  return arr;
}

export default function DashboardPage() {
  const days = 30;
  const dates = getDaysArray(days);

  const trendOption = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(15, 23, 42, 0.95)',
      borderColor: 'rgba(51, 65, 85, 0.8)',
      textStyle: { color: '#e2e8f0' },
      axisPointer: { type: 'cross', crossStyle: { color: '#64748b' } },
    },
    legend: {
      data: ['任务完成数', '应力计算精度', '预警响应时长'],
      top: 0,
      right: 0,
      textStyle: { color: '#94a3b8', fontSize: 12 },
      itemGap: 20,
    },
    grid: {
      left: '3%',
      right: '3%',
      bottom: '3%',
      top: '15%',
      containLabel: true,
    },
    xAxis: [
      {
        type: 'category',
        data: dates,
        axisLine: { lineStyle: { color: '#334155' } },
        axisLabel: { color: '#64748b', fontSize: 11, interval: 2 },
        axisTick: { show: false },
      },
    ],
    yAxis: [
      {
        type: 'value',
        name: '数量',
        axisLine: { show: false },
        axisLabel: { color: '#64748b', fontSize: 11 },
        axisTick: { show: false },
        splitLine: { lineStyle: { color: 'rgba(51, 65, 85, 0.4)', type: 'dashed' } },
      },
      {
        type: 'value',
        name: '精度/时长',
        min: 0,
        max: 100,
        axisLine: { show: false },
        axisLabel: { color: '#64748b', fontSize: 11, formatter: '{value}%' },
        axisTick: { show: false },
        splitLine: { show: false },
      },
    ],
    series: [
      {
        name: '任务完成数',
        type: 'bar',
        barWidth: '45%',
        itemStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(22, 93, 255, 0.8)' },
              { offset: 1, color: 'rgba(22, 93, 255, 0.2)' },
            ],
          },
          borderRadius: [4, 4, 0, 0],
        },
        data: generateTrendData(days, 15, 8, 1).map((v) => Math.round(Math.max(3, v))),
      },
      {
        name: '应力计算精度',
        type: 'line',
        yAxisIndex: 1,
        smooth: true,
        symbol: 'circle',
        symbolSize: 6,
        showSymbol: false,
        lineStyle: { width: 2.5, color: '#10b981' },
        itemStyle: { color: '#10b981' },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(16, 185, 129, 0.25)' },
              { offset: 1, color: 'rgba(16, 185, 129, 0)' },
            ],
          },
        },
        data: generateTrendData(days, 87, 6, 2.5),
      },
      {
        name: '预警响应时长',
        type: 'line',
        yAxisIndex: 1,
        smooth: true,
        symbol: 'circle',
        symbolSize: 6,
        showSymbol: false,
        lineStyle: { width: 2.5, color: '#f59e0b' },
        itemStyle: { color: '#f59e0b' },
        data: generateTrendData(days, 42, 12, 3.7).map((v) => Number(Math.max(20, Math.min(75, v)).toFixed(1))),
      },
    ],
  };

  const pieOption = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'item',
      backgroundColor: 'rgba(15, 23, 42, 0.95)',
      borderColor: 'rgba(51, 65, 85, 0.8)',
      textStyle: { color: '#e2e8f0' },
    },
    legend: {
      orient: 'vertical',
      right: '5%',
      top: 'center',
      textStyle: { color: '#94a3b8', fontSize: 12 },
      itemGap: 12,
      formatter: (name: string) => {
        const map: Record<string, string> = {
          待校验: '待校验',
          计算中: '计算中',
          已完成: '已完成',
          审批中: '审批中',
          已回退: '已回退',
        };
        return map[name] || name;
      },
    },
    series: [
      {
        type: 'pie',
        radius: ['50%', '75%'],
        center: ['32%', '50%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 6,
          borderColor: '#0f172a',
          borderWidth: 3,
        },
        label: { show: false },
        emphasis: {
          label: { show: true, fontSize: 14, fontWeight: 'bold', color: '#e2e8f0' },
          itemStyle: {
            shadowBlur: 20,
            shadowOffsetX: 0,
            shadowColor: 'rgba(22, 93, 255, 0.5)',
          },
        },
        labelLine: { show: false },
        data: [
          {
            value: 18,
            name: '计算中',
            itemStyle: { color: { type: 'linear', x: 0, y: 0, x2: 1, y2: 1, colorStops: [{ offset: 0, color: '#8b5cf6' }, { offset: 1, color: '#6366f1' }] } },
          },
          {
            value: 62,
            name: '已完成',
            itemStyle: { color: { type: 'linear', x: 0, y: 0, x2: 1, y2: 1, colorStops: [{ offset: 0, color: '#10b981' }, { offset: 1, color: '#059669' }] } },
          },
          {
            value: 14,
            name: '审批中',
            itemStyle: { color: { type: 'linear', x: 0, y: 0, x2: 1, y2: 1, colorStops: [{ offset: 0, color: '#06b6d4' }, { offset: 1, color: '#0891b2' }] } },
          },
          {
            value: 8,
            name: '待校验',
            itemStyle: { color: { type: 'linear', x: 0, y: 0, x2: 1, y2: 1, colorStops: [{ offset: 0, color: '#f59e0b' }, { offset: 1, color: '#d97706' }] } },
          },
          {
            value: 5,
            name: '已回退',
            itemStyle: { color: { type: 'linear', x: 0, y: 0, x2: 1, y2: 1, colorStops: [{ offset: 0, color: '#f43f5e' }, { offset: 1, color: '#e11d48' }] } },
          },
        ],
      },
    ],
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">综合看板</h1>
          <p className="text-sm text-slate-500 mt-1">断层应力模拟平台运行概览与关键指标</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
          <span className="text-sm text-emerald-400 font-medium">系统运行正常</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {statCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div
              key={idx}
              className={cn(
                'relative overflow-hidden rounded-2xl bg-slate-900/70 backdrop-blur-sm border border-slate-800 p-5 transition-all hover:-translate-y-0.5 hover:border-slate-700',
                card.glowClass
              )}
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary-500/5 to-transparent rounded-full -translate-y-1/2 translate-x-1/2" />
              <div className="relative flex items-start justify-between">
                <div>
                  <div className="text-sm text-slate-400 font-medium">{card.title}</div>
                  <div className="mt-3 flex items-baseline gap-1">
                    <span className={cn('text-3xl font-bold tracking-tight', card.valueClass)}>
                      {card.value}
                    </span>
                    <span className="text-slate-500 text-sm">{card.unit}</span>
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <span
                      className={cn(
                        'inline-flex items-center gap-0.5 text-xs font-semibold px-2 py-0.5 rounded-full',
                        card.trendUp
                          ? 'bg-emerald-500/15 text-emerald-400'
                          : 'bg-rose-500/15 text-rose-400'
                      )}
                    >
                      <TrendingUp
                        className={cn('w-3 h-3', !card.trendUp && 'rotate-180')}
                      />
                      {card.trend}
                    </span>
                    <span className="text-xs text-slate-500">{card.subtitle}</span>
                  </div>
                </div>
                <div
                  className={cn(
                    'w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center shadow-lg',
                    card.iconClass
                  )}
                >
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 rounded-2xl bg-slate-900/70 backdrop-blur-sm border border-slate-800 p-5 shadow-glow-card">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary-500/20 flex items-center justify-center">
                <Zap className="w-4 h-4 text-primary-400" />
              </div>
              <div>
                <h2 className="font-semibold text-slate-100">30天运行趋势</h2>
                <p className="text-xs text-slate-500 mt-0.5">任务产出、精度与响应效率综合分析</p>
              </div>
            </div>
          </div>
          <ReactECharts option={trendOption} style={{ height: '340px' }} />
        </div>

        <div className="rounded-2xl bg-slate-900/70 backdrop-blur-sm border border-slate-800 p-5 shadow-glow-card">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-violet-500/20 flex items-center justify-center">
              <ListTodo className="w-4 h-4 text-violet-400" />
            </div>
            <div>
              <h2 className="font-semibold text-slate-100">任务状态分布</h2>
              <p className="text-xs text-slate-500 mt-0.5">全部任务 107 个</p>
            </div>
          </div>
          <ReactECharts option={pieOption} style={{ height: '320px' }} />
        </div>
      </div>

      <div className="rounded-2xl bg-slate-900/70 backdrop-blur-sm border border-slate-800 overflow-hidden shadow-glow-card">
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-danger-500/20 flex items-center justify-center">
              <ShieldAlert className="w-4 h-4 text-danger-400" />
            </div>
            <div>
              <h2 className="font-semibold text-slate-100">活跃预警 Top 5</h2>
              <p className="text-xs text-slate-500 mt-0.5">按触发时间倒序排列的最新异常事件</p>
            </div>
          </div>
          <button className="text-sm text-primary-400 hover:text-primary-300 inline-flex items-center gap-1 transition-colors">
            查看全部
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        <div className="divide-y divide-slate-800/70">
          {topAlerts.map((alert, idx) => (
            <div
              key={alert.id}
              className="px-5 py-4 flex items-center gap-4 hover:bg-slate-800/30 transition-colors cursor-pointer group"
            >
              <div className="shrink-0 w-7 h-7 rounded-lg bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-400 group-hover:bg-slate-700 transition-colors">
                {idx + 1}
              </div>
              <div className="shrink-0">
                <StatusBadge status={alert.level} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <AlertOctagon className={cn(
                    'w-4 h-4 shrink-0',
                    alert.level === 'level1' ? 'text-danger-400' : alert.level === 'level2' ? 'text-warning-400' : 'text-info-400'
                  )} />
                  <span className="font-medium text-slate-200">{alert.type}</span>
                  <span className="text-xs text-slate-500 font-mono">{alert.id}</span>
                </div>
                <div className="mt-1 flex items-center gap-4 text-xs text-slate-500">
                  <span>断层: <span className="text-slate-400">{alert.fault}</span></span>
                  <span>任务: <span className="text-slate-400 font-mono">{alert.task}</span></span>
                  <span className="text-danger-400 font-mono">
                    当前 {alert.value} / 阈值 {alert.threshold}
                  </span>
                </div>
              </div>
              <div className="shrink-0 flex items-center gap-4">
                <span className="text-xs text-slate-500 inline-flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {alert.time}
                </span>
                <ChevronRight className="w-5 h-5 text-slate-600 group-hover:text-slate-400 transition-colors" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
