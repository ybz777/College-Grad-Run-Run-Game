import { useEffect, useMemo, useRef, useState } from 'react';
import * as Phaser from 'phaser';
import { GameBus } from '../game/bus';
import { createJobRunGame } from '../game/createGame';
import { Sfx } from '../game/audio/sfx';
import type {
  DailyMarket,
  GameEvent,
  GameSettings,
  HudState,
  InterviewQuestion,
  RunStats,
} from '../game/data/types';
import { qualifiesForBoard, saveScore } from '../game/persistence/leaderboard';
import { InputQueue } from '../game/systems/InputQueue';
import { RunBridge } from '../game/systems/RunBridge';
import { AtsOverlay } from './AtsOverlay';
import { GameOverScreen } from './GameOverScreen';
import { HUD } from './HUD';
import { InterviewModal } from './InterviewModal';
import { PauseMenu } from './PauseMenu';
import { ToastStack } from './ToastStack';
import { TouchLayer } from './TouchLayer';

interface Props {
  settings: GameSettings;
  market: DailyMarket;
  onMenu: () => void;
}

export function GameView({ settings, market, onMenu }: Props) {
  const hostRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Phaser.Game | null>(null);
  const input = useMemo(() => new InputQueue(), []);
  const bus = useMemo(() => new GameBus(), []);
  const sfx = useMemo(() => new Sfx(), []);
  const bridge = useMemo(() => new RunBridge(), []);
  const [hud, setHud] = useState<HudState | null>(null);
  const [paused, setPaused] = useState(false);
  const [interview, setInterview] = useState<InterviewQuestion | null>(null);
  const [over, setOver] = useState<RunStats | null>(null);
  const [ats, setAts] = useState<'scan' | 'skills' | 'clear' | null>(null);
  const [failSkill, setFailSkill] = useState('Kubernetes');
  const [toasts, setToasts] = useState<GameEvent[]>([]);
  const [saved, setSaved] = useState(false);
  const [runKey, setRunKey] = useState(0);

  sfx.muted = settings.muted;

  useEffect(() => {
    if (!hostRef.current) return;
    sfx.ensure();
    const game = createJobRunGame(
      hostRef.current,
      bus,
      input,
      sfx,
      settings.shake,
      settings.character,
      bridge,
    );
    gameRef.current = game;
    return () => {
      game.destroy(true);
      gameRef.current = null;
    };
  }, [bus, input, sfx, settings.shake, settings.character, bridge, runKey]);

  useEffect(() => {
    return bus.on((event) => {
      if (event.type === 'toast' || event.type === 'achievement') {
        setToasts((current) => [...current.slice(-8), event]);
      }
      if (event.type === 'hud') setHud(event.state);
      if (event.type === 'ats') {
        setAts(event.phase);
        if (event.failSkill) setFailSkill(event.failSkill);
      }
      if (event.type === 'interview') {
        setInterview(event.phase === 'start' && event.question ? event.question : null);
      }
      if (event.type === 'gameover') setOver(event.stats);
    });
  }, [bus]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.repeat) return;
      const key = e.key.toLowerCase();
      if (interview) {
        if (key === 'a' || key === '1') bridge.interviewChoice = 0;
        if (key === 'b' || key === '2') bridge.interviewChoice = 1;
        if (key === 'c' || key === '3') bridge.interviewChoice = 2;
        return;
      }
      const gameKey =
        key === 'a' ||
        key === 'd' ||
        key === 'w' ||
        key === 's' ||
        key === 'arrowleft' ||
        key === 'arrowright' ||
        key === 'arrowup' ||
        key === 'arrowdown' ||
        key === ' ' ||
        key === 'escape';
      if (gameKey) e.preventDefault();
      if (key === 'escape') {
        togglePause();
        return;
      }
      if (paused || over) return;
      if (key === 'a' || key === 'arrowleft') input.moveLeft();
      if (key === 'd' || key === 'arrowright') input.moveRight();
      if (key === 'w' || key === 'arrowup' || key === ' ') input.doJump();
      if (key === 's' || key === 'arrowdown') input.doSlide();
    };
    window.addEventListener('keydown', onKey, { passive: false });
    return () => window.removeEventListener('keydown', onKey);
  }, [input, paused, interview, over, bridge]);

  const togglePause = () => {
    if (over || interview) return;
    const scenePlugin = gameRef.current?.scene;
    if (!scenePlugin) return;
    if (paused) {
      scenePlugin.resume('GameScene');
      setPaused(false);
    } else {
      scenePlugin.pause('GameScene');
      setPaused(true);
    }
  };

  const restart = () => {
    setOver(null);
    setPaused(false);
    setInterview(null);
    setAts(null);
    setHud(null);
    setSaved(false);
    setToasts([]);
    input.clear();
    bridge.reset();
    setRunKey((value) => value + 1);
  };

  const saveName = (name: string) => {
    if (!over) return;
    saveScore({
      name,
      score: Math.floor(over.score),
      distance: Math.floor(over.distance),
      date: new Date().toISOString(),
    });
    setSaved(true);
  };

  const playing = !paused && !interview && !over;

  return (
    <div className="game-shell">
      <div className="game-stage">
        <div className="phaser-host" ref={hostRef} />
        <HUD hud={hud} marketName={market.name} onPause={togglePause} />
        <ToastStack events={toasts} />
        <AtsOverlay phase={ats} failSkill={failSkill} skills={hud?.skills} />
        <TouchLayer input={input} enabled={playing} />
        {paused ? <PauseMenu onResume={togglePause} onMenu={onMenu} /> : null}
        {interview ? (
          <InterviewModal question={interview} onPick={(i) => { bridge.interviewChoice = i; }} />
        ) : null}
        {over ? (
          <GameOverScreen
            stats={over}
            onAgain={restart}
            onMenu={onMenu}
            needsName={!saved && qualifiesForBoard(over.score)}
            onSave={saveName}
          />
        ) : null}
      </div>
    </div>
  );
}
