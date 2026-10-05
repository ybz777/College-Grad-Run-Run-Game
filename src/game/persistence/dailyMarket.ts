import type { DailyMarket } from '../data/types';
import { dateSeed, mulberry32 } from '../utils/rng';

const MARKETS: DailyMarket[] = [
  {
    id: 'freeze',
    name: 'TECH HIRING FREEZE',
    blurb: 'Obstacle frequency +10%. The pipeline is "paused," not closed.',
    obstacleRate: 1.1,
    expMult: 1,
    rtoMult: 1,
    layoffMult: 1,
    internMult: 1,
    repostMult: 1.2,
    atsMult: 1,
  },
  {
    id: 'boom',
    name: 'RECRUITING BOOM',
    blurb: 'More Experience collectibles. They still want five years of it.',
    obstacleRate: 0.96,
    expMult: 2.1,
    rtoMult: 1,
    layoffMult: 0.8,
    internMult: 1,
    repostMult: 1,
    atsMult: 1,
  },
  {
    id: 'rto',
    name: 'RETURN TO OFFICE WEEK',
    blurb: 'More office obstacles. Collaboration is mandatory and unexplained.',
    obstacleRate: 1.04,
    expMult: 1,
    rtoMult: 2.3,
    layoffMult: 1,
    internMult: 1,
    repostMult: 1,
    atsMult: 1,
  },
  {
    id: 'layoff',
    name: 'LAYOFF SEASON',
    blurb: 'More POSITION ELIMINATED events. Please remain passionate.',
    obstacleRate: 1.08,
    expMult: 0.9,
    rtoMult: 1,
    layoffMult: 2.4,
    internMult: 1,
    repostMult: 1.1,
    atsMult: 1.15,
  },
  {
    id: 'ghost',
    name: 'GHOST JOB FRIDAY',
    blurb: 'Reposted listings everywhere. The role has been open since 2019.',
    obstacleRate: 1.05,
    expMult: 1,
    rtoMult: 1,
    layoffMult: 1,
    internMult: 1,
    repostMult: 2.5,
    atsMult: 1,
  },
  {
    id: 'intern',
    name: 'UNPAID INTERNSHIP SEASON',
    blurb: 'Desks everywhere. Compensation: experience.',
    obstacleRate: 1.02,
    expMult: 1.3,
    rtoMult: 1,
    layoffMult: 0.9,
    internMult: 2.4,
    repostMult: 1,
    atsMult: 1,
  },
  {
    id: 'ats',
    name: 'AUTOMATED SCREENING DAY',
    blurb: 'ATS Monster appears more often. Kubernetes is non-negotiable.',
    obstacleRate: 1.03,
    expMult: 1,
    rtoMult: 1,
    layoffMult: 1.1,
    internMult: 1,
    repostMult: 1,
    atsMult: 1.7,
  },
];

export function getDailyMarket(date = new Date()): DailyMarket {
  const rand = mulberry32(dateSeed(date) ^ 0x4a0b2026);
  const index = Math.floor(rand() * MARKETS.length);
  return MARKETS[index]!;
}

export function formatMarketDate(date = new Date()): string {
  return date.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}
