import type { HudState } from '../game/data/types';
import { formatMeters, formatMoney, formatScore, formatYears } from '../game/utils/format';

interface Props {
  hud: HudState | null;
  marketName: string;
  onPause: () => void;
}

export function HUD({ hud, marketName, onPause }: Props) {
  return (
    <div className="hud">
      <div className="hud-card left">
        <div>
          <span>DISTANCE</span>
          <strong>{formatMeters(hud?.distance ?? 0)}</strong>
        </div>
        <div>
          <span>SCORE</span>
          <strong>{formatScore(hud?.score ?? 0)}</strong>
        </div>
        {hud && hud.combo >= 2 ? <div className="combo">STREAK ×{hud.combo}</div> : null}
        <div className="buffs">
          {hud?.invincible ? <span className="buff gold">REFERRAL</span> : null}
          {hud?.coffee ? <span className="buff mint">COFFEE</span> : null}
          {hud?.aiReady ? <span className="buff mint">AI</span> : null}
          {hud?.atsBoss ? <span className="buff red">ATS</span> : null}
        </div>
      </div>
      <div className="hud-center">
        <div className="market-pill">{marketName}</div>
        <div className="clock-pill">
          <b>{hud?.clock ?? '8:03 AM'}</b>
          <span>{hud?.clockLine ?? 'TIME TO APPLY'}</span>
        </div>
      </div>
      <div className="hud-card right">
        <button type="button" className="pause-btn" onClick={onPause} aria-label="Pause">
          PAUSE
        </button>
        <div>
          <span>EXPERIENCE</span>
          <strong>{formatYears(hud?.experience ?? 0)}</strong>
        </div>
        <div className="mini">
          <span>APPS {hud?.applications ?? 0}</span>
          <span>REJECTIONS {hud?.rejections ?? 0}</span>
        </div>
        <div>
          <span>STUDENT DEBT</span>
          <strong className="debt">{formatMoney(hud?.debt ?? 0)}</strong>
        </div>
      </div>
    </div>
  );
}
