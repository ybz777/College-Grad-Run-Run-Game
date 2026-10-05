import { Button, Panel } from './ui';
import { ACHIEVEMENTS } from '../game/data/copy';
import { loadUnlocked } from '../game/persistence/achievements';

interface Props {
  onBack: () => void;
}

export function AchievementsScreen({ onBack }: Props) {
  const unlocked = new Set(loadUnlocked());
  return (
    <div className="menu-shell">
      <Panel wide>
        <p className="eyebrow">CAREER MILESTONES</p>
        <h2>ACHIEVEMENTS</h2>
        <ul className="achieve-list">
          {ACHIEVEMENTS.map((row) => (
            <li key={row.id} className={unlocked.has(row.id) ? 'on' : ''}>
              <strong>{unlocked.has(row.id) ? row.title : 'LOCKED'}</strong>
              <span>{row.blurb}</span>
            </li>
          ))}
        </ul>
        <Button onClick={onBack}>BACK</Button>
      </Panel>
    </div>
  );
}
