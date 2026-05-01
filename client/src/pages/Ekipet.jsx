import { useState, useEffect } from 'react';
import { apiFetch } from '../utils/api';
import { useToast } from '../components/Toast';
import { Plus, Trash2, Shield, Edit2, Check, X, ChevronDown, ChevronRight, UserPlus } from 'lucide-react';

const COLORS = ['#3b82f6','#ef4444','#10b981','#f59e0b','#8b5cf6','#ec4899','#06b6d4','#f97316','#84cc16','#ffffff','#6b7280','#000000'];
const statusLabel = { aktiv: 'Aktiv', eliminuar: 'Eliminuar', kampion: 'Kampion' };
const statusColor = { aktiv: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20', eliminuar: 'text-red-400 bg-red-500/10 border-red-500/20', kampion: 'text-amber-400 bg-amber-500/10 border-amber-500/20' };

export default function Ekipet() {
  const [teams, setTeams] = useState([]);
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [color, setColor] = useState('#3b82f6');
  const [adding, setAdding] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingTeam, setEditingTeam] = useState(null);
  const [expandedTeam, setExpandedTeam] = useState(null);
  const toast = useToast();

  useEffect(() => {
    Promise.all([apiFetch('/teams'), apiFetch('/players')])
      .then(([t, p]) => { setTeams(t); setPlayers(p); })
      .catch(e => toast.error(e.message))
      .finally(() => setLoading(false));
  }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setAdding(true);
    try {
      const team = await apiFetch('/teams', { method: 'POST', body: JSON.stringify({ name: name.trim(), color }) });
      setTeams(prev => [...prev, team].sort((a, b) => a.name.localeCompare(b.name)));
      setName(''); setShowForm(false);
      toast.success(`Ekipi "${team.name}" u shtua!`);
    } catch (e) { toast.error(e.message); } finally { setAdding(false); }
  };

  const handleEdit = async (team) => {
    try {
      const updated = await apiFetch(`/teams/${team.id}`, { method: 'PUT', body: JSON.stringify({ name: team.name, color: team.color }) });
      setTeams(prev => prev.map(t => t.id === updated.id ? updated : t).sort((a, b) => a.name.localeCompare(b.name)));
      setEditingTeam(null);
      toast.success('Ekipi u përditësua');
    } catch (e) { toast.error(e.message); }
  };

  const handleDelete = async (id, tname) => {
    if (!confirm(`Fshi ekipin "${tname}"?`)) return;
    try {
      await apiFetch(`/teams/${id}`, { method: 'DELETE' });
      setTeams(prev => prev.filter(t => t.id !== id));
      toast.success('Ekipi u fshi');
    } catch (e) { toast.error(e.message); }
  };

  const handleAddPlayer = async (teamId, playerData) => {
    try {
      const player = await apiFetch('/players', { method: 'POST', body: JSON.stringify({ team_id: teamId, ...playerData }) });
      setPlayers(prev => [...prev, player]);
      toast.success('Lojtari u shtua!');
      return true;
    } catch (e) { toast.error(e.message); return false; }
  };

  const handleDeletePlayer = async (id) => {
    try {
      await apiFetch(`/players/${id}`, { method: 'DELETE' });
      setPlayers(prev => prev.filter(p => p.id !== id));
      toast.success('Lojtari u fshi');
    } catch (e) { toast.error(e.message); }
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
        <button onClick={() => setShowForm(v => !v)}
          className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-black font-bold px-4 py-2 rounded-xl text-sm transition-all">
          <Plus size={16} /> Shto Ekip
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleAdd} className="bg-[#111] border border-amber-500/30 rounded-2xl p-4 mb-6 animate-fade-in">
          <h3 className="font-semibold text-white mb-3">Ekip i ri</h3>
          <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Emri i ekipit..."
            className="w-full bg-[#1a1a1a] border border-[#2a2a2a] text-white rounded-xl px-4 py-2.5 text-sm mb-3 focus:outline-none focus:border-amber-500/50"
            autoFocus />
          <ColorPicker color={color} onChange={setColor} />
          <div className="flex gap-2 mt-3">
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
          {grouped.kampion.map(t => (
            <TeamItem key={t.id} team={t} players={players.filter(p => p.team_id === t.id)}
              editing={editingTeam?.id === t.id} editData={editingTeam}
              expanded={expandedTeam === t.id}
              onExpand={() => setExpandedTeam(expandedTeam === t.id ? null : t.id)}
              onEdit={() => setEditingTeam({ ...t })} onEditSave={() => handleEdit(editingTeam)}
              onEditChange={f => setEditingTeam(prev => ({ ...prev, ...f }))}
              onEditCancel={() => setEditingTeam(null)}
              onDelete={handleDelete} onAddPlayer={handleAddPlayer} onDeletePlayer={handleDeletePlayer} />
          ))}
          {grouped.aktiv.length > 0 && <GroupLabel label={`Aktiv (${grouped.aktiv.length})`} />}
          {grouped.aktiv.map(t => (
            <TeamItem key={t.id} team={t} players={players.filter(p => p.team_id === t.id)}
              editing={editingTeam?.id === t.id} editData={editingTeam}
              expanded={expandedTeam === t.id}
              onExpand={() => setExpandedTeam(expandedTeam === t.id ? null : t.id)}
              onEdit={() => setEditingTeam({ ...t })} onEditSave={() => handleEdit(editingTeam)}
              onEditChange={f => setEditingTeam(prev => ({ ...prev, ...f }))}
              onEditCancel={() => setEditingTeam(null)}
              onDelete={handleDelete} onAddPlayer={handleAddPlayer} onDeletePlayer={handleDeletePlayer} />
          ))}
          {grouped.eliminuar.length > 0 && <GroupLabel label={`Eliminuar (${grouped.eliminuar.length})`} />}
          {grouped.eliminuar.map(t => (
            <TeamItem key={t.id} team={t} players={players.filter(p => p.team_id === t.id)}
              editing={editingTeam?.id === t.id} editData={editingTeam}
              expanded={expandedTeam === t.id}
              onExpand={() => setExpandedTeam(expandedTeam === t.id ? null : t.id)}
              onEdit={() => setEditingTeam({ ...t })} onEditSave={() => handleEdit(editingTeam)}
              onEditChange={f => setEditingTeam(prev => ({ ...prev, ...f }))}
              onEditCancel={() => setEditingTeam(null)}
              onDelete={handleDelete} onAddPlayer={handleAddPlayer} onDeletePlayer={handleDeletePlayer} />
          ))}
        </div>
      )}
      <div className="mt-4 text-center text-xs text-gray-600">{teams.length} ekipe gjithsej</div>
    </div>
  );
}

