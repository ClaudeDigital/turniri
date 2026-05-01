export default function MatchCard({ match, onClick, compact = false }) {
  if (match.is_bye) {
    return (
      <div className="bg-[#111] border border-[#222] rounded-xl p-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: match.home_team_color || '#3b82f6' }} />
          <span className="text-sm font-medium text-gray-300">{match.home_team_name}</span>
        </div>
        <span className="text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
          Kalon Automatikisht
        </span>
      </div>
    );
  }

  const isPlayed = match.status === 'perfunduar';
  const isHomeWinner = isPlayed && match.winner_id === match.home_team_id;
  const isAwayWinner = isPlayed && match.winner_id === match.away_team_id;

  return (
    <div
      onClick={onClick}
      className={`bg-[#111] border rounded-xl overflow-hidden transition-all ${
        onClick ? 'cursor-pointer hover:border-amber-500/40 hover:bg-[#151515] active:scale-[0.99]' : ''
      } ${isPlayed ? 'border-[#1f1f1f]' : 'border-[#222]'}`}
    >
      <div className="p-3">
        <div className="flex items-center gap-2 mb-2.5">
          <span className="text-xs text-gray-500">
            {match.round_name || ''}
            {match.match_date && ` · ${new Date(match.match_date + 'T00:00:00').toLocaleDateString('sq-AL', { day: 'numeric', month: 'short' })}`}
            {match.match_time && ` ${match.match_time}`}
          </span>
          {match.is_third_place ? (
            <span className="ml-auto text-xs text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-full">3. Vendi</span>
          ) : null}
        </div>

        <div className="flex items-center gap-3">
          <TeamRow name={match.home_team_name} color={match.home_team_color} winner={isHomeWinner} />
          <div className="shrink-0 text-center min-w-[52px]">
            {isPlayed ? (
              <div className="flex items-center justify-center gap-1">
                <span className={`font-bebas text-2xl leading-none ${isHomeWinner ? 'text-amber-400' : 'text-gray-300'}`}>
                  {match.home_score}
                </span>
                <span className="text-gray-600 font-bebas text-lg">-</span>
                <span className={`font-bebas text-2xl leading-none ${isAwayWinner ? 'text-amber-400' : 'text-gray-300'}`}>
                  {match.away_score}
                </span>
              </div>
            ) : (
              <span className="text-gray-500 font-bebas text-xl">VS</span>
            )}
            {isPlayed && (match.home_pen != null || match.away_pen != null) && (
              <div className="text-xs text-gray-500 mt-0.5">
                ({match.home_pen} - {match.away_pen}) p.
              </div>
            )}
          </div>
          <TeamRow name={match.away_team_name} color={match.away_team_color} winner={isAwayWinner} right />
        </div>
      </div>

      {!isPlayed && onClick && (
        <div className="px-3 pb-2">
          <span className="text-xs text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full">Fut rezultatin</span>
        </div>
      )}
    </div>
  );
}

function TeamRow({ name, color, winner, right }) {
  return (
    <div className={`flex items-center gap-2 flex-1 min-w-0 ${right ? 'flex-row-reverse' : ''}`}>
      <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: color || '#3b82f6' }} />
      <span className={`text-sm font-medium truncate ${winner ? 'text-amber-400' : 'text-gray-200'}`}>{name}</span>
      {winner && <span className="text-amber-400 text-xs shrink-0">🏆</span>}
    </div>
  );
}
