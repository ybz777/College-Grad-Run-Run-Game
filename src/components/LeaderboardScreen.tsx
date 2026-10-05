import { useMemo } from 'react';
import { Button, Panel } from './ui';
import { loadLeaderboard } from '../game/persistence/leaderboard';
import { formatMeters, formatScore } from '../game/utils/format';

interface Props {
  onBack: () => void;
}

export function LeaderboardScreen({ onBack }: Props) {
  const rows = useMemo(() => loadLeaderboard(), []);

  return (
    <div className="menu-shell">
      <Panel wide>
        <p className="eyebrow">JOBRUN 2026</p>
        <h2>LOCAL LEADERBOARD</h2>
        <p className="muted">Saved in this browser only. The cloud also rejected us.</p>
        {rows.length === 0 ? (
          <p className="empty">No survivors on record. The market remains unforgiving.</p>
        ) : (
          <ol className="board">
            {rows.map((row, index) => (
              <li key={`${row.name}-${row.date}-${index}`}>
                <span className="rank">{index + 1}</span>
                <span className="who">{row.name}</span>
                <span className="stat">{formatScore(row.score)}</span>
                <span className="stat dim">{formatMeters(row.distance)}</span>
              </li>
            ))}
          </ol>
        )}
        <Button onClick={onBack}>BACK</Button>
      </Panel>
    </div>
  );
}
