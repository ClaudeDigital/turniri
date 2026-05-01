import { useState, useEffect } from 'react';
import { apiFetch } from '../utils/api';
import { useToast } from '../components/Toast';
import { Plus, Trash2, Shield } from 'lucide-react';

const COLORS = ['#3b82f6','#ef4444','#10b981','#f59e0b','#8b5cf6','#ec4899','#06b6d4','#f97316','#84cc16','#ffffff'];

const statusLabel = { aktiv: 'Aktiv', eliminuar: 'Eliminuar', kampion: 'Kampion', ndertues: 'Kalon Automatikisht' };
const statusColor = { aktiv: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20', eliminuar: 'text-red-400 bg-red-500/10 border-red-500/20', kampion: 'text-amber-400 bg-amber-500/10 border-amber-500/20', ndertues: 'text-blue-400 bg-blue-500/10 border-blue-500/20' };

export default function Ekipet() {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [color, setColor] = useState('#3b82f6');
  const [adding, setAdding] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const toast = useToast();

  useEffect(() => {
    apiFetch('/teams').then(setTeams).catch(e => toast.error(e.message)).finally(() => setLoading(false));
  }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setAdding(true);
    try {
      const team = await apiFetch('/teams', { method: 'POST', body: JSON.stringify({ name: name.trim(), color }) });
      setTeams(prev => [...prev, team].sort((a, b) => a.name.localeCompare(b.name)));
      setName('');
      setShowForm(false);
      toast.success(`Ekipi "${team.name}" u shtua!`);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (id, tname) => {
    if (!confirm(`Fshi ekipin "${tname}"?`)) return;
    try {
      await apiFetch(`/teams/${id}`, { method: 'DELETE' });
      setTeams(prev => prev.filter(t => t.id !== id));
      toast.success('Ekipi u fshi');
    } catch (e) {
      toast.error(e.message);
    }
  };

  const grouped = {
    kampion: teams.filter(t => t.status === 'kampion'),
    aktiv: teams.filter(t => t.status === 'aktiv'),
    eliminuar: teams.filter(t => t.status === 'eliminuar'),
  };

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-bebas text-3xl text-white tracking-wider">EKIPET</h1>
        <button
          onClick={() => setShowForm(v => !v)}
          className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-black font-bold px-4 py-2 rounded-xl text-sm transition-all"
        >
          <Plus size={16} />
          Shto Ekip
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleAdd} className="bg-[#111] border border-amber-500/30 rounded-2xl p-4 mb-6 animate-fade-in">
          <h3 className="font-semibold text-white mb-3">Ekip i ri</h3>
          <div className="flex gap-2 mb-3">
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Emri i ekipit..."
              className="flex-1 bg-[#1a1a1a] border border-[#2a2a2a] text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-amber-500/50"
              autoFocus
            />
          </div>
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <span className="text-xs text-gray-500">Ngjyra:</span>
            {COLORS.map(c => (
              <button key={c} type="button" onClick={() => setColor(c)}
                className={`w-7 h-7 rounded-full border-2 transition-all ${color === c ? 'border-white scale-110' : 'border-transparent'}`}
                style={{ backgroundColor: c }}
              />
            ))}
            <input type="color" value={color} onChange={e => setColor(e.target.value)}
              className="w-7 h-7 rounded-full bg-transparent border-0 cursor-pointer p-0" title="Zgjidh ngjyrë" />
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={() => setShowForm(false)} className="flex-1 border border-[#333] text-gray-400 rounded-xl py-2 text-sm hover:text-white transition-all">Anulo</button>
            <button type="submit" disabled={adding} className="flex-1 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-black font-bold rounded-xl py-2 text-sm transition-all">
              {adding ? 'Duke shtuar...' : 'Shto'}
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="text-center text-gray-500 py-12">Duke ngarkuar...</div>
      ) : teams.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <Shield size={40} className="mx-auto mb-3 opacity-40" />
          <p>Asnjë ekip i shtuar</p>
        </div>
      ) : (
        <div className="space-y-1">
          {grouped.kampion.length > 0 && <GroupLabel label="Kampion" />}
          {grouped.kampion.map(t => <TeamRow key={t.id} team={t} onDelete={handleDelete} />)}
          {grouped.aktiv.length > 0 && <GroupLabel label={`Aktiv (${grouped.aktiv.length})`} />}
          {grouped.aktiv.map(t => <TeamRow key={t.id} team={t} onDelete={handleDelete} />)}
          {grouped.eliminuar.length > 0 && <GroupLabel label={`Eliminuar (${grouped.eliminuar.length})`} />}
          {grouped.eliminuar.map(t => <TeamRow key={t.id} team={t} onDelete={handleDelete} />)}
        </div>
      )}

      <div className="mt-4 text-center text-xs text-gray-600">
        {teams.length} ekipe gjithsej
      </div>
    </div>
  );
}

function GroupLabel({ label }) {
  return <p className="text-xs text-gray-600 uppercase tracking-wider font-semibold mt-4 mb-1.5 px-1">{label}</p>;
}

function TeamRow({ team, onDelete }) {
  const label = statusLabel[team.status] || team.status;
  const cls = statusColor[team.status] || 'text-gray-400 bg-gray-500/10 border-gray-500/20';

  return (
    <div className="flex items-center gap-3 bg-[#111] border border-[#1a1a1a] hover:border-[#2a2a2a] rounded-xl px-4 py-3 transition-all">
      <div className="w-4 h-4 rounded-full shrink-0" style={{ backgroundColor: team.color || '#3b82f6' }} />
      <span className="flex-1 text-sm font-medium text-white">{team.name}</span>
      {team.status === 'kampion' && <span className="text-lg">🏆</span>}
      <span className={`text-xs px-2 py-0.5 rounded-full border ${cls}`}>{label}</span>
      <button onClick={() => onDelete(team.id, team.name)}
        className="text-gray-600 hover:text-red-400 transition-colors ml-1 p-1">
        <Trash2 size={15} />
      </button>
    </div>
  );
}
