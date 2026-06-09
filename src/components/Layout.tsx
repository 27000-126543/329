import { useState } from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  ListTodo,
  Activity,
  AlertTriangle,
  ClipboardCheck,
  FileBarChart,
  Sparkles,
  Mountain,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronRight,
  Bell,
  Search,
} from "lucide-react";
import { cn } from "@/lib/utils";
import useStore from "@/store";

interface NavItem {
  path: string;
  label: string;
  icon: typeof LayoutDashboard;
  badge?: string;
  badgeClass?: string;
}

const navItems: NavItem[] = [
  { path: "/dashboard", label: "控制台", icon: LayoutDashboard },
  { path: "/tasks", label: "任务管理", icon: ListTodo },
  {
    path: "/alerts",
    label: "预警中心",
    icon: AlertTriangle,
    badge: "5",
    badgeClass: "bg-rose-500 text-white",
  },
  {
    path: "/approvals",
    label: "审批中心",
    icon: ClipboardCheck,
    badge: "4",
    badgeClass: "bg-violet-500 text-white",
  },
  { path: "/recommendations", label: "智能推荐", icon: Sparkles },
  { path: "/faults", label: "断层管理", icon: Mountain },
  { path: "/settings", label: "系统设置", icon: Settings },
];

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const currentUser = useStore((s) => s.currentUser);
  const logout = useStore((s) => s.logout);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const user = currentUser ? { ...currentUser, displayRole: displayRole(currentUser.role) } : null;

  const isActive = (path: string) => {
    if (path === "/dashboard") return location.pathname === "/dashboard";
    return location.pathname.startsWith(path);
  };

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  function displayRole(role: string) {
    const map: Record<string, string> = {
      chief: '首席地震学家',
      geologist: '研究员',
      postdoc: '博士后',
      professor: '教授',
      admin: '管理员',
      assessor: '评估组',
    };
    return map[role] || role;
  }

  const r = currentUser?.role;
  const roleColorClass =
    r === "chief"
      ? "from-amber-400 to-orange-500"
      : r === "geologist"
      ? "from-indigo-400 to-blue-500"
      : r === "professor"
      ? "from-violet-400 to-purple-500"
      : r === "postdoc"
      ? "from-emerald-400 to-teal-500"
      : "from-sky-400 to-cyan-500";

  return (
    <div className="min-h-screen bg-[#0F172A] flex text-slate-100">
      <aside
        className={cn(
          "fixed lg:static inset-y-0 left-0 z-40 bg-slate-900 border-r border-slate-800 flex flex-col transition-all duration-300",
          sidebarOpen ? "w-64" : "w-0 lg:w-20 overflow-hidden"
        )}
      >
        <div className="h-16 flex items-center px-5 border-b border-slate-800 gap-3 shrink-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center shrink-0 shadow-lg">
            <Activity className="w-5 h-5 text-white" />
          </div>
          {sidebarOpen && (
            <div className="min-w-0">
              <div className="font-bold text-white text-sm leading-tight">SeismoSim</div>
              <div className="text-[10px] text-slate-400 font-mono">地震风险模拟平台 v2.1</div>
            </div>
          )}
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all relative",
                  active
                    ? "bg-gradient-to-r from-sky-500/20 to-indigo-500/20 text-white border border-sky-500/30"
                    : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                )}
              >
                {active && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full bg-gradient-to-b from-sky-400 to-indigo-500" />
                )}
                <Icon className={cn("w-5 h-5 shrink-0", active ? "text-sky-400" : "")} />
                {sidebarOpen && (
                  <>
                    <span className="flex-1">{item.label}</span>
                    {item.badge && (
                      <span
                        className={cn(
                          "px-2 py-0.5 rounded-full text-[10px] font-bold",
                          item.badgeClass
                        )}
                      >
                        {item.badge}
                      </span>
                    )}
                    {active && <ChevronRight className="w-4 h-4 text-sky-400" />}
                  </>
                )}
              </Link>
            );
          })}
        </nav>

        {sidebarOpen && user && (
          <div className="p-3 border-t border-slate-800 shrink-0">
            <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/50">
              <div className="flex items-center gap-3 mb-3">
                <div
                  className={cn(
                    "w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center text-white font-bold text-sm shrink-0 shadow",
                    roleColorClass
                  )}
                >
                  {user.name.charAt(0)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold text-white truncate">
                    {user.name}
                  </div>
                  <div className="text-[11px] text-slate-400 truncate">{user.role}</div>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs text-slate-400 hover:text-white hover:bg-slate-700/60 transition-all border border-slate-700/30"
              >
                <LogOut className="w-3.5 h-3.5" />
                退出登录
              </button>
            </div>
          </div>
        )}
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center px-5 gap-4 sticky top-0 z-30">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden p-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="hidden lg:block p-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="hidden md:block relative flex-1 max-w-sm">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="搜索任务、预警、断层..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-sky-500/50 focus:ring-2 focus:ring-sky-500/20"
            />
          </div>

          <div className="ml-auto flex items-center gap-2">
            <button className="relative p-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white"></span>
            </button>
            <div className="w-px h-6 bg-slate-200 mx-1 hidden sm:block"></div>
            {user && (
              <div className="hidden sm:flex items-center gap-2 pl-1">
                <div
                  className={cn(
                    "w-8 h-8 rounded-lg bg-gradient-to-br flex items-center justify-center text-white font-bold text-xs shadow",
                    roleColorClass
                  )}
                >
                  {user.name.charAt(0)}
                </div>
                <div className="hidden xl:block min-w-0">
                  <div className="text-sm font-medium text-slate-800 leading-tight truncate">
                    {user.name}
                  </div>
                  <div className="text-[10px] text-slate-500 truncate">{user.role}</div>
                </div>
              </div>
            )}
          </div>
        </header>

        <main className="flex-1 overflow-x-hidden">
          <Outlet />
        </main>
      </div>

      {!sidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}
