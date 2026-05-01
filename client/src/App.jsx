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

function RequireAuth({ children, adminOnly }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin mx-auto mb-3" />
        <p className="text-gray-500 text-sm">Duke ngarkuar...</p>
      </div>
    </div>
  );
  if (!user) return <Navigate to="/login" replace />;
  if (adminOnly && user.role !== 'superadmin') return <Navigate to="/" replace />;
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
      <Route path="/" element={<RequireAuth><Layout><Ballina /></Layout></RequireAuth>} />
      <Route path="/bracket" element={<RequireAuth><Layout><Bracket /></Layout></RequireAuth>} />
      <Route path="/ndeshjet" element={<RequireAuth><Layout><Ndeshjet /></Layout></RequireAuth>} />
      <Route path="/ekipet" element={<RequireAuth adminOnly><Layout><Ekipet /></Layout></RequireAuth>} />
      <Route path="/short" element={<RequireAuth adminOnly><Layout><Short /></Layout></RequireAuth>} />
      <Route path="/perdoruesit" element={<RequireAuth adminOnly><Layout><Perdoruesit /></Layout></RequireAuth>} />
      <Route path="/eksporto" element={<RequireAuth adminOnly><Layout><Eksporto /></Layout></RequireAuth>} />
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
