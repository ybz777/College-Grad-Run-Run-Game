import { LEADERBOARD_KEY, LEADERBOARD_SIZE } from '../data/constants';
import type { LeaderboardEntry } from '../data/types';

function read(): LeaderboardEntry[] {
  try {
    const raw = localStorage.getItem(LEADERBOARD_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as LeaderboardEntry[];
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (row) =>
          row &&
          typeof row.name === 'string' &&
          typeof row.score === 'number' &&
          typeof row.distance === 'number',
      )
      .sort((a, b) => b.score - a.score)
      .slice(0, LEADERBOARD_SIZE);
  } catch {
    return [];
  }
}

function write(entries: LeaderboardEntry[]): void {
  localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(entries));
}

export function loadLeaderboard(): LeaderboardEntry[] {
  return read();
}

export function qualifiesForBoard(score: number): boolean {
  const board = read();
  if (board.length < LEADERBOARD_SIZE) return score > 0;
  return score > (board[board.length - 1]?.score ?? 0);
}

export function saveScore(entry: LeaderboardEntry): LeaderboardEntry[] {
  const next = [...read(), entry]
    .sort((a, b) => b.score - a.score)
    .slice(0, LEADERBOARD_SIZE);
  write(next);
  return next;
}

export function clearLeaderboard(): void {
  localStorage.removeItem(LEADERBOARD_KEY);
}
