import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiFetch, LOGO_URL } from '../utils/api';
import { useToast } from '../components/Toast';
import MatchCard from '../components/MatchCard';
import { CalendarDays, GitBranch, Trophy, Clock, ChevronRight } from 'lucide-react';

export default function Ballina() {
  const [todayMatches, setTodayMatches] = useState([]);
  const [upcoming, setUpcoming] = useState([]);
  const [recent, setRecent] = useState([]);
  const [activeRound, setActiveRound] = useState(null);
  const [champion, setChampion] = useState(null);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  useEffect(() => {
    Promise.all([
      apiFetch('/matches/today'),
      apiFetch('/matches/upcoming'),
      apiFetch('/matches/recent'),
      apiFetch('/rounds/active'),
    ]).then(([today, up, rec, active]) => {
      setTodayMatches(today);
      setUpcoming(up);
      setRecent(rec);
      setActiveRound(active);
    }).catch(e => toast.error(e.message))
    .finally(() => setLoading(false));

    apiFetch('/teams').then(teams => {
      const champ = teams.find(t => t.status === 'kampion');
      setChampion(champ || null);
    }).catch(() => {});
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64 text-gray-500">Duke ngarkuar...</div>;

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <img src={LOGO_URL} alt="Logo" className="h-10 w-auto object-contain md:hidden" onError={e => e.target.style.display = 'none'} />
        <div>
          <h1 className="font-bebas text-2xl text-white tracking-wider">TURNIRI</h1>
          {activeRound && <p className="text-xs text-amber-400">{activeRound.name} · Aktiv</p>}
        </div>
      </div>

      {champion && (
        <div className="bg-gradient-to-r from-amber-500/20 to-amber-600/10 border border-amber-500/40 rounded-2xl p-4 mb-6 flex items-center gap-4">
          <span className="text-4xl">🏆</span>
          <div>
            <p className="text-xs text-amber-400 font-medium uppercase tracking-wider">Kampioni</p>
            <p className="text-xl font-bebas text-amber-300 tracking-wide">{champion.name}</p>
          </div>
        </div>
      )}

      {todayMatches.length > 0 ? (
        <Section title="Ndeshjet e Sotme" icon={<CalendarDays size={16} />}>
          {todayMatches.map(m => <MatchCard key={m.id} match={m} />)}
        </Section>
      ) : upcoming.length > 0 ? (
        <Section title="Ndeshjet e Ardhshme" icon={<Clock size={16} />}>
          {upcoming.slice(0, 5).map(m => <MatchCard key={m.id} match={m} />)}
        </Section>
      ) : (
        <div className="bg-[#111] border border-[#222] rounded-2xl p-8 text-center text-gray-500 mb-6">
          <CalendarDays size={32} className="mx-auto mb-3 opacity-40" />
          <p className="text-sm">Asnjë ndeshje e planifikuar</p>
        </div>
      )}

      {recent.length > 0 && (
        <Section title="Rezultatet e Fundit" icon={<Trophy size={16} />}>
          {recent.slice(0, 5).map(m => <MatchCard key={m.id} match={m} />)}
        </Section>
      )}

      <div className="grid grid-cols-2 gap-3 mt-6">
        <Link to="/bracket" className="bg-[#111] border border-[#222] hover:border-amber-500/40 rounded-xl p-4 flex items-center justify-between group transition-all">
          <div>
            <GitBranch size={20} className="text-amber-400 mb-1" />
            <p className="text-sm font-semibold text-white">Bracket</p>
            <p className="text-xs text-gray-500">Shiko tabelën</p>
          </div>
          <ChevronRight size={16} className="text-gray-600 group-hover:text-amber-400 transition-colors" />
        </Link>
        <Link to="/ndeshjet" className="bg-[#111] border border-[#222] hover:border-amber-500/40 rounded-xl p-4 flex items-center justify-between group transition-all">
          <div>
            <CalendarDays size={20} className="text-blue-400 mb-1" />
            <p className="text-sm font-semibold text-white">Ndeshjet</p>
            <p className="text-xs text-gray-500">Të gjitha</p>
          </div>
          <ChevronRight size={16} className="text-gray-600 group-hover:text-blue-400 transition-colors" />
        </Link>
      </div>
    </div>
  );
}

function Section({ title, icon, children }) {
  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-amber-400">{icon}</span>
        <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">{title}</h2>
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}
