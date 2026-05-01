import { useState, useEffect } from 'react';
import { apiFetch } from '../utils/api';
import { useToast } from '../components/Toast';
import MatchCard from '../components/MatchCard';
import { ChevronDown, ChevronRight, Trophy } from 'lucide-react';

export default function Bracket() {
  const [rounds, setRounds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState({});
  const toast = useToast();

  useEffect(() => {
    apiFetch('/rounds')
      .then(data => {
        setRounds(data);
        const exp = {};
        data.forEach(r => { exp[r.id] = r.status === 'aktiv' || r.status === 'pending'; });
        setExpanded(exp);
      })
      .catch(e => toast.error(e.message))
      .finally(() => setLoading(false));
  }, []);

  const toggle = (id) => setExpanded(prev => ({ ...prev, [id]: !prev[id] }));

  if (loading) return <div className="flex items-center justify-center h-64 text-gray-500">Duke ngarkuar...</div>;

  if (!rounds.length) return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto text-center pt-16">
      <Trophy size={48} className="mx-auto mb-4 text-gray-600" />
      <p className="text-gray-400 font-semibold">Bracket-i është bosh</p>
      <p className="text-gray-600 text-sm mt-1">Nuk janë tërhequr ende raundet</p>
    </div>
  );

  const finalRound = rounds.find(r => r.name === 'Finalja');
  const champion = finalRound?.matches?.find(m => m.winner_id && !m.is_third_place)?.winner_name;

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto">
      <h1 className="font-bebas text-3xl text-white tracking-wider mb-6">BRACKET</h1>

      {champion && (
        <div className="bg-gradient-to-r from-amber-500/20 to-amber-600/10 border border-amber-500/40 rounded-2xl p-4 mb-6 flex items-center gap-4 animate-fade-in">
          <span className="text-4xl">🏆</span>
          <div>
            <p className="text-xs text-amber-400 font-medium uppercase tracking-wider">Kampioni</p>
            <p className="text-2xl font-bebas text-amber-300 tracking-wider">{champion}</p>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {rounds.map(round => {
          const regularMatches = round.matches.filter(m => !m.is_third_place && !m.is_bye);
          const thirdPlaceMatch = round.matches.find(m => m.is_third_place);
          const byeMatches = round.matches.filter(m => m.is_bye);
          const isActive = round.status === 'aktiv';
          const isPending = round.status === 'pending';
          const isCompleted = round.status === 'perfunduar';

          return (
            <div key={round.id} className={`bg-[#111] border rounded-2xl overflow-hidden ${
              isActive ? 'border-amber-500/40' : isPending ? 'border-blue-500/30' : 'border-[#222]'
            }`}>
              <button
                onClick={() => toggle(round.id)}
                className="w-full flex items-center justify-between p-4 text-left"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${
                    isActive ? 'bg-emerald-400 shadow-emerald-400/50 shadow-sm' :
                    isPending ? 'bg-blue-400' :
                    isCompleted ? 'bg-gray-600' : 'bg-gray-700'
                  }`} />
                  <span className="font-bebas text-lg tracking-wide text-white">{round.name.toUpperCase()}</span>
                  {isPending && <span className="text-xs text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/20">Pritje</span>}
                  {isActive && <span className="text-xs text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">Aktiv</span>}
                </div>
                <div className="flex items-center gap-3">
                  {(round.start_date || round.end_date) && (
                    <span className="text-xs text-gray-500 hidden sm:block">
                      {round.start_date} {round.end_date && `→ ${round.end_date}`}
                    </span>
                  )}
                  {expanded[round.id] ? <ChevronDown size={16} className="text-gray-400" /> : <ChevronRight size={16} className="text-gray-400" />}
                </div>
              </button>

              {expanded[round.id] && (
                <div className="px-4 pb-4 space-y-2 animate-fade-in">
                  {regularMatches.map(m => <MatchCard key={m.id} match={m} />)}
                  {thirdPlaceMatch && (
                    <div className="mt-3">
                      <p className="text-xs text-purple-400 uppercase tracking-wider mb-2 font-semibold">Ndeshja për Vendin e 3-të</p>
                      <MatchCard match={thirdPlaceMatch} />
                    </div>
                  )}
                  {byeMatches.length > 0 && (
                    <div className="mt-2">
                      <p className="text-xs text-gray-600 uppercase tracking-wider mb-1.5">Avancim automatik</p>
                      {byeMatches.map(m => <MatchCard key={m.id} match={m} />)}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
