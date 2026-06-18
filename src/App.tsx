import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Layout from './components/Layout/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Markets from './pages/Markets';
import MarketDetail from './pages/MarketDetail';
import Leaderboard from './pages/Leaderboard';
import OrderBook from './pages/OrderBook';
import Admin from './pages/Admin';
import AIChat from './pages/AIChat';

function ProtectedRoute({ children, adminOnly = false }: { children: React.ReactNode; adminOnly?: boolean }) {
  const { isAuthenticated, isAdmin } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (adminOnly && !isAdmin) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/leaderboard" element={<Layout><Leaderboard /></Layout>} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout><Dashboard /></Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/markets"
        element={
          <ProtectedRoute>
            <Layout><Markets /></Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/markets/:id"
        element={
          <ProtectedRoute>
            <Layout><MarketDetail /></Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/orderbook"
        element={
          <ProtectedRoute>
            <Layout><OrderBook /></Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin"
        element={
          <ProtectedRoute adminOnly>
            <Layout><Admin /></Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/ai-chat"
        element={
          <ProtectedRoute>
            <Layout><AIChat /></Layout>
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
