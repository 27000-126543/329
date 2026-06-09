import { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  ChevronRight,
  Bell,
  Shield,
  User,
  LogOut,
  Settings,
  ChevronDown,
  Home,
  HardHat,
  GraduationCap,
  Crown,
  BarChart3,
  ShieldCheck,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore, roleNames } from '@/store/useAuthStore';
import type { Role } from '../../../shared/types';

const roleIcons: Record<Role, React.ElementType> = {
  geologist: HardHat,
  postdoc: GraduationCap,
  professor: Shield,
  chief: Crown,
  assessor: BarChart3,
  admin: ShieldCheck,
};

const roleColors: Record<Role, string> = {
  geologist: 'text-emerald-400',
  postdoc: 'text-blue-400',
  professor: 'text-violet-400',
  chief: 'text-amber-400',
  assessor: 'text-cyan-400',
  admin: 'text-rose-400',
};

const alertCounts = {
  level1: 3,
  level2: 8,
  level3: 15,
};

const alertTotal = alertCounts.level1 + alertCounts.level2 + alertCounts.level3;

export default function Topbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, updateRole, clearUser } = useAuthStore();
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showAlertPanel, setShowAlertPanel] = useState(false);
  const roleMenuRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const alertPanelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (roleMenuRef.current && !roleMenuRef.current.contains(e.target as Node)) {
        setShowRoleMenu(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
      if (alertPanelRef.current && !alertPanelRef.current.contains(e.target as Node)) {
        setShowAlertPanel(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const breadcrumbItems = getBreadcrumbs(location.pathname);

  function handleLogout() {
    clearUser();
    navigate('/login');
  }

  function handleRoleSwitch(role: Role) {
    updateRole(role);
    setShowRoleMenu(false);
  }

  return (
    <header className="h-16 bg-slate-900/90 backdrop-blur-xl border-b border-slate-800 flex items-center justify-between px-6 shrink-0 sticky top-0 z-40">
      <div className="flex items-center gap-2 text-sm">
        <Link to="/dashboard" className="text-slate-500 hover:text-slate-300 transition-colors">
          <Home className="w-4 h-4" />
        </Link>
        {breadcrumbItems.map((item, idx) => {
          const isLast = idx === breadcrumbItems.length - 1;
          return (
            <div key={idx} className="flex items-center gap-2">
              <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
              {isLast ? (
                <span className="text-slate-200 font-medium">{item.label}</span>
              ) : item.to ? (
                <Link to={item.to} className="text-slate-500 hover:text-slate-300 transition-colors">
                  {item.label}
                </Link>
              ) : (
                <span className="text-slate-500">{item.label}</span>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex items-center gap-3">
        <div className="relative" ref={alertPanelRef}>
          <button
            onClick={() => setShowAlertPanel(!showAlertPanel)}
            className="relative w-10 h-10 rounded-lg bg-slate-800/60 hover:bg-slate-700/60 border border-slate-700 flex items-center justify-center text-slate-400 hover:text-slate-200 transition-all"
          >
            <Bell className="w-5 h-5" />
            {alertTotal > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full bg-danger-500 text-white text-[10px] font-bold flex items-center justify-center px-1 shadow-glow-danger">
                {alertTotal > 99 ? '99+' : alertTotal}
              </span>
            )}
          </button>

          {showAlertPanel && (
            <div className="absolute right-0 top-12 w-80 rounded-xl bg-slate-900 border border-slate-700 shadow-2xl overflow-hidden animate-fade-in">
              <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between">
                <span className="font-semibold text-slate-200">预警通知</span>
                <Link to="/alerts" className="text-xs text-primary-400 hover:text-primary-300">
                  查看全部
                </Link>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {[
                  { level: 'level1', text: '龙门山南段剪切应力超限', time: '2分钟前', color: 'bg-danger-500' },
                  { level: 'level1', text: '鲜水河断裂滑动速率异常', time: '15分钟前', color: 'bg-danger-500' },
                  { level: 'level2', text: '安宁河断层收敛警告', time: '1小时前', color: 'bg-warning-500' },
                  { level: 'level2', text: '小江断裂库仑应力升高', time: '2小时前', color: 'bg-warning-500' },
                  { level: 'level3', text: '红河断裂温度波动', time: '4小时前', color: 'bg-info-500' },
                ].map((alert, idx) => (
                  <div
                    key={idx}
                    className="px-4 py-3 border-b border-slate-800/60 hover:bg-slate-800/40 transition-colors cursor-pointer"
                  >
                    <div className="flex items-start gap-3">
                      <span className={cn('w-2 h-2 rounded-full mt-2 shrink-0 shadow-glow', alert.color)} />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm text-slate-200">{alert.text}</div>
                        <div className="text-xs text-slate-500 mt-1">{alert.time}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="relative" ref={roleMenuRef}>
          <button
            onClick={() => setShowRoleMenu(!showRoleMenu)}
            className="flex items-center gap-2 h-10 px-3 rounded-lg bg-slate-800/60 hover:bg-slate-700/60 border border-slate-700 transition-all"
          >
            {user && (
              <>
                {(() => {
                  const Icon = roleIcons[user.role];
                  return <Icon className={cn('w-4 h-4', roleColors[user.role])} />;
                })()}
                <span className="text-sm text-slate-300 font-medium">{roleNames[user.role]}</span>
                <ChevronDown className={cn('w-4 h-4 text-slate-500 transition-transform', showRoleMenu && 'rotate-180')} />
              </>
            )}
          </button>

          {showRoleMenu && (
            <div className="absolute right-0 top-11 w-56 rounded-xl bg-slate-900 border border-slate-700 shadow-2xl overflow-hidden animate-fade-in p-1.5">
              {(Object.keys(roleNames) as Role[]).map((role) => {
                const Icon = roleIcons[role];
                const isActive = user?.role === role;
                return (
                  <button
                    key={role}
                    onClick={() => handleRoleSwitch(role)}
                    className={cn(
                      'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all',
                      isActive
                        ? 'bg-primary-500/15 text-primary-300 border border-primary-500/30'
                        : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200 border border-transparent'
                    )}
                  >
                    <Icon className={cn('w-4 h-4', isActive ? 'text-primary-400' : roleColors[role])} />
                    <span className="font-medium">{roleNames[role]}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="relative" ref={userMenuRef}>
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-3 h-10 pl-1.5 pr-3 rounded-lg bg-slate-800/60 hover:bg-slate-700/60 border border-slate-700 transition-all"
          >
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary-500 to-violet-600 flex items-center justify-center text-white text-xs font-bold">
              {user?.name.charAt(0) || 'U'}
            </div>
            <ChevronDown className={cn('w-4 h-4 text-slate-500 transition-transform', showUserMenu && 'rotate-180')} />
          </button>

          {showUserMenu && user && (
            <div className="absolute right-0 top-11 w-64 rounded-xl bg-slate-900 border border-slate-700 shadow-2xl overflow-hidden animate-fade-in">
              <div className="px-4 py-4 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full bg-gradient-to-br from-primary-500 to-violet-600 flex items-center justify-center text-white font-bold">
                    {user.name.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <div className="font-semibold text-slate-200 truncate">{user.name}</div>
                    <div className="text-xs text-slate-500 truncate">{user.email}</div>
                  </div>
                </div>
              </div>
              <div className="p-1.5">
                <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-400 hover:bg-slate-800/60 hover:text-slate-200 transition-all">
                  <User className="w-4 h-4" />
                  <span>个人资料</span>
                </button>
                <Link
                  to="/settings"
                  onClick={() => setShowUserMenu(false)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-400 hover:bg-slate-800/60 hover:text-slate-200 transition-all"
                >
                  <Settings className="w-4 h-4" />
                  <span>系统设置</span>
                </Link>
              </div>
              <div className="p-1.5 border-t border-slate-800">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-danger-400 hover:bg-danger-500/10 transition-all"
                >
                  <LogOut className="w-4 h-4" />
                  <span>退出登录</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

function getBreadcrumbs(pathname: string): { label: string; to?: string }[] {
  const pathMap: Record<string, { label: string; to?: string }[]> = {
    '/dashboard': [{ label: '综合看板' }],
    '/tasks': [{ label: '任务中心' }],
    '/tasks/new': [{ label: '任务中心', to: '/tasks' }, { label: '新建任务' }],
    '/monitor': [{ label: '模拟监控' }],
    '/alerts': [{ label: '预警中心' }],
    '/approvals': [{ label: '审批中心' }],
    '/report': [{ label: '结果报告' }],
    '/recommendation': [{ label: '智能推荐' }],
    '/faults': [{ label: '断层管理' }],
    '/settings': [{ label: '系统设置' }],
  };

  for (const prefix of Object.keys(pathMap)) {
    if (pathname === prefix || pathname.startsWith(prefix + '/')) {
      const items = [...pathMap[prefix]];
      if (pathname !== prefix) {
        const id = pathname.split('/').pop();
        if (id) items.push({ label: `详情 ${id}` });
      }
      return items;
    }
  }
  return [{ label: '首页' }];
}
