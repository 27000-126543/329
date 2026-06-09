import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Mountain,
  HardHat,
  GraduationCap,
  Shield,
  Crown,
  BarChart3,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  Network,
  Activity,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/useAuthStore';
import type { Role, User } from '../../shared/types';

const roleCards: {
  role: Role;
  name: string;
  icon: React.ElementType;
  description: string;
  gradient: string;
  borderGlow: string;
  accent: string;
}[] = [
  {
    role: 'geologist',
    name: '地质工程师',
    icon: HardHat,
    description: '断层几何建模、参数配置、任务提交',
    gradient: 'from-emerald-500/20 via-emerald-500/5 to-transparent',
    borderGlow: 'group-hover:border-emerald-500/60 group-hover:shadow-[0_0_40px_-10px_rgba(16,185,129,0.5)]',
    accent: 'text-emerald-400',
  },
  {
    role: 'postdoc',
    name: '博士后研究员',
    icon: GraduationCap,
    description: '数值稳定性审核、参数合理性检查',
    gradient: 'from-blue-500/20 via-blue-500/5 to-transparent',
    borderGlow: 'group-hover:border-blue-500/60 group-hover:shadow-[0_0_40px_-10px_rgba(59,130,246,0.5)]',
    accent: 'text-blue-400',
  },
  {
    role: 'professor',
    name: '教授',
    icon: Shield,
    description: '物理机理终审、学术严谨性把关',
    gradient: 'from-violet-500/20 via-violet-500/5 to-transparent',
    borderGlow: 'group-hover:border-violet-500/60 group-hover:shadow-[0_0_40px_-10px_rgba(139,92,246,0.5)]',
    accent: 'text-violet-400',
  },
  {
    role: 'chief',
    name: '首席地震学家',
    icon: Crown,
    description: '全局决策、结果发布、权限管理',
    gradient: 'from-amber-500/20 via-amber-500/5 to-transparent',
    borderGlow: 'group-hover:border-amber-500/60 group-hover:shadow-[0_0_40px_-10px_rgba(245,158,11,0.5)]',
    accent: 'text-amber-400',
  },
  {
    role: 'assessor',
    name: '评估分析师',
    icon: BarChart3,
    description: '风险评估、报告输出、趋势分析',
    gradient: 'from-cyan-500/20 via-cyan-500/5 to-transparent',
    borderGlow: 'group-hover:border-cyan-500/60 group-hover:shadow-[0_0_40px_-10px_rgba(6,182,212,0.5)]',
    accent: 'text-cyan-400',
  },
  {
    role: 'admin',
    name: '系统管理员',
    icon: ShieldCheck,
    description: '系统监控、用户管理、配置维护',
    gradient: 'from-rose-500/20 via-rose-500/5 to-transparent',
    borderGlow: 'group-hover:border-rose-500/60 group-hover:shadow-[0_0_40px_-10px_rgba(244,63,94,0.5)]',
    accent: 'text-rose-400',
  },
];

const userNames: Record<Role, string> = {
  geologist: '李明工',
  postdoc: '王研究',
  professor: '赵教授',
  chief: '张首席',
  assessor: '陈评估',
  admin: '刘管理',
};

