export type Screen =
  | 'menu'
  | 'howto'
  | 'leaderboard'
  | 'settings'
  | 'achievements'
  | 'playing';

export type AvoidType = 'lane' | 'jump' | 'slide';

export type ObstacleProfile = 'low' | 'high' | 'full';

export type EntityKind =
  | 'obstacle'
  | 'collectible'
  | 'npc'
  | 'decor'
  | 'ats'
  | 'job';

export type CharacterId = 'grad' | 'cs' | 'bootcamp' | 'switcher' | 'senior';

export type Era = 'early' | 'mid' | 'late' | 'nightmare';

export interface RunStats {
  distance: number;
  score: number;
  experience: number;
  applications: number;
  interviews: number;
  rejections: number;
  referrals: number;
  nearMisses: number;
  streak: number;
  debt: number;
  reason: 'collision' | 'rejected';
  cause: string;
}

export interface HudState extends RunStats {
  speed: number;
  invincible: boolean;
  coffee: boolean;
  aiReady: boolean;
  elapsed: number;
  clock: string;
  clockLine: string;
  combo: number;
  atsBoss: boolean;
  skills: ResumeSkill[];
}

export interface ResumeSkill {
  name: string;
  ok: boolean;
}

export interface DailyMarket {
  id: string;
  name: string;
  blurb: string;
  obstacleRate: number;
  expMult: number;
  rtoMult: number;
  layoffMult: number;
  internMult: number;
  repostMult: number;
  atsMult: number;
}

export interface LeaderboardEntry {
  name: string;
  score: number;
  distance: number;
  date: string;
}

export interface InterviewQuestion {
  prompt: string;
  options: [string, string, string];
  correct: 0 | 1 | 2;
}

export type GameEvent =
  | { type: 'hud'; state: HudState }
  | { type: 'toast'; message: string; detail?: string; tone?: 'gold' | 'red' | 'mint' | 'paper' }
  | { type: 'ats'; phase: 'scan' | 'skills' | 'clear'; failSkill?: string }
  | { type: 'application'; phase: 'submitted' | 'thanks' | 'eliminated' }
  | { type: 'interview'; phase: 'start' | 'end'; question?: InterviewQuestion }
  | { type: 'gameover'; stats: RunStats }
  | { type: 'pause'; paused: boolean }
  | { type: 'achievement'; id: string; title: string };

export interface GameSettings {
  muted: boolean;
  shake: boolean;
  character: CharacterId;
}

export interface AchievementDef {
  id: string;
  title: string;
  blurb: string;
}
