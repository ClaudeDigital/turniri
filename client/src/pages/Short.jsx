import { useState, useEffect } from 'react';
import { apiFetch } from '../utils/api';
import { useToast } from '../components/Toast';
import { Shuffle, Check, RotateCcw, Calendar, Users, ChevronRight, AlertCircle } from 'lucide-react';

export default function Short() {
  const [rounds, setRounds] = useState([]);
  const [activeRound, setActiveRound] = useState(null);
  const [pendingRound, setPendingRound] = useState(null);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [drawing, setDrawing] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [editDates, setEditDates] = useState({});
  const toast = useToast();

  const loadData = async () => {
    const [rds, tms] = await Promise.all([apiFetch('/rounds'), apiFetch('/teams')]);
    setRounds(rds);
    setTeams(tms);
    const active = rds.find(r => r.status === 'aktiv') || null;
    const pending = rds.find(r => r.status === 'pending') || null;
    setActiveRound(active);
    setPendingRound(pending);
  };

  useEffect(() => {
    loadData().catch(e => toast.error(e.message)).finally(() => setLoading(false));
  }, []);

  const handleDraw = async () => {
    setDrawing(true);
    try {
      const result = await apiFetch('/rounds/draw', { method: 'POST' });
      await loadData();
      toast.success(`Shorti u tërhoq: ${result.round.name}`);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setDrawing(false);
    }
  };

  const handleConfirm = async () => {
    if (!pendingRound) return;
    setConfirming(true);
    try {
      await apiFetch(`/rounds/${pendingRound.id}/confirm`, { method: 'POST' });
      await loadData();
      toast.success('Shorti u konfirmua!');
    } catch (e) {
      toast.error(e.message);
    } finally {
      setConfirming(false);
    }
  };

  const handleRedraw = async () => {
    if (!pendingRound) return;
    if (!confirm('Fshi shortin aktual dhe tërhiq ri?')) return;
    try {
      await apiFetch(`/rounds/${pendingRound.id}`, { method: 'DELETE' });
      await loadData();
      toast.info('Shorti u fshi. Mund të tërhiqet ri.');
    } catch (e) {
      toast.error(e.message);
    }
  };

  const handleSaveDates = async (roundId) => {
    const { start_date, end_date } = editDates[roundId] || {};
    try {
      await apiFetch(`/rounds/${roundId}`, { method: 'PUT', body: JSON.stringify({ start_date, end_date }) });
      await loadData();
      toast.success('Datat u ruajtën');
    } catch (e) {
      toast.error(e.message);
    }
  };

  const activeTeams = teams.filter(t => t.status === 'aktiv');
  const allDone = activeRound ? activeRound.matches.every(m => m.status === 'perfunduar') : true;
  const canDraw = !pendingRound && allDone;

  if (loading) return <div className="flex items-center justify-center h-64 text-gray-500">Duke ngarkuar...</div>;

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto">
      <h1 className="font-bebas text-3xl text-white tracking-wider mb-6">SHORT</h1>

      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="bg-[#111] border border-[#222] rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1 text-gray-500 text-xs uppercase tracking-wider">
            <Users size={14} /> Ekipe Aktive
          </div>
          <p className="font-bebas text-3xl text-white">{activeTeams.length}</p>
        </div>
        <div className="bg-[#111] border border-[#222] rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1 text-gray-500 text-xs uppercase tracking-wider">
            <Shuffle size={14} /> Raundi
          </div>
          <p className="font-bebas text-3xl text-white">{activeRound?.name || '—'}</p>
        </div>
      </div>

      {activeRound && !allDone && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 mb-4 flex items-start gap-2">
          <AlertCircle size={16} className="text-amber-400 mt-0.5 shrink-0" />
          <p className="text-sm text-amber-300">
            Ka ndeshje të papërfunduara në raund aktual. Plotëso rezultatet para se të tërhiqësh shortin.
          </p>
        </div>
      )}

      {pendingRound && (
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-2xl p-4 mb-6 animate-fade-in">
          <h3 className="font-bebas text-xl text-white tracking-wide mb-3">
            PREVIEW: {pendingRound.name.toUpperCase()}
          </h3>
          <div className="space-y-2 mb-4">
            {pendingRound.matches?.map(m => (
              <div key={m.id} className="flex items-center gap-2 bg-[#1a1a1a] rounded-xl px-3 py-2.5">
                {m.is_bye ? (
                  <>
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: m.home_team_color || '#3b82f6' }} />
                    <span className="text-sm text-gray-300 flex-1">{m.home_team_name}</span>
                    <span className="text-xs text-emerald-400">Kalon Automatikisht</span>
                  </>
                ) : (
                  <>
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: m.home_team_color || '#3b82f6' }} />
                    <span className="text-sm text-gray-200 flex-1">{m.home_team_name}</span>
                    <span className="text-gray-500 font-bebas">VS</span>
                    <span className="text-sm text-gray-200 flex-1 text-right">{m.away_team_name}</span>
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: m.away_team_color || '#ef4444' }} />
                  </>
                )}
              </div>
            ))}
          </div>

          <div className="mb-4">
            <p className="text-xs text-gray-500 mb-2">Cakto datat e raundeve:</p>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-gray-600">Fillimi</label>
                <input type="date"
                  value={editDates[pendingRound.id]?.start_date || pendingRound.start_date || ''}
                  onChange={e => setEditDates(prev => ({ ...prev, [pendingRound.id]: { ...prev[pendingRound.id], start_date: e.target.value } }))}
                  className="w-full mt-1 bg-[#1a1a1a] border border-[#2a2a2a] text-gray-300 rounded-xl px-3 py-1.5 text-sm focus:outline-none focus:border-blue-500/50"
                />
              </div>
              <div>
                <label className="text-xs text-gray-600">Mbarimi</label>
                <input type="date"
                  value={editDates[pendingRound.id]?.end_date || pendingRound.end_date || ''}
                  onChange={e => setEditDates(prev => ({ ...prev, [pendingRound.id]: { ...prev[pendingRound.id], end_date: e.target.value } }))}
                  className="w-full mt-1 bg-[#1a1a1a] border border-[#2a2a2a] text-gray-300 rounded-xl px-3 py-1.5 text-sm focus:outline-none focus:border-blue-500/50"
                />
              </div>
            </div>
            <button onClick={() => handleSaveDates(pendingRound.id)}
              className="mt-2 text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1">
              <Calendar size={12} /> Ruaj datat
            </button>
          </div>

          <div className="flex gap-2">
            <button onClick={handleRedraw}
              className="flex items-center gap-1.5 px-4 py-2.5 border border-[#333] text-gray-400 hover:text-white rounded-xl text-sm transition-all">
              <RotateCcw size={14} />
              Ri-tërheq
            </button>
            <button onClick={handleConfirm} disabled={confirming}
              className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold rounded-xl py-2.5 text-sm transition-all">
              <Check size={16} />
              {confirming ? 'Duke konfirmuar...' : 'Konfirmo Shortin'}
            </button>
          </div>
        </div>
      )}

      {!pendingRound && (
        <button
          onClick={handleDraw}
          disabled={drawing || !canDraw}
          className="w-full flex items-center justify-center gap-3 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:cursor-not-allowed text-black font-bold rounded-2xl py-4 text-lg font-bebas tracking-wider transition-all active:scale-95 mb-6"
        >
          <Shuffle size={22} />
          {drawing ? 'Duke tërhequr...' : 'Tërheq Short'}
        </button>
      )}

      {rounds.filter(r => r.status !== 'pending').length > 0 && (
        <div>
          <p className="text-xs text-gray-600 uppercase tracking-wider font-semibold mb-2">Historia e Raundeve</p>
          <div className="space-y-2">
            {rounds.filter(r => r.status !== 'pending').map(r => (
              <div key={r.id} className="bg-[#111] border border-[#1a1a1a] rounded-xl px-4 py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-white">{r.name}</p>
                  {(r.start_date || r.end_date) && (
                    <p className="text-xs text-gray-500">{r.start_date} {r.end_date && `→ ${r.end_date}`}</p>
                  )}
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full border ${
                  r.status === 'aktiv' ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' :
                  r.status === 'perfunduar' ? 'text-gray-500 bg-gray-500/10 border-gray-500/20' :
                  'text-gray-400 bg-gray-500/10 border-gray-500/20'
                }`}>
                  {r.status === 'aktiv' ? 'Aktiv' : r.status === 'perfunduar' ? 'Përfunduar' : r.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