export default function LoginPage() {
  const navigate = useNavigate();
  const { setUser } = useAuthStore();
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [isLogging, setIsLogging] = useState(false);

  function handleLogin(role: Role) {
    if (isLogging) return;
    setIsLogging(true);
    setSelectedRole(role);

    setTimeout(() => {
      const user: User = {
        id: `user-${role}-001`,
        name: userNames[role],
        role,
        email: `${role}@quake-sim.edu.cn`,
      };
      setUser(user);
      navigate('/dashboard', { replace: true });
    }, 700);
  }

  return (
    <div className="min-h-screen bg-slate-950 dark flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-[500px] h-[500px] bg-primary-600/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-[600px] h-[600px] bg-violet-600/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-emerald-500/5 rounded-full blur-3xl" />
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />
      </div>

      <div className="relative z-10 w-full max-w-6xl mx-auto flex flex-col items-center">
        <div className="text-center mb-12 animate-fade-in">
          <div className="inline-flex items-center justify-center mb-5">
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 via-primary-600 to-violet-600 flex items-center justify-center shadow-glow-primary animate-pulse-glow">
                <Mountain className="w-9 h-9 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-amber-500 border-2 border-slate-950 flex items-center justify-center">
                <Sparkles className="w-3.5 h-3.5 text-white" />
              </div>
            </div>
          </div>
          <h1 className="text-4xl font-bold text-white tracking-tight">
            QuakeSim <span className="text-primary-400">断层应力模拟平台</span>
          </h1>
          <p className="text-slate-400 mt-3 max-w-xl mx-auto text-base">
            高保真三维断层应力演化数值模拟 · 多物理场耦合计算 · AI驱动风险预警
          </p>
          <div className="mt-6 flex items-center justify-center gap-6 text-xs text-slate-500">
            <span className="inline-flex items-center gap-1.5">
              <Network className="w-3.5 h-3.5 text-primary-400" />
              12条活动断层
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-emerald-400" />
              实时模拟监控
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-violet-400" />
              AI智能推荐
            </span>
          </div>
        </div>

        <div className="mb-6 text-center animate-fade-in" style={{ animationDelay: '0.1s' }}>
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-900/80 border border-slate-800">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-sm text-slate-400">请选择您的角色身份进入系统</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 w-full animate-fade-in" style={{ animationDelay: '0.2s' }}>
          {roleCards.map((card, idx) => {
            const Icon = card.icon;
            const isSelected = selectedRole === card.role;
            return (
              <button
                key={card.role}
                onClick={() => handleLogin(card.role)}
                disabled={isLogging}
                className={cn(
                  'group relative text-left rounded-2xl p-5 bg-slate-900/70 backdrop-blur-sm border border-slate-800 transition-all duration-300',
                  'hover:-translate-y-1 hover:bg-slate-900',
                  card.borderGlow,
                  isSelected && 'scale-[0.98] opacity-80',
                  isLogging && !isSelected && 'opacity-50 pointer-events-none'
                )}
                style={{ animationDelay: `${0.05 * idx}s` }}
              >
                <div
                  className={cn(
                    'absolute inset-0 rounded-2xl opacity-60 bg-gradient-to-br pointer-events-none',
                    card.gradient
                  )}
                />

                <div className="relative flex items-start justify-between mb-4">
                  <div
                    className={cn(
                      'w-12 h-12 rounded-xl bg-slate-800/80 border border-slate-700 flex items-center justify-center transition-all',
                      `group-hover:bg-gradient-to-br ${card.gradient} group-hover:border-transparent`
                    )}
                  >
                    <Icon className={cn('w-6 h-6 transition-colors', card.accent)} />
                  </div>
                  <div
                    className={cn(
                      'w-9 h-9 rounded-full flex items-center justify-center transition-all opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0',
                      `bg-gradient-to-r ${card.gradient.replace('/20', '/30').replace('/5', '/15')}`
                    )}
                  >
                    {isLogging && isSelected ? (
                      <div
                        className={cn(
                          'w-4 h-4 rounded-full border-2 border-t-transparent animate-spin',
                          `border-${card.accent.split('-')[1]}-400`
                        )}
                      />
                    ) : (
                      <ArrowRight className={cn('w-4 h-4', card.accent)} />
                    )}
                  </div>
                </div>

                <div className="relative">
                  <h3 className={cn('text-lg font-bold transition-colors', 'text-slate-100 group-hover:', card.accent)}>
                    {card.name}
                  </h3>
                  <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                    {card.description}
                  </p>
                  <div className="mt-4 flex items-center gap-2 text-xs text-slate-600">
                    <span className="px-2 py-0.5 rounded-md bg-slate-800/80 border border-slate-700/60 font-mono">
                      {card.role}
                    </span>
                    <span>·</span>
                    <span>默认账号 {userNames[card.role]}</span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        <div className="mt-10 text-center text-xs text-slate-600 animate-fade-in" style={{ animationDelay: '0.4s' }}>
          <p>© 2026 QuakeSim Platform · 断层应力与地震风险数值模拟系统 · v2.4.1</p>
          <p className="mt-1.5">本系统仅限授权科研人员使用，所有操作均已记录</p>
        </div>
      </div>
    </div>
  );
}
