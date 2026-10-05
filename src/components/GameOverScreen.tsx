import { Button, Panel } from './ui';
import type { RunStats } from '../game/data/types';
import { formatMeters, formatMoney, formatScore, formatYears } from '../game/utils/format';

interface Props {
  stats: RunStats;
  onAgain: () => void;
  onMenu: () => void;
  onSave?: (name: string) => void;
  needsName?: boolean;
}

export function GameOverScreen({ stats, onAgain, onMenu, onSave, needsName }: Props) {
  return (
    <div className="overlay">
      <Panel wide>
        <p className="eyebrow">JOBRUN 2026</p>
        <h2>YOU SURVIVED</h2>
        <p className="survived">{formatMeters(stats.distance)}</p>
        <p className="muted">FINAL SCORE {formatScore(stats.score)}</p>
        <p className="eyebrow">CAREER SUMMARY</p>
        <div className="stats-grid">
          <div>
            <span>EXPERIENCE</span>
            <strong>{formatYears(stats.experience)}</strong>
          </div>
          <div>
            <span>APPLICATIONS</span>
            <strong>{stats.applications}</strong>
          </div>
          <div>
            <span>INTERVIEWS</span>
            <strong>{stats.interviews}</strong>
          </div>
          <div>
            <span>REJECTIONS</span>
            <strong>{stats.rejections}</strong>
          </div>
          <div>
            <span>REFERRALS</span>
            <strong>{stats.referrals}</strong>
          </div>
          <div>
            <span>NEAR MISSES</span>
            <strong>{stats.nearMisses}</strong>
          </div>
          <div>
            <span>STUDENT DEBT</span>
            <strong>{formatMoney(stats.debt)}</strong>
          </div>
        </div>
        <div className="decision">
          <p>FINAL STATUS</p>
          <strong className="stamp">POSITION ELIMINATED</strong>
          <p className="cause">CAUSE: {stats.cause}</p>
        </div>
        {needsName && onSave ? <NameForm onSave={onSave} /> : null}
        <div className="btn-row">
          <Button onClick={onAgain}>RUN AGAIN</Button>
          <Button variant="ghost" onClick={onMenu}>
            MAIN MENU
          </Button>
        </div>
      </Panel>
    </div>
  );
}

function NameForm({ onSave }: { onSave: (name: string) => void }) {
  return (
    <form
      className="name-form"
      onSubmit={(event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        const name = String(data.get('name') || '').trim() || 'unemployed_dev';
        onSave(name.slice(0, 18));
      }}
    >
      <label>
        NEW HIGH SCORE
        <input name="name" maxLength={18} placeholder="unemployed_dev" autoComplete="off" />
      </label>
      <Button type="submit">SAVE TO BOARD</Button>
    </form>
  );
}
