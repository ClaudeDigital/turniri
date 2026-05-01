import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Home, Calendar, GitBranch, MoreHorizontal, X, Users, Shuffle, Download, UserCircle, LogOut, Shield, LogIn } from 'lucide-react';
import { useState } from 'react';

const mainItems = [
  { to: '/', icon: Home, label: 'Ballina', exact: true },
  { to: '/ndeshjet', icon: Calendar, label: 'Ndeshjet' },
  { to: '/bracket', icon: GitBranch, label: 'Bracket' },
];

const adminItems = [
  { to: '/ekipet', icon: Users, label: 'Ekipet' },
  { to: '/short', icon: Shuffle, label: 'Short' },
  { to: '/perdoruesit', icon: UserCircle, label: 'Përdoruesit' },
  { to: '/eksporto', icon: Download, label: 'Eksporto' },
];

export default function BottomNav() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      {menuOpen && (
        <div className="fixed inset-0 z-40 md:hidden" onClick={() => setMenuOpen(false)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div className="absolute bottom-20 left-4 right-4 bg-[#111] border border-[#222] rounded-2xl p-4 animate-fade-in" onClick={e => e.stopPropagation()}>
            {user?.role === 'superadmin' && (
              <>
                <div className="flex items-center gap-2 text-xs text-gray-500 uppercase tracking-wider font-semibold mb-3 px-1">
                  <Shield size={12} /> Admin
                </div>
                <div className="grid grid-cols-2 gap-2 mb-4">
                  {adminItems.map(({ to, icon: Icon, label }) => (
                    <NavLink key={to} to={to} onClick={() => setMenuOpen(false)}
                      className={({ isActive }) =>
                        `flex items-center gap-2 p-3 rounded-xl text-sm font-medium transition-all ${isActive ? 'bg-amber-500/15 text-amber-400' : 'text-gray-300 bg-[#1a1a1a]'}`
                      }
                    >
                      <Icon size={16} /> {label}
                    </NavLink>
                  ))}
                </div>
              </>
            )}
            <div className="border-t border-[#222] pt-3 flex items-center justify-between">
              {user ? (
                <>
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <div className="w-7 h-7 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 text-xs font-bold">
                      {user.username[0].toUpperCase()}
                    </div>
                    <span>{user.username}</span>
                  </div>
                  <button onClick={() => { setMenuOpen(false); logout(); navigate('/'); }}
                    className="flex items-center gap-1.5 text-sm text-red-400 px-3 py-1.5 rounded-lg hover:bg-red-500/10">
                    <LogOut size={14} /> Dil
                  </button>
                </>
              ) : (
                <button onClick={() => { setMenuOpen(false); navigate('/login'); }}
                  className="w-full flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-400 text-black font-bold py-2.5 rounded-xl text-sm transition-all">
                  <LogIn size={16} /> Hyr si Admin
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-[#0d0d0d]/95 backdrop-blur-md border-t border-[#1a1a1a] flex items-stretch">
        {mainItems.map(({ to, icon: Icon, label, exact }) => (
          <NavLink key={to} to={to} end={exact}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center justify-center gap-1 py-3 text-xs font-medium transition-all ${isActive ? 'text-amber-400' : 'text-gray-500'}`
            }
          >
            <Icon size={20} />
            <span>{label}</span>
          </NavLink>
        ))}
        <button
          onClick={() => setMenuOpen(v => !v)}
          className={`flex-1 flex flex-col items-center justify-center gap-1 py-3 text-xs font-medium transition-all ${menuOpen ? 'text-amber-400' : 'text-gray-500'}`}
        >
          {menuOpen ? <X size={20} /> : <MoreHorizontal size={20} />}
          <span>Menu</span>
        </button>
      </nav>
    </>
  );
}
