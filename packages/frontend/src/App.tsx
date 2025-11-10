import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './lib/store';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import WorkersPage from './pages/WorkersPage';
import WorkerPerformancePage from './pages/WorkerPerformancePage';
import SchedulePage from './pages/SchedulePage';
import TimeTrackingPage from './pages/TimeTrackingPage';
import AnalyticsPage from './pages/AnalyticsPage';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="workers" element={<WorkersPage />} />
        <Route path="workers/:workerId/performance" element={<WorkerPerformancePage />} />
        <Route path="schedule" element={<SchedulePage />} />
        <Route path="time-tracking" element={<TimeTrackingPage />} />
        <Route path="analytics" element={<AnalyticsPage />} />
      </Route>
    </Routes>
  );
}

export default App;
