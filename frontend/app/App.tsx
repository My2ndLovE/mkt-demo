import { BrowserRouter, Routes, Route, Navigate } from 'react-router';
import { useAuthStore } from './stores/auth.store';
import LoginPage from './routes/auth/login';
import DashboardPage from './routes/app/dashboard';
import BettingPage from './routes/app/betting/index';
import HistoryPage from './routes/app/history';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuthStore();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/app/dashboard" replace />} />
        <Route path="/login" element={<LoginPage />} />

        <Route
          path="/app/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/app/betting"
          element={
            <ProtectedRoute>
              <BettingPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/app/history"
          element={
            <ProtectedRoute>
              <HistoryPage />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Navigate to="/app/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
