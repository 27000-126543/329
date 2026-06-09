import { cn } from '@/lib/utils';
import {
  Clock,
  Cpu,
  Loader2,
  Activity,
  Zap,
  CheckCircle2,
  RotateCcw,
  ShieldCheck,
  Crown,
  Rocket,
  AlertCircle,
  AlertTriangle,
  AlertOctagon,
} from 'lucide-react';
import type { TaskStatus, AlertLevel } from '../../../shared/types';

interface StatusBadgeProps {
  status: TaskStatus | AlertLevel;
  size?: 'sm' | 'md';
  showIcon?: boolean;
  className?: string;
}

const taskStatusConfig: Record<
  TaskStatus,
  { label: string; icon: React.ElementType; className: string; dotClass: string }
> = {
  pending_verify: {
    label: '待校验',
    icon: Clock,
    className:
      'bg-slate-500/15 text-slate-300 border-slate-500/30',
    dotClass: 'bg-slate-400',
  },
  mesh_generating: {
    label: '网格生成中',
    icon: Cpu,
    className:
      'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
    dotClass: 'bg-cyan-400',
  },
  initializing: {
    label: '初始化',
    icon: Loader2,
    className:
      'bg-blue-500/15 text-blue-300 border-blue-500/30',
    dotClass: 'bg-blue-400',
  },
  stress_computing: {
    label: '应力计算中',
    icon: Activity,
    className:
      'bg-violet-500/15 text-violet-300 border-violet-500/30',
    dotClass: 'bg-violet-400',
  },
  slip_evaluating: {
    label: '滑动评估中',
    icon: Zap,
    className:
      'bg-amber-500/15 text-amber-300 border-amber-500/30',
    dotClass: 'bg-amber-400',
  },
  completed: {
    label: '已完成',
    icon: CheckCircle2,
    className:
      'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    dotClass: 'bg-emerald-400',
  },
  rollback: {
    label: '已回退',
    icon: RotateCcw,
    className:
      'bg-rose-500/15 text-rose-300 border-rose-500/30',
    dotClass: 'bg-rose-400',
  },
  postdoc_approved: {
    label: '博士后审批通过',
    icon: ShieldCheck,
    className:
      'bg-blue-500/15 text-blue-300 border-blue-500/30',
    dotClass: 'bg-blue-400',
  },
  professor_approved: {
    label: '教授审批通过',
    icon: Crown,
    className:
      'bg-violet-500/15 text-violet-300 border-violet-500/30',
    dotClass: 'bg-violet-400',
  },
  published: {
    label: '已发布',
    icon: Rocket,
    className:
      'bg-primary-500/15 text-primary-300 border-primary-500/30',
    dotClass: 'bg-primary-400',
  },
};

const alertLevelConfig: Record<
  AlertLevel,
  { label: string; icon: React.ElementType; className: string; dotClass: string; glow: string }
> = {
  level1: {
    label: '一级预警',
    icon: AlertOctagon,
    className:
      'bg-danger-500/15 text-danger-300 border-danger-500/40',
    dotClass: 'bg-danger-500',
    glow: 'shadow-[0_0_12px_rgba(245,63,63,0.5)]',
  },
  level2: {
    label: '二级预警',
    icon: AlertTriangle,
    className:
      'bg-warning-500/15 text-warning-300 border-warning-500/40',
    dotClass: 'bg-warning-500',
    glow: 'shadow-[0_0_12px_rgba(255,125,0,0.5)]',
  },
  level3: {
    label: '三级预警',
    icon: AlertCircle,
    className:
      'bg-info-500/15 text-info-300 border-info-500/40',
    dotClass: 'bg-info-500',
    glow: 'shadow-[0_0_12px_rgba(20,201,201,0.5)]',
  },
};

export default function StatusBadge({
  status,
  size = 'md',
  showIcon = true,
  className,
}: StatusBadgeProps) {
  const isAlertLevel = status === 'level1' || status === 'level2' || status === 'level3';

  const config = isAlertLevel
    ? alertLevelConfig[status as AlertLevel]
    : taskStatusConfig[status as TaskStatus];

  const Icon = config.icon;

  const sizeClasses =
    size === 'sm'
      ? 'text-[11px] px-2 py-0.5 gap-1'
      : 'text-xs px-2.5 py-1 gap-1.5';

  const iconSize = size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5';

  const glowStyle = isAlertLevel ? (alertLevelConfig[status as AlertLevel].glow) : '';

  return (
    <span
      className={cn(
        'inline-flex items-center font-medium rounded-full border backdrop-blur-sm',
        sizeClasses,
        config.className,
        glowStyle,
        className
      )}
    >
      <span
        className={cn(
          'w-1.5 h-1.5 rounded-full shrink-0',
          config.dotClass,
          isAlertLevel && 'animate-pulse'
        )}
      />
      {showIcon && <Icon className={cn(iconSize, 'shrink-0')} />}
      <span className="whitespace-nowrap">{config.label}</span>
    </span>
  );
}

export { taskStatusConfig, alertLevelConfig };
