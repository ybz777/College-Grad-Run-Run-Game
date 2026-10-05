import { ACHIEVEMENTS } from '../data/copy';
import type { AchievementDef, RunStats } from '../data/types';

const KEY = 'jobrun2026.achievements';

export function loadUnlocked(): string[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as string[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveUnlocked(ids: string[]): void {
  localStorage.setItem(KEY, JSON.stringify(ids));
}

export function unlockAchievement(id: string): boolean {
  const current = loadUnlocked();
  if (current.includes(id)) return false;
  saveUnlocked([...current, id]);
  return true;
}

export function evaluateAchievements(
  stats: RunStats,
  extras: { atsDodges: number; referrals: number; interviewed: boolean },
): AchievementDef[] {
  const checks: Array<[string, boolean]> = [
    ['first_app', stats.applications >= 1],
    ['overqualified', stats.distance >= 1000],
    ['underqualified', stats.rejections >= 10],
    ['networking_works', extras.referrals >= 10],
    ['ats_survivor', extras.atsDodges >= 10],
    ['interview_champion', extras.interviewed],
    ['touch_grass', stats.distance >= 10000],
    ['somehow_hired', extras.interviewed],
    ['unemployable', stats.rejections >= 50],
    ['impossible', stats.distance >= 22000],
  ];
  const fresh: AchievementDef[] = [];
  for (const [id, ok] of checks) {
    if (!ok) continue;
    if (unlockAchievement(id)) {
      const def = ACHIEVEMENTS.find((row) => row.id === id);
      if (def) fresh.push(def);
    }
  }
  return fresh;
}
