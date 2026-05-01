import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LOGO_URL } from '../utils/api';
import { Lock, User, Trophy } from 'lucide-react';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(username, password);
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-sm relative">
        <div className="text-center mb-8">
          <div className="w-24 h-24 mx-auto mb-4 rounded-2xl overflow-hidden bg-[#111] border border-[#222] flex items-center justify-center">
            <img
              src={LOGO_URL}
              alt="Logo"
              className="w-full h-full object-cover"
              onError={e => { e.target.style.display = 'none'; e.target.parentNode.innerHTML = '<div class="text-amber-400"><svg xmlns=\'http://www.w3.org/2000/svg\' width=\'40\' height=\'40\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'currentColor\' stroke-width=\'2\'><path d=\'M6 9H4.5a2.5 2.5 0 0 1 0-5H6\'/><path d=\'M18 9h1.5a2.5 2.5 0 0 0 0-5H18\'/><path d=\'M4 22h16\'/><path d=\'M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22\'/><path d=\'M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22\'/><path d=\'M18 2H6v7a6 6 0 0 0 12 0V2Z\'/></svg></div>'; }}
            />
          </div>
          <h1 className="font-bebas text-3xl text-white tracking-wider">MENAXHUES TURNIRI</h1>
          <p className="text-gray-500 text-sm mt-1">Hyr për të menaxhuar turnirin</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-[#111] border border-[#222] rounded-2xl p-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Emri i përdoruesit</label>
            <div className="relative">
              <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="admin"
                required
                autoFocus
                className="w-full bg-[#1a1a1a] border border-[#2a2a2a] text-white rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20 placeholder:text-gray-600 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Fjalëkalimi</label>
            <div className="relative">
              <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full bg-[#1a1a1a] border border-[#2a2a2a] text-white rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20 placeholder:text-gray-600 transition-all"
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl px-4 py-2.5">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-amber-500 hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed text-black font-bold rounded-xl py-3 text-sm transition-all active:scale-95"
          >
            {loading ? 'Duke hyrë...' : 'Hyr'}
          </button>
        </form>
      </div>
    </div>
  );
}
