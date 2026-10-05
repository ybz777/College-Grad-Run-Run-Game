import type { AchievementDef, InterviewQuestion, ResumeSkill } from './types';

export const DEATH_CAUSES = [
  '5 YEARS EXPERIENCE REQUIRED',
  'INTERNAL CANDIDATE SELECTED',
  'POSITION ELIMINATED',
  'HIRING FREEZE',
  'WE WENT WITH ANOTHER CANDIDATE',
  'ATS COULD NOT PARSE YOUR RESUME',
  'HEADCOUNT FROZEN',
  'ROLE CLOSED',
  'PLEASE APPLY AGAIN NEXT QUARTER',
  'WE DECIDED TO GO IN ANOTHER DIRECTION',
];

export const CAUSE_BY_SUBTYPE: Record<string, string> = {
  five_years: '5 YEARS EXPERIENCE REQUIRED',
  work_auth: 'WORK AUTHORIZATION REQUIRED',
  unpaid: 'COMPENSATION: EXPERIENCE',
  reposted: 'GHOST JOB DETECTED',
  rto: 'RETURN TO OFFICE MANDATORY',
  salary: 'SALARY: COMPETITIVE',
  eliminated: 'POSITION ELIMINATED',
  ats: 'ATS COULD NOT PARSE YOUR RESUME',
  auto_reject: 'WE WENT WITH ANOTHER CANDIDATE',
  ghost_job: 'POSITION MAY NO LONGER EXIST',
  video: 'PLEASE RECORD A 5-MINUTE VIDEO',
  takehome: 'DEADLINE: TOMORROW',
  five_round: 'ONE MORE QUICK ROUND',
  ghosted: 'NO RESPONSE FOR 47 DAYS',
  inflation: 'RECENT GRADUATES WELCOME',
  degree: 'PhD A PLUS',
  python_flood: 'EVERYONE LEARNED PYTHON',
  ai_code: 'AI CAN WRITE THIS CODE',
  ten_x: '10X ENGINEER REQUIRED',
  fullstack: 'ENTRY LEVEL FULL STACK',
  just_one_more: 'KUBERNETES ✗',
  ai_replaced: 'AI REPLACED YOUR ENTRY-LEVEL POSITION',
  sponsorship: 'H-1B SPONSORSHIP: NO',
  visa_forms: 'HR HAS NOT RESPONDED',
  freeze: 'HIRING FREEZE',
  internal: 'INTERNAL CANDIDATE SELECTED',
};

export const INTERVIEW_BANK: InterviewQuestion[] = [
  {
    prompt: 'What is the time complexity of binary search?',
    options: ['O(n)', 'O(log n)', 'O(n²)'],
    correct: 1,
  },
  {
    prompt: 'Which status code means Not Found?',
    options: ['200', '301', '404'],
    correct: 2,
  },
  {
    prompt: 'A REST API is typically…',
    options: ['Stateless', 'A SQL dialect', 'A Kubernetes pod'],
    correct: 0,
  },
  {
    prompt: 'git commit --amend is for…',
    options: ['Force-pushing main', 'Fixing the last commit', 'Deleting prod'],
    correct: 1,
  },
];

export const ACHIEVEMENTS: AchievementDef[] = [
  { id: 'first_app', title: 'FIRST APPLICATION', blurb: 'Submit your first application.' },
  { id: 'overqualified', title: 'OVERQUALIFIED', blurb: 'Survive 1,000 meters.' },
  { id: 'underqualified', title: 'UNDERQUALIFIED', blurb: 'Get rejected 10 times.' },
  { id: 'networking_works', title: 'NETWORKING WORKS', blurb: 'Collect 10 referrals.' },
  { id: 'ats_survivor', title: 'ATS SURVIVOR', blurb: 'Dodge the ATS Monster 10 times.' },
  { id: 'interview_champion', title: 'INTERVIEW CHAMPION', blurb: 'Complete an interview event.' },
  { id: 'touch_grass', title: 'TOUCH GRASS', blurb: 'Survive 10,000 meters.' },
  { id: 'somehow_hired', title: 'SOMEHOW HIRED', blurb: 'Finish a full interview sequence.' },
  { id: 'unemployable', title: 'UNEMPLOYABLE', blurb: 'Receive 50 rejections.' },
  { id: 'impossible', title: 'IMPOSSIBLE CANDIDATE', blurb: 'Survive an extremely long run.' },
];

export function resumeSkills(experience: number): ResumeSkill[] {
  return [
    { name: 'Python', ok: true },
    { name: 'Java', ok: true },
    { name: 'SQL', ok: true },
    { name: 'React', ok: true },
    { name: 'FastAPI', ok: true },
    { name: 'AWS', ok: experience >= 4 },
    { name: 'Kubernetes', ok: experience >= 8 },
  ];
}

export function clockFromElapsed(elapsed: number): { clock: string; line: string } {
  const cycle = elapsed % 120;
  if (cycle < 28) return { clock: '8:03 AM', line: 'TIME TO APPLY' };
  if (cycle < 56) return { clock: '2:47 PM', line: `APPLICATIONS: ${Math.max(1, Math.floor(elapsed / 4))}` };
  if (cycle < 88) return { clock: '7:21 PM', line: 'STILL APPLYING' };
  return { clock: '1:14 AM', line: 'YOU SHOULD PROBABLY SLEEP' };
}

export function eraFromElapsed(elapsed: number): 'early' | 'mid' | 'late' | 'nightmare' {
  if (elapsed < 30) return 'early';
  if (elapsed < 60) return 'mid';
  if (elapsed < 120) return 'late';
  return 'nightmare';
}

export const ERA_SIGNS: Record<'early' | 'mid' | 'late' | 'nightmare', Array<{ title: string; color: number }>> = {
  early: [
    { title: 'NOW HIRING', color: 0x166534 },
    { title: 'ENTRY LEVEL', color: 0x1d4ed8 },
    { title: 'WE ARE HIRING', color: 0x1e40af },
  ],
  mid: [
    { title: 'ENTRY LEVEL', color: 0x1d4ed8 },
    { title: '5 YEARS EXPERIENCE', color: 0x9a3412 },
    { title: 'SALARY: COMPETITIVE', color: 0x14532d },
    { title: 'EXPERIENCE REQUIRED', color: 0x7f1d1d },
  ],
  late: [
    { title: 'POSITION ELIMINATED', color: 0x7f1d1d },
    { title: 'JOB REPOSTED', color: 0x1e3a5f },
    { title: 'APPLICATION UNDER REVIEW', color: 0x334155 },
    { title: 'UNDER REVIEW — 6 MONTHS', color: 0x3f3f46 },
    { title: '3,842 APPLICATIONS', color: 0x9a3412 },
  ],
  nightmare: [
    { title: 'THE JOB MARKET HAS BECOME UNSTABLE', color: 0x450a0a },
    { title: 'ROLE CANCELED', color: 0x7f1d1d },
    { title: 'HIRING PAUSED', color: 0x111827 },
    { title: 'PLEASE APPLY NEXT QUARTER', color: 0x1e293b },
  ],
};
