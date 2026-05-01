import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LOGO_URL } from '../utils/api';
import { Home, Calendar, GitBranch, Users, Shuffle, Download, UserCircle, LogOut, Shield, LogIn } from 'lucide-react';

const navItems = [
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

function NavItem({ to, icon: Icon, label, exact }) {
  return (
    <NavLink
      to={to}
      end={exact}
      className={({ isActive }) =>
        `flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
          isActive ? 'bg-amber-500/15 text-amber-400 border border-amber-500/25' : 'text-gray-400 hover:text-white hover:bg-white/5'
        }`
      }
    >
      <Icon size={18} />
      <span>{label}</span>
    </NavLink>
  );
}

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <aside className="hidden md:flex fixed left-0 top-0 h-full w-64 bg-[#0d0d0d] border-r border-[#1a1a1a] flex-col z-40">
      <div className="p-5 border-b border-[#1a1a1a]">
        <img src={LOGO_URL} alt="Turniri" className="h-12 w-auto object-contain mx-auto" onError={e => e.target.style.display = 'none'} />
        <p className="text-center text-xs text-gray-500 mt-2 font-bebas tracking-widest">MENAXHUES TURNIRI</p>
      </div>

      <nav className="flex-1 p-4 flex flex-col gap-1 overflow-y-auto">
        {navItems.map(item => <NavItem key={item.to} {...item} />)}

        {user?.role === 'superadmin' && (
          <>
            <div className="mt-4 mb-2 px-4">
              <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                <Shield size={12} /> Super Admin
              </div>
            </div>
            {adminItems.map(item => <NavItem key={item.to} {...item} />)}
          </>
        )}
      </nav>

      <div className="p-4 border-t border-[#1a1a1a]">
        {user ? (
          <>
            <div className="flex items-center gap-3 px-3 py-2 mb-2">
              <div className="w-8 h-8 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center">
                <span className="text-amber-400 text-xs font-bold">{user.username[0].toUpperCase()}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">{user.username}</p>
                <p className="text-xs text-gray-500">{user.role === 'superadmin' ? 'Super Admin' : 'Editor'}</p>
              </div>
            </div>
            <button onClick={() => { logout(); navigate('/'); }}
              className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl transition-all">
              <LogOut size={16} /> Dil
            </button>
          </>
        ) : (
          <button onClick={() => navigate('/login')}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-black bg-amber-500 hover:bg-amber-400 rounded-xl transition-all">
            <LogIn size={16} /> Hyr
          </button>
        )}
      </div>
    </aside>
  );
}
