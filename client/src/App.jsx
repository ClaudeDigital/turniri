import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './components/Toast';
import Navbar from './components/Navbar';
import BottomNav from './components/BottomNav';
import Login from './pages/Login';
import Ballina from './pages/Ballina';
import Bracket from './pages/Bracket';
import Ndeshjet from './pages/Ndeshjet';
import Ekipet from './pages/Ekipet';
import Short from './pages/Short';
import Perdoruesit from './pages/Perdoruesit';
import Eksporto from './pages/Eksporto';

const BASE = '/ngucatinderondeshmoret';

function RequireAdmin({ children }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" />
    </div>
  );
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'superadmin') return <Navigate to="/" replace />;
  return children;
}

function Layout({ children }) {
  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <div className="flex">
        <Navbar />
        <main className="flex-1 md:ml-64 pb-20 md:pb-0 min-h-screen">
          {children}
        </main>
      </div>
      <BottomNav />
    </div>
  );
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      {/* Public routes — no login required */}
      <Route path="/" element={<Layout><Ballina /></Layout>} />
      <Route path="/bracket" element={<Layout><Bracket /></Layout>} />
      <Route path="/ndeshjet" element={<Layout><Ndeshjet /></Layout>} />
      {/* Admin-only routes */}
      <Route path="/ekipet" element={<RequireAdmin><Layout><Ekipet /></Layout></RequireAdmin>} />
      <Route path="/short" element={<RequireAdmin><Layout><Short /></Layout></RequireAdmin>} />
      <Route path="/perdoruesit" element={<RequireAdmin><Layout><Perdoruesit /></Layout></RequireAdmin>} />
      <Route path="/eksporto" element={<RequireAdmin><Layout><Eksporto /></Layout></RequireAdmin>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter basename={BASE}>
          <AppRoutes />
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
}