function GroupLabel({ label }) {
  return <p className="text-xs text-gray-600 uppercase tracking-wider font-semibold mt-4 mb-1.5 px-1">{label}</p>;
}

function ColorPicker({ color, onChange }) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-xs text-gray-500">Ngjyra:</span>
      {COLORS.map(c => (
        <button key={c} type="button" onClick={() => onChange(c)}
          className={`w-6 h-6 rounded-full border-2 transition-all ${color === c ? 'border-white scale-110' : 'border-transparent opacity-70'}`}
          style={{ backgroundColor: c }} />
      ))}
      <input type="color" value={color} onChange={e => onChange(e.target.value)}
        className="w-6 h-6 rounded-full bg-transparent border-0 cursor-pointer p-0" />
    </div>
  );
}

function TeamItem({ team, players, editing, editData, expanded, onExpand, onEdit, onEditSave, onEditChange, onEditCancel, onDelete, onAddPlayer, onDeletePlayer }) {
  const cls = statusColor[team.status] || 'text-gray-400 bg-gray-500/10 border-gray-500/20';
  const label = statusLabel[team.status] || team.status;

  if (editing) {
    return (
      <div className="bg-[#111] border border-amber-500/30 rounded-xl p-3 animate-fade-in">
        <input type="text" value={editData.name} onChange={e => onEditChange({ name: e.target.value })}
          className="w-full bg-[#1a1a1a] border border-[#2a2a2a] text-white rounded-xl px-3 py-2 text-sm mb-2 focus:outline-none focus:border-amber-500/50"
          autoFocus />
        <ColorPicker color={editData.color} onChange={c => onEditChange({ color: c })} />
        <div className="flex gap-2 mt-3">
          <button onClick={onEditCancel} className="flex items-center gap-1 px-3 py-1.5 text-gray-400 hover:text-white text-sm border border-[#333] rounded-lg transition-all">
            <X size={14} /> Anulo
          </button>
          <button onClick={onEditSave} className="flex items-center gap-1 px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-black font-bold text-sm rounded-lg transition-all">
            <Check size={14} /> Ruaj
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#111] border border-[#1a1a1a] hover:border-[#2a2a2a] rounded-xl overflow-hidden transition-all">
      <div className="flex items-center gap-3 px-4 py-3">
        <button onClick={onExpand} className="text-gray-600 hover:text-gray-400 shrink-0">
          {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </button>
        <div className="w-4 h-4 rounded-full shrink-0" style={{ backgroundColor: team.color || '#3b82f6' }} />
        <span className="flex-1 text-sm font-medium text-white">{team.name}</span>
        <span className="text-xs text-gray-500">{players.length} lojt.</span>
        {team.status === 'kampion' && <span className="text-lg">🏆</span>}
        <span className={`text-xs px-2 py-0.5 rounded-full border ${cls}`}>{label}</span>
        <button onClick={onEdit} className="text-gray-600 hover:text-amber-400 transition-colors p-1">
          <Edit2 size={13} />
        </button>
        <button onClick={() => onDelete(team.id, team.name)} className="text-gray-600 hover:text-red-400 transition-colors p-1">
          <Trash2 size={13} />
        </button>
      </div>

      {expanded && (
        <div className="px-4 pb-3 border-t border-[#1a1a1a] animate-fade-in">
          <PlayersSection teamId={team.id} players={players} onAdd={onAddPlayer} onDelete={onDeletePlayer} />
        </div>
      )}
    </div>
  );
}

function PlayersSection({ teamId, players, onAdd, onDelete }) {
  const [showForm, setShowForm] = useState(false);
  const [pName, setPName] = useState('');
  const [pPos, setPPos] = useState('');
  const [pNum, setPNum] = useState('');
  const [saving, setSaving] = useState(false);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!pName.trim()) return;
    setSaving(true);
    const ok = await onAdd(teamId, { name: pName.trim(), position: pPos || null, jersey_number: pNum ? parseInt(pNum) : null });
    if (ok) { setPName(''); setPPos(''); setPNum(''); setShowForm(false); }
    setSaving(false);
  };

  return (
    <div className="mt-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Lojtarët ({players.length})</span>
        <button onClick={() => setShowForm(v => !v)}
          className="flex items-center gap-1 text-xs text-amber-400 hover:text-amber-300 transition-colors">
          <UserPlus size={13} /> Shto Lojtar
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleAdd} className="bg-[#1a1a1a] rounded-xl p-3 mb-2 animate-fade-in">
          <div className="grid grid-cols-3 gap-2 mb-2">
            <input type="text" value={pName} onChange={e => setPName(e.target.value)} placeholder="Emri*"
              className="col-span-3 bg-[#222] border border-[#333] text-white rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-amber-500/50" autoFocus required />
            <input type="text" value={pPos} onChange={e => setPPos(e.target.value)} placeholder="Pozicioni"
              className="col-span-2 bg-[#222] border border-[#333] text-white rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-amber-500/50" />
            <input type="number" value={pNum} onChange={e => setPNum(e.target.value)} placeholder="Nr." min="1" max="99"
              className="bg-[#222] border border-[#333] text-white rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-amber-500/50" />
          </div>
          <div className="flex gap-1.5">
            <button type="button" onClick={() => setShowForm(false)} className="flex-1 border border-[#333] text-gray-500 rounded-lg py-1.5 text-xs hover:text-white transition-all">Anulo</button>
            <button type="submit" disabled={saving} className="flex-1 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-black font-bold rounded-lg py-1.5 text-xs transition-all">
              {saving ? '...' : 'Shto'}
            </button>
          </div>
        </form>
      )}

      {players.length === 0 ? (
        <p className="text-xs text-gray-600 py-2">Asnjë lojtar i regjistruar</p>
      ) : (
        <div className="space-y-1">
          {players.map(p => (
            <div key={p.id} className="flex items-center gap-2 py-1.5 px-2 rounded-lg hover:bg-[#1a1a1a] group">
              {p.jersey_number && (
                <span className="text-xs font-bebas text-amber-500 w-5 text-center">{p.jersey_number}</span>
              )}
              <span className="flex-1 text-xs text-gray-300">{p.name}</span>
              {p.position && <span className="text-xs text-gray-600">{p.position}</span>}
              <button onClick={() => onDelete(p.id)} className="opacity-0 group-hover:opacity-100 text-gray-600 hover:text-red-400 transition-all">
                <Trash2 size={12} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
