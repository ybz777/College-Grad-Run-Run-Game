import { useEffect, useState } from 'react';
import { Button, Panel } from './ui';
import type { DailyMarket } from '../game/data/types';
import { formatMarketDate } from '../game/persistence/dailyMarket';

interface Props {
  market: DailyMarket;
  onStart: () => void;
  onHowTo: () => void;
  onLeaderboard: () => void;
  onSettings: () => void;
  onAchievements: () => void;
}

const BOOT = [
  'CONNECTING TO JOB MARKET...',
  'CHECKING QUALIFICATIONS...',
  'VERIFYING EXPERIENCE...',
  'NO EXPERIENCE FOUND.',
  'APPLICATION SUBMITTED.',
];

export function MainMenu({
  market,
  onStart,
  onHowTo,
  onLeaderboard,
  onSettings,
  onAchievements,
}: Props) {
  const [boot, setBoot] = useState(0);
  const ready = boot >= BOOT.length;

  useEffect(() => {
    if (ready) return;
    const id = window.setTimeout(() => setBoot((n) => n + 1), 420);
    return () => window.clearTimeout(id);
  }, [boot, ready]);

  return (
    <div className="menu-shell">
      <div className="skyline" aria-hidden="true" />
      <div className="ticker">
        <div className="ticker-track">
          HIRING FREEZE ANNOUNCED — ENTRY LEVEL REQUIRES 5 YEARS — SALARY: COMPETITIVE — RETURN TO
          OFFICE MANDATORY — POSITION ELIMINATED — WE ARE HIRING — PLEASE REAPPLY — ATS REJECTED
          FOR MISSING KUBERNETES — NO EXPERIENCE REQUIRED* — *EXPERIENCE REQUIRED — HIRING FREEZE
          ANNOUNCED — ENTRY LEVEL REQUIRES 5 YEARS — SALARY: COMPETITIVE — RETURN TO OFFICE
          MANDATORY — POSITION ELIMINATED — WE ARE HIRING — PLEASE REAPPLY — ATS REJECTED FOR
          MISSING KUBERNETES — NO EXPERIENCE REQUIRED* — *EXPERIENCE REQUIRED —
        </div>
      </div>
      <Panel>
        {!ready ? (
          <div className="boot">
            <p className="eyebrow">JOBRUN 2026</p>
            {BOOT.slice(0, boot + 1).map((line) => (
              <p key={line} className="boot-line">
                {line}
              </p>
            ))}
          </div>
        ) : (
          <>
            <p className="eyebrow">LOCAL LABOR SIMULATION</p>
            <h1 className="title">
              JOBRUN
              <span>2026</span>
            </h1>
            <p className="tagline">No Experience Required*</p>
            <p className="asterisk">*Experience required.</p>
            <div className="market-chip">
              <span>TODAY — {formatMarketDate()}</span>
              <strong>{market.name}</strong>
              <em>{market.blurb}</em>
            </div>
            <div className="btn-col">
              <Button onClick={onStart}>START RUN</Button>
              <Button variant="ghost" onClick={onHowTo}>
                HOW TO PLAY
              </Button>
              <Button variant="ghost" onClick={onAchievements}>
                ACHIEVEMENTS
              </Button>
              <Button variant="ghost" onClick={onLeaderboard}>
                LEADERBOARD
              </Button>
              <Button variant="ghost" onClick={onSettings}>
                SETTINGS
              </Button>
            </div>
          </>
        )}
      </Panel>
    </div>
  );
}
