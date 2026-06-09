import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Play, Eye, Download, FileText, AlertTriangle,
  Clock, User, Settings, Activity, Cpu, Database, Layers,
  CheckCircle2, History, ChevronRight, ExternalLink, Zap
} from 'lucide-react';
import StatusBadge from '@/components/common/StatusBadge';
import { cn } from '@/lib/utils';
import api from '@/lib/api';
import type { SimulationTask, StatusRecord, AdjustmentLog, ApprovalRecord } from '@/lib/types';

const STATUS_FLOW = [
  { key: 'pending_verify', label: '待校验', icon: CheckCircle2 },
  { key: 'mesh_generating', label: '网格生成', icon: Layers },
  { key: 'initializing', label: '初始化', icon: Database },
  { key: 'stress_computing', label: '应力计算', icon: Cpu },
  { key: 'slip_evaluating', label: '滑动评估', icon: Activity },
  { key: 'completed', label: '模拟完成', icon: CheckCircle2 },
  { key: 'published', label: '已发布', icon: FileText },
];

type TabKey = 'info' | 'params' | 'monitor' | 'adjustments' | 'approvals';

export default function TaskDetailPage() {
  const { id = '' } = useParams();
  const nav = useNavigate();
  const [loading, setLoading] = useState(true);
  const [task, setTask] = useState<SimulationTask | null>(null);
  const [tab, setTab] = useState<TabKey>('info');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const resp = await api.get<SimulationTask>(`/tasks/${id}`);
        setTask((resp as any).data?.data ?? resp.data ?? resp);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  if (loading || !task) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="w-10 h-10 border-4 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" />
      </div>
    );
  }

  const currentIdx = STATUS_FLOW.findIndex((s) => s.key === task.status);
  const isInProgress = ['mesh_generating', 'initializing', 'stress_computing', 'slip_evaluating'].includes(task.status);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* 顶部操作栏 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => nav(-1)}
            className="p-2 rounded-lg bg-slate-800/60 hover:bg-slate-700/60 border border-slate-700 transition"
          >
            <ArrowLeft className="w-5 h-5 text-slate-300" />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-100">{task.name}</h1>
              <StatusBadge status={task.status} />
            </div>
            <div className="flex items-center gap-4 mt-1 text-sm text-slate-500">
              <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{task.createdAt}</span>
              <span className="flex items-center gap-1"><User className="w-3.5 h-3.5" />{task.creatorName}</span>
              <span className="flex items-center gap-1"><Layers className="w-3.5 h-3.5" />{task.faultName}</span>
              {task.alertCount > 0 && (
                <span className="flex items-center gap-1 text-warning-400">
                  <AlertTriangle className="w-3.5 h-3.5" />预警 {task.alertCount} 次
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {isInProgress && (
            <Link
              to={`/monitor/${task.id}`}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-primary-500 to-primary-600 text-white hover:shadow-glow-primary hover:-translate-y-0.5 transition-all"
            >
              <Zap className="w-4 h-4" /> 实时监控
            </Link>
          )}
          {(task.status === 'completed' || task.status === 'postdoc_approved' || task.status === 'professor_approved' || task.status === 'published') && (
            <Link
              to={`/report/${task.id}`}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800/60 border border-slate-700 text-slate-200 hover:bg-slate-700/60 hover:border-primary-500/50 transition-all"
            >
              <Eye className="w-4 h-4" /> 查看报告
            </Link>
          )}
          <button className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800/60 border border-slate-700 text-slate-200 hover:bg-slate-700/60 transition-all">
            <Download className="w-4 h-4" /> 导出数据
          </button>
        </div>
      </div>

      {/* 状态流转时间线 */}
      <div className="glow-card p-6 rounded-xl">
        <h2 className="text-sm font-semibold text-slate-300 mb-5 flex items-center gap-2">
          <History className="w-4 h-4 text-primary-400" /> 状态流转
        </h2>
        <div className="relative flex items-start justify-between px-2">
          {STATUS_FLOW.map((step, idx) => {
            const StepIcon = step.icon;
            const isDone = currentIdx > idx || task.status === 'published';
            const isCurrent = idx === currentIdx && task.status !== 'published';
            const isRollback = task.status === 'rollback';

            return (
              <div key={step.key} className="flex flex-col items-center relative z-10 flex-1">
                <div
                  className={cn(
                    'w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all duration-300',
                    isDone && 'bg-primary-500/20 border-primary-500 shadow-glow-primary',
                    isCurrent && 'bg-warning-500/20 border-warning-500 shadow-glow-warning animate-pulse-glow',
                    !isDone && !isCurrent && 'bg-slate-800 border-slate-700 text-slate-500',
                    isRollback && idx > currentIdx && 'bg-danger-500/10 border-danger-500/50 text-danger-400'
                  )}
                >
                  <StepIcon
                    className={cn(
                      'w-5 h-5',
                      isDone && 'text-primary-400',
                      isCurrent && 'text-warning-400',
                      !isDone && !isCurrent && 'text-slate-500'
                    )}
                  />
                </div>
                <span
                  className={cn(
                    'mt-2 text-xs font-medium whitespace-nowrap',
                    isDone && 'text-primary-400',
                    isCurrent && 'text-warning-400',
                    !isDone && !isCurrent && 'text-slate-500'
                  )}
                >
                  {step.label}
                </span>
                {idx < STATUS_FLOW.length - 1 && (
                  <div
                    className={cn(
                      'absolute top-6 h-0.5 -right-1/2 left-1/2 translate-x-8',
                      isDone ? 'bg-gradient-to-r from-primary-500 to-primary-500/80' : 'bg-slate-700'
                    )}
                  />
                )}
              </div>
            );
          })}
        </div>

        {isInProgress && (
          <div className="mt-6">
            <div className="flex items-center justify-between mb-2 text-sm">
              <span className="text-slate-400">当前阶段进度</span>
              <span className="font-mono text-primary-400 font-semibold">{task.progress}%</span>
            </div>
            <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary-500 via-info-500 to-primary-500 transition-all duration-500 relative"
                style={{ width: `${task.progress}%` }}
              >
                <div className="absolute inset-0 bg-white/20 animate-pulse" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Tab 切换 */}
      <div className="flex gap-1 p-1 bg-slate-800/50 rounded-lg border border-slate-700/50 w-fit">
        {[
          { key: 'info', label: '基本信息', icon: FileText },
          { key: 'params', label: '参数配置', icon: Settings },
          { key: 'monitor', label: '监控预览', icon: Activity },
          { key: 'adjustments', label: `调整日志 (${task.adjustmentLogs.length})`, icon: History },
          { key: 'approvals', label: '审批记录', icon: CheckCircle2 },
        ].map((t) => {
          const Icon = t.icon;
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key as TabKey)}
              className={cn(
                'inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all',
                active
                  ? 'bg-primary-500/20 text-primary-400 shadow-inner'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
              )}
            >
              <Icon className="w-4 h-4" />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Tab 内容 */}
      <div className="animate-fade-in">
        {tab === 'info' && (
          <div className="grid grid-cols-3 gap-6">
            <div className="glow-card rounded-xl p-6 col-span-2">
              <h3 className="font-semibold text-slate-200 mb-4">任务信息</h3>
              <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                <InfoRow label="任务ID" value={task.id} mono />
                <InfoRow label="任务名称" value={task.name} />
                <InfoRow label="关联断层" value={task.faultName} />
                <InfoRow label="创建人" value={task.creatorName} />
                <InfoRow label="创建时间" value={task.createdAt} />
                <InfoRow label="更新时间" value={task.updatedAt} />
                <InfoRow label="几何文件" value={task.geometryFile?.name || '未上传'} />
                <InfoRow label="文件大小" value={task.geometryFile ? formatSize(task.geometryFile.size) : '-'} />
                {task.meshInfo && (
                  <>
                    <InfoRow label="网格节点数" value={task.meshInfo.nodeCount.toLocaleString()} />
                    <InfoRow label="网格单元数" value={task.meshInfo.elementCount.toLocaleString()} />
                    <InfoRow label="网格质量分" value={`${task.meshInfo.qualityScore} / 100`} highlight />
                    <InfoRow label="最小单元角" value={`${task.meshInfo.minAngle}°`} />
                  </>
                )}
              </div>
            </div>
            <div className="space-y-6">
              <div className="glow-card rounded-xl p-6">
                <h3 className="font-semibold text-slate-200 mb-4 flex items-center gap-2">
                  <History className="w-4 h-4 text-info-400" /> 状态历史
                </h3>
                <div className="space-y-4 max-h-[360px] overflow-y-auto pr-2 scrollbar-thin">
                  {task.statusHistory.map((s, i) => (
                    <StatusStep key={i} record={s} last={i === task.statusHistory.length - 1} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {tab === 'params' && (
          <div className="grid grid-cols-2 gap-6">
            <ParamCard
              title="应力边界条件"
              icon={Settings}
              accent="info"
              params={[
                { label: '北向应力', value: task.boundaryConditions.northStress, unit: 'MPa' },
                { label: '东向应力', value: task.boundaryConditions.eastStress, unit: 'MPa' },
                { label: '垂向应力', value: task.boundaryConditions.verticalStress, unit: 'MPa' },
                { label: '孔隙压力', value: task.boundaryConditions.porePressure, unit: 'MPa' },
                { label: '环境温度', value: task.boundaryConditions.temperature, unit: '°C' },
              ]}
            />
            <ParamCard
              title="岩石力学参数"
              icon={Layers}
              accent="primary"
              params={[
                { label: '杨氏模量', value: task.rockParams.youngModulus, unit: 'GPa' },
                { label: '泊松比', value: task.rockParams.poissonRatio },
                { label: '内聚力', value: task.rockParams.cohesion, unit: 'MPa' },
                { label: '摩擦系数', value: task.rockParams.frictionCoefficient, highlight: true },
                { label: '剪胀角', value: task.rockParams.dilationAngle, unit: '°' },
                { label: '抗拉强度', value: task.rockParams.tensileStrength, unit: 'MPa' },
              ]}
            />
          </div>
        )}

        {tab === 'monitor' && (
          <div className="glow-card rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-200 flex items-center gap-2">
                <Activity className="w-4 h-4 text-success-400" /> 最新监控数据点
              </h3>
              {isInProgress && (
                <Link
                  to={`/monitor/${task.id}`}
                  className="text-sm text-primary-400 hover:text-primary-300 flex items-center gap-1"
                >
                  进入实时监控 <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              )}
            </div>
            <div className="grid grid-cols-4 gap-4">
              <MetricCard label="最大剪应力" value={127.4} unit="MPa" threshold={150} color="warning" />
              <MetricCard label="库仑应力变化" value={+2.37} unit="MPa" threshold={5} color="info" signed />
              <MetricCard label="滑动速率" value={3.8} unit="mm/yr" threshold={10} color="success" />
              <MetricCard label="摩擦强度" value={142.0} unit="MPa" color="slate" />
            </div>
          </div>
        )}

        {tab === 'adjustments' && (
          <div className="glow-card rounded-xl p-6">
            <h3 className="font-semibold text-slate-200 mb-4">参数调整记录</h3>
            {task.adjustmentLogs.length === 0 ? (
              <div className="text-center py-16 text-slate-500">
                <History className="w-12 h-12 mx-auto mb-3 opacity-30" />
                暂无参数调整记录
              </div>
            ) : (
              <div className="space-y-4">
                {task.adjustmentLogs.map((log) => (
                  <AdjustmentCard key={log.id} log={log} />
                ))}
              </div>
            )}
          </div>
        )}

        {tab === 'approvals' && (
          <div className="glow-card rounded-xl p-6">
            <h3 className="font-semibold text-slate-200 mb-4">审批流程记录</h3>
            <div className="space-y-6">
              <ApprovalStage
                index={1}
                title="博士后 · 数值稳定性验证"
                role="postdoc"
                status={
                  task.status === 'completed' ? 'pending'
                  : ['postdoc_approved', 'professor_approved', 'published'].includes(task.status) ? 'approved'
                  : 'waiting'
                }
                approver="李博（博士后）"
                time="2026-06-09 15:42:31"
                comment="迭代收敛良好，残差范数低于阈值1e-6，质量守恒误差<0.5%。数值方案稳定可靠。"
                metrics={[
                  { label: '收敛率', score: 96 },
                  { label: '残差范数', score: 94 },
                  { label: '质量守恒', score: 98 },
                  { label: '能量守恒', score: 92 },
                ]}
              />
              <ApprovalStage
                index={2}
                title="教授 · 物理合理性确认"
                role="professor"
                status={
                  task.status === 'postdoc_approved' ? 'pending'
                  : ['professor_approved', 'published'].includes(task.status) ? 'approved'
                  : 'waiting'
                }
                approver={task.status === 'professor_approved' || task.status === 'published' ? '王教授' : undefined}
                time={task.status === 'professor_approved' || task.status === 'published' ? '2026-06-09 17:08:15' : undefined}
                comment={task.status === 'professor_approved' || task.status === 'published'
                  ? '应力分布符合区域构造背景，滑动方向与断层走向一致，最大滑动量在合理范围。'
                  : undefined}
              />
              <ApprovalStage
                index={3}
                title="推送至地震危险性评估组"
                role="system"
                status={task.status === 'published' ? 'approved' : 'waiting'}
                time={task.status === 'published' ? '2026-06-09 17:08:20' : undefined}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function InfoRow({ label, value, mono, highlight }: { label: string; value: string; mono?: boolean; highlight?: boolean }) {
  return (
    <div className="border-b border-slate-700/50 pb-3">
      <div className="text-xs text-slate-500 mb-1">{label}</div>
      <div
        className={cn(
          'text-sm text-slate-200',
          mono && 'font-mono',
          highlight && 'text-primary-400 font-semibold'
        )}
      >
        {value}
      </div>
    </div>
  );
}

function StatusStep({ record, last }: { record: StatusRecord; last: boolean }) {
  return (
    <div className="flex gap-3 relative">
      {!last && <div className="absolute left-[11px] top-6 bottom-0 w-px bg-slate-700" />}
      <div
        className={cn(
          'w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center border-2',
          last
            ? 'bg-primary-500/20 border-primary-500 shadow-glow-primary'
            : 'bg-slate-800 border-slate-600'
        )}
      >
        <ChevronRight className={cn('w-3 h-3', last && 'text-primary-400')} />
      </div>
      <div className="flex-1 min-w-0 pb-1">
        <div className="flex items-center gap-2">
          <StatusBadge status={record.status as any} size="sm" />
          <span className="text-xs text-slate-500 font-mono">{record.timestamp}</span>
        </div>
        {record.operator && (
          <div className="text-xs text-slate-500 mt-1">操作人：{record.operator}</div>
        )}
        {record.remark && (
          <div className="text-xs text-slate-400 mt-1 bg-slate-800/60 rounded px-2 py-1">
            {record.remark}
          </div>
        )}
      </div>
    </div>
  );
}

function ParamCard({
  title, icon: Icon, accent, params,
}: {
  title: string;
  icon: any;
  accent: 'primary' | 'info';
  params: { label: string; value: number; unit?: string; highlight?: boolean }[];
}) {
  const colorMap = {
    primary: 'from-primary-500/20 border-primary-500/30 text-primary-400',
    info: 'from-info-500/20 border-info-500/30 text-info-400',
  };
  return (
    <div className="glow-card rounded-xl p-6">
      <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border bg-gradient-to-r ${colorMap[accent]} mb-5`}>
        <Icon className="w-4 h-4" />
        <span className="font-semibold">{title}</span>
      </div>
      <div className="space-y-3">
        {params.map((p) => (
          <div key={p.label} className="flex items-center justify-between py-2 border-b border-slate-700/50 last:border-0">
            <span className="text-sm text-slate-400">{p.label}</span>
            <span className={cn(
              'font-mono text-sm',
              p.highlight ? 'text-warning-400 font-semibold' : 'text-slate-200'
            )}>
              {p.value.toLocaleString()} {p.unit && <span className="text-slate-500 ml-1">{p.unit}</span>}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function MetricCard({
  label, value, unit, threshold, color, signed,
}: {
  label: string; value: number; unit: string; threshold?: number; color: string; signed?: boolean;
}) {
  const ratio = threshold ? Math.min(100, (Math.abs(value) / threshold) * 100) : 60;
  const colorMap: Record<string, string> = {
    warning: 'text-warning-400 from-warning-500/30',
    info: 'text-info-400 from-info-500/30',
    success: 'text-success-400 from-success-500/30',
    slate: 'text-slate-300 from-slate-500/30',
  };
  return (
    <div className="bg-slate-800/40 border border-slate-700/50 rounded-lg p-4 hover:border-slate-600 transition">
      <div className="text-xs text-slate-500 mb-2">{label}</div>
      <div className="flex items-baseline gap-1">
        <span className={`text-2xl font-bold font-mono ${colorMap[color].split(' ')[0]}`}>
          {signed && value > 0 ? '+' : ''}{value.toFixed(1)}
        </span>
        <span className="text-xs text-slate-500">{unit}</span>
      </div>
      {threshold && (
        <div className="mt-3 h-1 bg-slate-700 rounded-full overflow-hidden">
          <div
            className={`h-full bg-gradient-to-r ${colorMap[color].split(' ').slice(1).join(' ')}`}
            style={{ width: `${ratio}%` }}
          />
        </div>
      )}
    </div>
  );
}

function AdjustmentCard({ log }: { log: AdjustmentLog }) {
  const entries = Object.entries(log.paramChanges);
  return (
    <div className="border border-warning-500/30 bg-warning-500/5 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-warning-500/20 text-warning-400 flex items-center justify-center">
            <Settings className="w-3.5 h-3.5" />
          </div>
          <div>
            <div className="text-sm font-medium text-slate-200">参数调整 #{log.id.slice(-5)}</div>
            <div className="text-xs text-slate-500">{log.timestamp} · 操作人：{log.operator}</div>
          </div>
        </div>
        {log.alertId && (
          <span className="text-xs px-2 py-1 rounded bg-danger-500/10 text-danger-400 border border-danger-500/30">
            关联预警 #{log.alertId.slice(-5)}
          </span>
        )}
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-3">
        {entries.map(([k, v]) => (
          <div key={k} className="bg-slate-800/60 rounded px-3 py-2 text-xs">
            <span className="text-slate-500">{camelToLabel(k)}:</span>
            <span className="text-warning-400 font-mono ml-1.5">→ {(v as any).toFixed?.(3) ?? v}</span>
          </div>
        ))}
      </div>
      <div className="text-xs text-slate-400 bg-slate-800/40 rounded px-3 py-2">
        💡 {log.reason}
      </div>
    </div>
  );
}

function ApprovalStage({
  index, title, role, status, approver, time, comment, metrics,
}: {
  index: number;
  title: string;
  role: 'postdoc' | 'professor' | 'system';
  status: 'waiting' | 'pending' | 'approved';
  approver?: string;
  time?: string;
  comment?: string;
  metrics?: { label: string; score: number }[];
}) {
  return (
    <div className="relative pl-10 pb-8 last:pb-0">
      {status !== 'approved' && role !== 'system' && (
        <div className="absolute left-[15px] top-14 bottom-0 w-px border-l-2 border-dashed border-slate-700" />
      )}
      <div className="absolute left-0 top-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 bg-slate-900 z-10"
        style={{
          borderColor: status === 'approved' ? '#00B42A' : status === 'pending' ? '#FF7D00' : '#334155',
          color: status === 'approved' ? '#00B42A' : status === 'pending' ? '#FF7D00' : '#64748b',
        }}
      >
        {status === 'approved' ? <CheckCircle2 className="w-5 h-5" /> : index}
      </div>
      <div
        className={cn(
          'rounded-lg border p-5',
          status === 'approved' && 'border-success-500/30 bg-success-500/5',
          status === 'pending' && 'border-warning-500/40 bg-warning-500/5 shadow-glow-warning',
          status === 'waiting' && 'border-slate-700/50 bg-slate-800/30 opacity-70'
        )}
      >
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-semibold text-slate-200">{title}</h4>
          <span className={cn(
            'text-xs px-2.5 py-1 rounded-full font-medium',
            status === 'approved' && 'bg-success-500/20 text-success-400 border border-success-500/30',
            status === 'pending' && 'bg-warning-500/20 text-warning-400 border border-warning-500/30 animate-pulse',
            status === 'waiting' && 'bg-slate-700/50 text-slate-500'
          )}>
            {status === 'approved' ? '已通过' : status === 'pending' ? '待处理' : '等待中'}
          </span>
        </div>
        {metrics && (
          <div className="grid grid-cols-4 gap-3 mb-3">
            {metrics.map((m) => (
              <div key={m.label} className="bg-slate-900/40 rounded p-2.5 text-center">
                <div className="text-lg font-bold font-mono text-primary-400">{m.score}</div>
                <div className="text-[10px] text-slate-500 mt-0.5">{m.label}</div>
              </div>
            ))}
          </div>
        )}
        {approver && (
          <div className="text-sm text-slate-400 mb-1">👤 审批人：<span className="text-slate-200">{approver}</span></div>
        )}
        {time && (
          <div className="text-xs text-slate-500 font-mono mb-2">⏱ {time}</div>
        )}
        {comment && (
          <div className="text-sm text-slate-300 bg-slate-900/40 rounded p-3 border-l-2 border-primary-500/60">
            📝 {comment}
          </div>
        )}
      </div>
    </div>
  );
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

function camelToLabel(s: string) {
  return s.replace(/([A-Z])/g, ' $1').replace(/^./, (c) => c.toUpperCase());
}
