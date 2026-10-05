import { useMemo, useState } from 'react';
import { AchievementsScreen } from './components/AchievementsScreen';
import { GameView } from './components/GameView';
import { HowToPlay } from './components/HowToPlay';
import { LeaderboardScreen } from './components/LeaderboardScreen';
import { MainMenu } from './components/MainMenu';
import { SettingsScreen } from './components/SettingsScreen';
import type { GameSettings, Screen } from './game/data/types';
import { getDailyMarket } from './game/persistence/dailyMarket';
import { loadSettings, saveSettings } from './game/persistence/settings';
import './styles/app.css';

export default function App() {
  const [screen, setScreen] = useState<Screen>('menu');
  const [settings, setSettings] = useState<GameSettings>(() => loadSettings());
  const market = useMemo(() => getDailyMarket(), []);

  const updateSettings = (next: GameSettings) => {
    setSettings(next);
    saveSettings(next);
  };

  return (
    <div className="app-root">
      {screen === 'menu' ? (
        <MainMenu
          market={market}
          onStart={() => setScreen('playing')}
          onHowTo={() => setScreen('howto')}
          onLeaderboard={() => setScreen('leaderboard')}
          onSettings={() => setScreen('settings')}
          onAchievements={() => setScreen('achievements')}
        />
      ) : null}
      {screen === 'howto' ? <HowToPlay onBack={() => setScreen('menu')} /> : null}
      {screen === 'leaderboard' ? <LeaderboardScreen onBack={() => setScreen('menu')} /> : null}
      {screen === 'achievements' ? <AchievementsScreen onBack={() => setScreen('menu')} /> : null}
      {screen === 'settings' ? (
        <SettingsScreen
          settings={settings}
          onChange={updateSettings}
          onBack={() => setScreen('menu')}
        />
      ) : null}
      {screen === 'playing' ? (
        <GameView settings={settings} market={market} onMenu={() => setScreen('menu')} />
      ) : null}
    </div>
  );
}
