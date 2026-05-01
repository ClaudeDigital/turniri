import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '../utils/api';
import { useToast } from '../components/Toast';
import { useAuth } from '../context/AuthContext';
import MatchCard from '../components/MatchCard';
import { X, Save, ChevronDown, Plus, Trash2 } from 'lucide-react';

export default function Ndeshjet() {
  const [matches, setMatches] = useState([]);
  const [rounds, setRounds] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ round_id: '', status: '' });
  const [editMatch, setEditMatch] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const { user } = useAuth();
  const toast = useToast();

  const loadMatches = useCallback(() => {
    const params = new URLSearchParams();
    if (filter.round_id) params.append('round_id', filter.round_id);
    if (filter.status) params.append('status', filter.status);
    return apiFetch(`/matches?${params}`).then(setMatches);
  }, [filter]);

  useEffect(() => {
    Promise.all([loadMatches(), apiFetch('/rounds').then(setRounds), apiFetch('/teams').then(setTeams)])
      .catch(e => toast.error(e.message))
      .finally(() => setLoading(false));
  }, [loadMatches]);

  const handleSaveResult = async (id, data) => {
    try {
      const updated = await apiFetch(`/matches/${id}`, { method: 'PUT', body: JSON.stringify(data) });
      setMatches(prev => prev.map(m => m.id === id ? updated : m));
      setEditMatch(null);
      toast.success('Rezultati u ruajt!');
    } catch (e) { toast.error(e.message); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Fshi këtë ndeshje?')) return;
    try {
      await apiFetch(`/matches/${id}`, { method: 'DELETE' });
      setMatches(prev => prev.filter(m => m.id !== id));
      toast.success('Ndeshja u fshi');
    } catch (e) { toast.error(e.message); }
  };

  const handleAddMatch = async (data) => {
    try {
      const match = await apiFetch('/matches', { method: 'POST', body: JSON.stringify(data) });
      setMatches(prev => [...prev, match]);
      setShowAdd(false);
      toast.success('Ndeshja u shtua!');
    } catch (e) { toast.error(e.message); }
  };

  const visibleRounds = rounds.filter(r => r.status !== 'pending');
  const isEditor = user?.role === 'editor' || user?.role === 'superadmin';
  const isAdmin = user?.role === 'superadmin';

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="font-bebas text-3xl text-white tracking-wider">NDESHJET</h1>
        {isAdmin && (
          <button onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-black font-bold px-3 py-2 rounded-xl text-sm transition-all">
            <Plus size={16} /> Shto Ndeshje
          </button>
        )}
      </div>

      <div className="flex gap-2 mb-4">
        <div className="relative flex-1">
          <select value={filter.round_id} onChange={e => setFilter(f => ({ ...f, round_id: e.target.value }))}
            className="w-full bg-[#111] border border-[#222] text-gray-300 rounded-xl px-3 py-2 text-sm appearance-none focus:outline-none focus:border-amber-500/50">
            <option value="">Të gjitha raundet</option>
            {visibleRounds.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
          </select>
          <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
        </div>
        <div className="relative flex-1">
          <select value={filter.status} onChange={e => setFilter(f => ({ ...f, status: e.target.value }))}
            className="w-full bg-[#111] border border-[#222] text-gray-300 rounded-xl px-3 py-2 text-sm appearance-none focus:outline-none focus:border-amber-500/50">
            <option value="">Të gjitha</option>
            <option value="planifikuar">Pa Luajtur</option>
            <option value="perfunduar">Luajtur</option>
          </select>
          <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
        </div>
      </div>

      {loading ? (
        <div className="text-center text-gray-500 py-12">Duke ngarkuar...</div>
      ) : matches.filter(m => !m.is_bye).length === 0 ? (
        <div className="text-center text-gray-500 py-12">Asnjë ndeshje</div>
      ) : (
        <div className="space-y-2">
          {matches.filter(m => !m.is_bye).map(m => (
            <div key={m.id} className="relative group">
              <MatchCard match={m} onClick={isEditor ? () => setEditMatch(m) : undefined} />
              {isEditor && (
                <button
                  onClick={(e) => { e.stopPropagation(); handleDelete(m.id); }}
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1.5 text-gray-600 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {editMatch && (
        <ResultModal match={editMatch} onClose={() => setEditMatch(null)} onSave={handleSaveResult} />
      )}

      {showAdd && (
        <AddMatchModal rounds={visibleRounds} teams={teams} onClose={() => setShowAdd(false)} onSave={handleAddMatch} />
      )}
    </div>
  );
}

function ResultModal({ match, onClose, onSave }) {
  const [homeScore, setHomeScore] = useState(match.home_score ?? '');
  const [awayScore, setAwayScore] = useState(match.away_score ?? '');
  const [hasPen, setHasPen] = useState(match.home_pen != null);
  const [homePen, setHomePen] = useState(match.home_pen ?? '');
  const [awayPen, setAwayPen] = useState(match.away_pen ?? '');
  const [matchDate, setMatchDate] = useState(match.match_date || '');
  const [matchTime, setMatchTime] = useState(match.match_time || '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await onSave(match.id, {
      home_score: homeScore !== '' ? parseInt(homeScore) : null,
      away_score: awayScore !== '' ? parseInt(awayScore) : null,
      home_pen: hasPen && homePen !== '' ? parseInt(homePen) : null,
      away_pen: hasPen && awayPen !== '' ? parseInt(awayPen) : null,
      match_date: matchDate || null,
      match_time: matchTime || null,
    });
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div className="relative bg-[#111] border border-[#222] rounded-2xl w-full max-w-md p-5 animate-fade-in" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bebas text-xl text-white tracking-wide">FUT REZULTATIN</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-white"><X size={20} /></button>
        </div>

        <div className="flex items-center gap-2 mb-5 p-3 bg-[#1a1a1a] rounded-xl">
          <TeamPill name={match.home_team_name} color={match.home_team_color} />
          <span className="text-gray-500 text-sm">vs</span>
          <TeamPill name={match.away_team_name} color={match.away_team_color} right />
        </div>

        <div className="flex items-center gap-3 mb-4">
          <ScoreInput label={match.home_team_name} value={homeScore} onChange={setHomeScore} />
          <span className="text-gray-500 font-bebas text-2xl mt-4">—</span>
          <ScoreInput label={match.away_team_name} value={awayScore} onChange={setAwayScore} />
        </div>

        <label className="flex items-center gap-2 mb-4 cursor-pointer">
          <input type="checkbox" checked={hasPen} onChange={e => setHasPen(e.target.checked)} className="w-4 h-4 accent-amber-500" />
          <span className="text-sm text-gray-300">Penallti?</span>
        </label>

        {hasPen && (
          <div className="flex items-center gap-3 mb-4 animate-fade-in">
            <ScoreInput label="Pen." value={homePen} onChange={setHomePen} />
            <span className="text-gray-500 font-bebas text-2xl mt-4">—</span>
            <ScoreInput label="Pen." value={awayPen} onChange={setAwayPen} />
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Data</label>
            <input type="date" value={matchDate} onChange={e => setMatchDate(e.target.value)}
              className="w-full bg-[#1a1a1a] border border-[#2a2a2a] text-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-amber-500/50" />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Ora</label>
            <input type="time" value={matchTime} onChange={e => setMatchTime(e.target.value)}
              className="w-full bg-[#1a1a1a] border border-[#2a2a2a] text-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-amber-500/50" />
          </div>
        </div>

        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 border border-[#333] text-gray-400 hover:text-white rounded-xl py-2.5 text-sm font-medium transition-all">Anulo</button>
          <button onClick={handleSave} disabled={saving}
            className="flex-1 flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-black font-bold rounded-xl py-2.5 text-sm transition-all">
            <Save size={16} />
            {saving ? 'Duke ruajtur...' : 'Ruaj'}
          </button>
        </div>
      </div>
    </div>
  );
}

function AddMatchModal({ rounds, teams, onClose, onSave }) {
  const [roundId, setRoundId] = useState('');
  const [homeTeamId, setHomeTeamId] = useState('');
  const [awayTeamId, setAwayTeamId] = useState('');
  const [matchDate, setMatchDate] = useState('');
  const [matchTime, setMatchTime] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!roundId || !homeTeamId || !awayTeamId) return;
    setSaving(true);
    await onSave({ round_id: parseInt(roundId), home_team_id: parseInt(homeTeamId), away_team_id: parseInt(awayTeamId), match_date: matchDate || null, match_time: matchTime || null });
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div className="relative bg-[#111] border border-[#222] rounded-2xl w-full max-w-md p-5 animate-fade-in" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bebas text-xl text-white tracking-wide">SHTO NDESHJE</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-white"><X size={20} /></button>
        </div>

        <div className="space-y-3 mb-4">
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Raundi</label>
            <select value={roundId} onChange={e => setRoundId(e.target.value)}
              className="w-full bg-[#1a1a1a] border border-[#2a2a2a] text-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-amber-500/50">
              <option value="">Zgjidh raundin...</option>
              {rounds.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Ekipi Shtëpiak</label>
              <select value={homeTeamId} onChange={e => setHomeTeamId(e.target.value)}
                className="w-full bg-[#1a1a1a] border border-[#2a2a2a] text-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-amber-500/50">
                <option value="">Ekipi...</option>
                {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Ekipi Mysafir</label>
              <select value={awayTeamId} onChange={e => setAwayTeamId(e.target.value)}
                className="w-full bg-[#1a1a1a] border border-[#2a2a2a] text-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-amber-500/50">
                <option value="">Ekipi...</option>
                {teams.filter(t => t.id !== parseInt(homeTeamId)).map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Data</label>
              <input type="date" value={matchDate} onChange={e => setMatchDate(e.target.value)}
                className="w-full bg-[#1a1a1a] border border-[#2a2a2a] text-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-amber-500/50" />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Ora</label>
              <input type="time" value={matchTime} onChange={e => setMatchTime(e.target.value)}
                className="w-full bg-[#1a1a1a] border border-[#2a2a2a] text-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-amber-500/50" />
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 border border-[#333] text-gray-400 hover:text-white rounded-xl py-2.5 text-sm font-medium transition-all">Anulo</button>
          <button onClick={handleSave} disabled={saving || !roundId || !homeTeamId || !awayTeamId}
            className="flex-1 flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-black font-bold rounded-xl py-2.5 text-sm transition-all">
            <Plus size={16} />
            {saving ? 'Duke shtuar...' : 'Shto'}
          </button>
        </div>
      </div>
    </div>
  );
}

function TeamPill({ name, color, right }) {
  return (
    <div className={`flex items-center gap-1.5 flex-1 min-w-0 ${right ? 'flex-row-reverse' : ''}`}>
      <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: color || '#3b82f6' }} />
      <span className="text-sm font-medium text-white truncate">{name}</span>
    </div>
  );
}

function ScoreInput({ label, value, onChange }) {
  return (
    <div className="flex-1 text-center">
      <label className="block text-xs text-gray-500 mb-1 truncate">{label}</label>
      <input type="number" min="0" max="99" value={value} onChange={e => onChange(e.target.value)}
        className="w-full bg-[#1a1a1a] border border-[#2a2a2a] text-white text-center font-bebas text-3xl rounded-xl px-2 py-2 focus:outline-none focus:border-amber-500/50"
        placeholder="0" />
    </div>
  );
}
