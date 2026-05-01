import { useState, useEffect } from 'react';
import { apiFetch } from '../utils/api';
import { useToast } from '../components/Toast';
import { UserPlus, Trash2, UserCircle } from 'lucide-react';

export default function Perdoruesit() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [adding, setAdding] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const toast = useToast();

  useEffect(() => {
    apiFetch('/users').then(setUsers).catch(e => toast.error(e.message)).finally(() => setLoading(false));
  }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    setAdding(true);
    try {
      const user = await apiFetch('/users', { method: 'POST', body: JSON.stringify({ username: username.trim(), password }) });
      setUsers(prev => [...prev, user]);
      setUsername('');
      setPassword('');
      setShowForm(false);
      toast.success(`Përdoruesi "${user.username}" u shtua!`);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (id, uname) => {
    if (!confirm(`Largo përdoruesin "${uname}"?`)) return;
    try {
      await apiFetch(`/users/${id}`, { method: 'DELETE' });
      setUsers(prev => prev.filter(u => u.id !== id));
      toast.success('Përdoruesi u largua');
    } catch (e) {
      toast.error(e.message);
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-bebas text-3xl text-white tracking-wider">PËRDORUESIT</h1>
        <button onClick={() => setShowForm(v => !v)}
          className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-black font-bold px-4 py-2 rounded-xl text-sm transition-all">
          <UserPlus size={16} />
          Shto Përdorues
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleAdd} className="bg-[#111] border border-amber-500/30 rounded-2xl p-4 mb-6 animate-fade-in">
          <h3 className="font-semibold text-white mb-3">Editor i ri</h3>
          <div className="space-y-3 mb-4">
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="Emri i përdoruesit"
              required
              autoFocus
              className="w-full bg-[#1a1a1a] border border-[#2a2a2a] text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-amber-500/50 placeholder:text-gray-600"
            />
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Fjalëkalimi"
              required
              className="w-full bg-[#1a1a1a] border border-[#2a2a2a] text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-amber-500/50 placeholder:text-gray-600"
            />
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={() => setShowForm(false)} className="flex-1 border border-[#333] text-gray-400 rounded-xl py-2 text-sm hover:text-white transition-all">Anulo</button>
            <button type="submit" disabled={adding} className="flex-1 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-black font-bold rounded-xl py-2 text-sm transition-all">
              {adding ? 'Duke shtuar...' : 'Shto Përdorues'}
            </button>
          </div>
        </form>
      )}

      <div className="bg-[#111] border border-[#222] rounded-2xl p-3 mb-4">
        <div className="flex items-center gap-3 px-3 py-2.5">
          <div className="w-9 h-9 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center">
            <span className="text-amber-400 text-sm font-bold">A</span>
          </div>
          <div>
            <p className="text-sm font-semibold text-white">admin</p>
            <p className="text-xs text-amber-400">Super Admin</p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center text-gray-500 py-8">Duke ngarkuar...</div>
      ) : users.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <UserCircle size={40} className="mx-auto mb-3 opacity-40" />
          <p className="text-sm">Asnjë editor i shtuar</p>
          <p className="text-xs text-gray-600 mt-1">Editorët mund të fusin rezultate ndeshje</p>
        </div>
      ) : (
        <div className="bg-[#111] border border-[#222] rounded-2xl divide-y divide-[#1a1a1a]">
          {users.map(u => (
            <div key={u.id} className="flex items-center gap-3 px-4 py-3">
              <div className="w-9 h-9 rounded-full bg-blue-500/20 border border-blue-500/30 flex items-center justify-center">
                <span className="text-blue-400 text-sm font-bold">{u.username[0].toUpperCase()}</span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-white">{u.username}</p>
                <p className="text-xs text-blue-400">Editor</p>
              </div>
              <button onClick={() => handleDelete(u.id, u.username)}
                className="text-gray-600 hover:text-red-400 transition-colors p-1.5 rounded-lg hover:bg-red-500/10">
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      )}

      <p className="text-xs text-gray-600 text-center mt-4">
        Editorët mund të fusin vetëm rezultate ndeshje
      </p>
    </div>
  );
}
