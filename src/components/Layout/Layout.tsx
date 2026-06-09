import { Outlet, Navigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import { useAuthStore } from '@/store/useAuthStore';

export default function Layout() {
  const { user } = useAuthStore();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 dark">
      <Sidebar />
      <div className="ml-[260px] transition-all duration-300 ease-in-out">
        <div className="flex flex-col min-h-screen">
          <Topbar />
          <main className="flex-1 p-6 overflow-auto">
            <div className="animate-fade-in">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
