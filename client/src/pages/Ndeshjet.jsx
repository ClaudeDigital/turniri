import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '../utils/api';
import { useToast } from '../components/Toast';
import MatchCard from '../components/MatchCard';
import { X, Save, ChevronDown } from 'lucide-react';

export default function Ndeshjet() {
  const [matches, setMatches] = useState([]);
  const [rounds, setRounds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ round_id: '', status: '' });
  const [editMatch, setEditMatch] = useState(null);
  const toast = useToast();

  const loadMatches = useCallback(() => {
    const params = new URLSearchParams();
    if (filter.round_id) params.append('round_id', filter.round_id);
    if (filter.status) params.append('status', filter.status);
    return apiFetch(`/matches?${params}`).then(setMatches);
  }, [filter]);

  useEffect(() => {
    Promise.all([loadMatches(), apiFetch('/rounds').then(setRounds)])
      .catch(e => toast.error(e.message))
      .finally(() => setLoading(false));
  }, [loadMatches]);

  const handleSaveResult = async (id, data) => {
    try {
      const updated = await apiFetch(`/matches/${id}`, { method: 'PUT', body: JSON.stringify(data) });
      setMatches(prev => prev.map(m => m.id === id ? updated : m));
      setEditMatch(null);
      toast.success('Rezultati u ruajt!');
    } catch (e) {
      toast.error(e.message);
    }
  };

  const completedRounds = rounds.filter(r => r.status !== 'pending');

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto">
      <h1 className="font-bebas text-3xl text-white tracking-wider mb-4">NDESHJET</h1>

      <div className="flex gap-2 mb-4">
        <div className="relative flex-1">
          <select
            value={filter.round_id}
            onChange={e => setFilter(f => ({ ...f, round_id: e.target.value }))}
            className="w-full bg-[#111] border border-[#222] text-gray-300 rounded-xl px-3 py-2 text-sm appearance-none focus:outline-none focus:border-amber-500/50"
          >
            <option value="">Të gjitha raundet</option>
            {completedRounds.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
          </select>
          <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
        </div>
        <div className="relative flex-1">
          <select
            value={filter.status}
            onChange={e => setFilter(f => ({ ...f, status: e.target.value }))}
            className="w-full bg-[#111] border border-[#222] text-gray-300 rounded-xl px-3 py-2 text-sm appearance-none focus:outline-none focus:border-amber-500/50"
          >
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
            <MatchCard key={m.id} match={m} onClick={() => setEditMatch(m)} />
          ))}
        </div>
      )}

      {editMatch && (
        <ResultModal
          match={editMatch}
          onClose={() => setEditMatch(null)}
          onSave={handleSaveResult}
        />
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
    const data = {
      home_score: homeScore !== '' ? parseInt(homeScore) : null,
      away_score: awayScore !== '' ? parseInt(awayScore) : null,
      home_pen: hasPen && homePen !== '' ? parseInt(homePen) : null,
      away_pen: hasPen && awayPen !== '' ? parseInt(awayPen) : null,
      match_date: matchDate || null,
      match_time: matchTime || null,
    };
    await onSave(match.id, data);
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div className="relative bg-[#111] border border-[#222] rounded-2xl w-full max-w-md p-5 animate-fade-in" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bebas text-xl text-white tracking-wide">FUT REZULTATIN</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
            <X size={20} />
          </button>
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
            <ScoreInput label="Pen. " value={homePen} onChange={setHomePen} />
            <span className="text-gray-500 font-bebas text-2xl mt-4">—</span>
            <ScoreInput label="Pen. " value={awayPen} onChange={setAwayPen} />
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
          <button onClick={onClose} className="flex-1 border border-[#333] text-gray-400 hover:text-white rounded-xl py-2.5 text-sm font-medium transition-all">
            Anulo
          </button>
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
      <input
        type="number"
        min="0"
        max="99"
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full bg-[#1a1a1a] border border-[#2a2a2a] text-white text-center font-bebas text-3xl rounded-xl px-2 py-2 focus:outline-none focus:border-amber-500/50"
        placeholder="0"
      />
    </div>
  );
}
