import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import Layout from '@/components/Layout/Layout';
import LoginPage from '@/pages/LoginPage';
import DashboardPage from '@/pages/DashboardPage';
import TaskListPage from '@/pages/TaskListPage';
import TaskCreatePage from '@/pages/TaskCreatePage';
import TaskDetailPage from '@/pages/TaskDetailPage';
import ReportPage from '@/pages/ReportPage';
import RecommendationPage from '@/pages/RecommendationPage';
import FaultListPage from '@/pages/FaultListPage';
import FaultDetailPage from '@/pages/FaultDetailPage';
import SettingsPage from '@/pages/SettingsPage';
import MonitorPage from '@/pages/MonitorPage';
import AlertListPage from '@/pages/AlertListPage';
import AlertDetailPage from '@/pages/AlertDetailPage';
import ApprovalListPage from '@/pages/ApprovalListPage';
import ProfessorApprovalPage from '@/pages/ProfessorApprovalPage';
import PostdocApprovalPage from '@/pages/PostdocApprovalPage';
import useStore from '@/store';

export default function App() {
  const login = useStore((s) => s.login);

  useEffect(() => {
    const raw = localStorage.getItem('user');
    if (!raw) {
      const defaultUser = {
        id: 'u-001',
        name: '张明远',
        role: 'geologist' as const,
        email: 'zhangmy@geolab.cn',
      };
      login(defaultUser);
    }
  }, [login]);

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route element={<Layout />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />

          <Route path="/tasks" element={<TaskListPage />} />
          <Route path="/tasks/create" element={<TaskCreatePage />} />
          <Route path="/tasks/:id" element={<TaskDetailPage />} />

          <Route path="/monitor/:id" element={<MonitorPage />} />

          <Route path="/alerts" element={<AlertListPage />} />
          <Route path="/alerts/:id" element={<AlertDetailPage />} />

          <Route path="/approvals" element={<ApprovalListPage />} />
          <Route path="/approvals/postdoc/:id" element={<PostdocApprovalPage />} />
          <Route path="/approvals/professor/:id" element={<ProfessorApprovalPage />} />

          <Route path="/report/:id" element={<ReportPage />} />
          <Route path="/recommendations" element={<RecommendationPage />} />

          <Route path="/faults" element={<FaultListPage />} />
          <Route path="/faults/:id" element={<FaultDetailPage />} />

          <Route path="/settings" element={<SettingsPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Router>
  );
}
