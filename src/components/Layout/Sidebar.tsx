import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  ListTodo,
  Activity,
  AlertTriangle,
  FileCheck,
  FileBarChart,
  Sparkles,
  Network,
  Settings,
  ChevronLeft,
  ChevronRight,
  Mountain,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore, roleNames } from '@/store/useAuthStore';

interface NavItem {
  to: string;
  label: string;
  icon: React.ElementType;
}

const navItems: NavItem[] = [
  { to: '/dashboard', label: '综合看板', icon: LayoutDashboard },
  { to: '/tasks', label: '任务中心', icon: ListTodo },
  { to: '/monitor', label: '模拟监控', icon: Activity },
  { to: '/alerts', label: '预警中心', icon: AlertTriangle },
  { to: '/approvals', label: '审批中心', icon: FileCheck },
  { to: '/report', label: '结果报告', icon: FileBarChart },
  { to: '/recommendation', label: '智能推荐', icon: Sparkles },
  { to: '/faults', label: '断层管理', icon: Network },
  { to: '/settings', label: '系统设置', icon: Settings },
];

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const { user } = useAuthStore();
  const location = useLocation();

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 h-screen bg-slate-950 border-r border-slate-800 flex flex-col z-50 transition-all duration-300 ease-in-out',
        collapsed ? 'w-16' : 'w-[260px]'
      )}
    >
      <div
        className={cn(
          'flex items-center border-b border-slate-800 h-16 shrink-0',
          collapsed ? 'justify-center px-2' : 'px-5'
        )}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-glow-primary shrink-0">
            <Mountain className="w-6 h-6 text-white" />
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="text-white font-bold text-base leading-tight">QuakeSim</span>
              <span className="text-slate-500 text-[11px] leading-tight mt-0.5">断层应力模拟平台</span>
            </div>
          )}
        </div>
      </div>

      <nav className="flex-1 py-4 px-3 overflow-y-auto">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname.startsWith(item.to);
            return (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all duration-200 group',
                    collapsed ? 'justify-center' : '',
                    isActive
                      ? 'bg-primary-500/15 text-primary-400 shadow-glow-primary border border-primary-500/30'
                      : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200 border border-transparent'
                  )}
                  title={collapsed ? item.label : undefined}
                >
                  <Icon
                    className={cn(
                      'w-5 h-5 shrink-0 transition-colors',
                      isActive ? 'text-primary-400' : 'text-slate-500 group-hover:text-slate-300'
                    )}
                  />
                  {!collapsed && (
                    <span className={cn('font-medium truncate', isActive ? 'text-primary-300' : '')}>
                      {item.label}
                    </span>
                  )}
                  {!collapsed && isActive && (
                    <span className="ml-auto w-1.5 h-1.5 rounded-full bg-primary-400 shadow-[0_0_8px_rgba(22,93,255,0.8)]" />
                  )}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="border-t border-slate-800 p-3 shrink-0">
        <div
          className={cn(
            'flex items-center rounded-lg bg-slate-900/80 border border-slate-800',
            collapsed ? 'justify-center p-2' : 'p-2.5 gap-3'
          )}
        >
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-500 to-violet-600 flex items-center justify-center text-white text-sm font-bold shrink-0">
            {user?.name.charAt(0) || 'U'}
          </div>
          {!collapsed && user && (
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-slate-200 truncate">{user.name}</div>
              <div className="text-xs text-slate-500 truncate">{roleNames[user.role]}</div>
            </div>
          )}
        </div>

        <button
          onClick={() => setCollapsed(!collapsed)}
          className={cn(
            'mt-3 w-full flex items-center justify-center gap-2 rounded-lg py-2 text-xs text-slate-500 hover:text-slate-300 hover:bg-slate-800/50 transition-all border border-transparent hover:border-slate-700',
            collapsed ? 'px-0' : 'px-3'
          )}
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <>
              <ChevronLeft className="w-4 h-4" />
              <span>收起侧边栏</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}

export { navItems };
