import { Button, Panel } from './ui';
import { CHARACTERS } from '../game/data/characters';
import type { GameSettings } from '../game/data/types';
import { clearLeaderboard } from '../game/persistence/leaderboard';

interface Props {
  settings: GameSettings;
  onChange: (settings: GameSettings) => void;
  onBack: () => void;
}

export function SettingsScreen({ settings, onChange, onBack }: Props) {
  return (
    <div className="menu-shell">
      <Panel wide>
        <p className="eyebrow">HR PORTAL</p>
        <h2>SETTINGS</h2>
        <label className="toggle">
          <input
            type="checkbox"
            checked={!settings.muted}
            onChange={(e) => onChange({ ...settings, muted: !e.target.checked })}
          />
          <span>Sound effects</span>
        </label>
        <label className="toggle">
          <input
            type="checkbox"
            checked={settings.shake}
            onChange={(e) => onChange({ ...settings, shake: e.target.checked })}
          />
          <span>Camera shake</span>
        </label>
        <p className="eyebrow">CANDIDATE</p>
        <div className="char-grid">
          {CHARACTERS.map((row) => (
            <button
              key={row.id}
              type="button"
              className={`char-card${settings.character === row.id ? ' on' : ''}`}
              onClick={() => onChange({ ...settings, character: row.id })}
            >
              <strong>{row.name}</strong>
              <span>{row.blurb}</span>
            </button>
          ))}
        </div>
        <Button
          variant="danger"
          onClick={() => {
            clearLeaderboard();
          }}
        >
          CLEAR LEADERBOARD
        </Button>
        <Button variant="ghost" onClick={onBack}>
          BACK
        </Button>
      </Panel>
    </div>
  );
}
