import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import useAuthStore from './store/authStore';
import TopNav from './components/TopNav';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Cattle from './pages/Cattle';
import CattleDetail from './pages/CattleDetail';
import Predict from './pages/Predict';
import Alerts from './pages/Alerts';
import Analytics from './pages/Analytics';
import Settings from './pages/Settings';

function ProtectedLayout({ children }) {
  const { isAuth } = useAuthStore();
  if (!isAuth) return <Navigate to="/login" replace />;
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 flex flex-col antialiased">
      <TopNav />
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6">
        {children}
      </main>
    </div>
  );
}

function RootRedirect() {
  const { isAuth } = useAuthStore();
  return <Navigate to={isAuth ? '/dashboard' : '/login'} replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<RootRedirect />} />
      <Route path="/login" element={<Login />} />

      <Route path="/dashboard" element={<ProtectedLayout><Dashboard /></ProtectedLayout>} />
      <Route path="/cattle" element={<ProtectedLayout><Cattle /></ProtectedLayout>} />
      <Route path="/cattle/:id" element={<ProtectedLayout><CattleDetail /></ProtectedLayout>} />
      <Route path="/predict" element={<ProtectedLayout><Predict /></ProtectedLayout>} />
      <Route path="/alerts" element={<ProtectedLayout><Alerts /></ProtectedLayout>} />
      <Route path="/analytics" element={<ProtectedLayout><Analytics /></ProtectedLayout>} />
      <Route path="/settings" element={<ProtectedLayout><Settings /></ProtectedLayout>} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
