import * as Phaser from 'phaser';
import { eraFromElapsed } from '../data/copy';
import { TUTORIAL } from '../data/constants';
import type { DailyMarket, Era } from '../data/types';
import {
  makeAiCoder,
  makeAiPickup,
  makeAiReplaced,
  makeAts,
  makeAutoReject,
  makeCareerLifer,
  makeCoffee,
  makeDecor,
  makeDegree,
  makeEliminated,
  makeExperience,
  makeFiveRound,
  makeFiveYears,
  makeFullStack,
  makeGhosted,
  makeGhostJob,
  makeGlobalNo,
  makeInflation,
  makeJobPosting,
  makeJustOneMore,
  makeLaborSign,
  makeNepotism,
  makeNetworking,
  makePermanentChair,
  makePythonFlood,
  makeReferral,
  makeReposted,
  makeRepostLoop,
  makeRto,
  makeSalary,
  makeSponsorship,
  makeStatesman,
  makeTakeHome,
  makeTenX,
  makeUnpaid,
  makeVideoInterview,
  makeVisaForms,
  makeWorkAuth,
  type WorldEntity,
} from '../entities/factories';
import { pick } from '../utils/rng';
import { Z_SPAWN } from '../utils/perspective';

type SpawnFn = (entity: WorldEntity) => void;
type Factory = (lane: number, depth: number) => WorldEntity;

const LABOR = [
  'HIRING FREEZE',
  'HEADCOUNT FROZEN',
  'RESTRUCTURING',
  'ROLE CANCELED',
  'BUDGET CUT',
  'TEAM REDUCED',
  'HIRING PAUSED',
  'ROLE CLOSED',
  'LATERAL MOVE ONLY',
  'INTERNAL CANDIDATE SELECTED',
];

export class Spawner {
  obstacleTimer = 2.4;
  collectTimer = 0.2;
  decorTimer = 0.4;
  atsTimer = 18;
  jobTimer = 12;
  npcTimer = 16;
  interviewTimer = 38;
  private decorIndex = 0;
  private tutorialStep = 0;
  private scene: Phaser.Scene;
  private market: DailyMarket;
  private spawn: SpawnFn;
  private rand: () => number;
  era: Era = 'early';

  constructor(
    scene: Phaser.Scene,
    market: DailyMarket,
    spawn: SpawnFn,
    rand: () => number,
  ) {
    this.scene = scene;
    this.market = market;
    this.spawn = spawn;
    this.rand = rand;
  }

  update(dt: number, elapsed: number, difficulty: number): void {
    this.era = eraFromElapsed(elapsed);
    this.decorTimer -= dt;
    if (this.decorTimer <= 0) {
      this.decorTimer = 0.4 - difficulty * 0.08;
      const side: -1 | 1 = this.rand() > 0.5 ? 1 : -1;
      this.spawn(makeDecor(this.scene, side, Z_SPAWN + 0.06, this.decorIndex, this.era));
      this.decorIndex += 1;
    }

    this.runTutorial(elapsed);

    this.collectTimer -= dt;
    if (elapsed > 5 && this.collectTimer <= 0) {
      this.collectTimer = 2.8 - difficulty * 0.45;
      this.spawnCollectible(elapsed);
    }

    if (elapsed < TUTORIAL.doneAt) return;

    this.obstacleTimer -= dt;
    this.atsTimer -= dt / this.market.atsMult;
    this.jobTimer -= dt;
    this.npcTimer -= dt;

    if (elapsed > 36) this.interviewTimer -= dt;

    if (this.obstacleTimer <= 0 && this.atsTimer > 2.4) {
      const interval = (1.7 - difficulty * 0.52) / this.market.obstacleRate;
      this.obstacleTimer = Math.max(0.9, interval);
      this.spawnObstacles(elapsed, difficulty);
    }

    if (this.atsTimer <= 0 && elapsed > 34) {
      this.atsTimer = 24 - difficulty * 5;
      this.spawnAts();
    }

    if (this.jobTimer <= 0 && elapsed > 12) {
      this.jobTimer = 11 + this.rand() * 8;
      this.spawn(makeJobPosting(this.scene, this.freeLane(), Z_SPAWN));
    }

    if (this.npcTimer <= 0 && elapsed > 18) {
      this.npcTimer = 14 + this.rand() * 10;
      this.spawnNpc();
    }
  }

  private runTutorial(elapsed: number): void {
    if (this.tutorialStep === 0 && elapsed >= TUTORIAL.laneAt) {
      this.tutorialStep = 1;
      const entity = makeWorkAuth(this.scene, 1, Z_SPAWN);
      entity.hint = 'A / D   CHANGE LANES';
      this.spawn(entity);
    } else if (this.tutorialStep === 1 && elapsed >= TUTORIAL.jumpAt) {
      this.tutorialStep = 2;
      const entity = makeUnpaid(this.scene, 1, Z_SPAWN);
      entity.hint = 'JUMP  ↑  /  SPACE';
      this.spawn(entity);
    } else if (this.tutorialStep === 2 && elapsed >= TUTORIAL.slideAt) {
      this.tutorialStep = 3;
      const entity = makeSalary(this.scene, 1, Z_SPAWN);
      entity.hint = 'SLIDE  ↓  /  S';
      this.spawn(entity);
    } else if (this.tutorialStep === 3 && elapsed >= TUTORIAL.comboAt) {
      this.tutorialStep = 4;
      const low = makeUnpaid(this.scene, 0, Z_SPAWN);
      low.hint = 'LANE  ·  JUMP  ·  SLIDE';
      this.spawn(low);
      this.spawn(makeRto(this.scene, [2], Z_SPAWN + 0.04));
    }
  }

  shouldInterview(): boolean {
    if (this.interviewTimer > 0) return false;
    this.interviewTimer = 52 + this.rand() * 28;
    return true;
  }

  private spawnObstacles(elapsed: number, difficulty: number): void {
    const combo = elapsed > 24 && this.rand() < 0.16 + difficulty * 0.26;
    if (combo) {
      this.spawnPair();
      return;
    }

    const lane = this.freeLane();
    this.spawn(this.randomObstacle(lane, Z_SPAWN, elapsed));
    if (elapsed > 40 && this.rand() < 0.16 + difficulty * 0.14) {
      const other = this.otherLane(lane);
      this.spawn(makeUnpaid(this.scene, other, Z_SPAWN + 0.18));
    }
  }

  private spawnPair(): void {
    const skip = Math.floor(this.rand() * 3);
    for (let lane = 0; lane < 3; lane += 1) {
      if (lane === skip) continue;
      const depth = Z_SPAWN + this.rand() * 0.04;
      this.spawn(this.randomObstacle(lane, depth, 80));
    }
  }

  private randomObstacle(lane: number, depth: number, elapsed: number): WorldEntity {
    const pool = this.pool(elapsed);
    return pick(this.rand, pool)(lane, depth);
  }

  private pool(elapsed: number): Factory[] {
    const s = this.scene;
    const early: Factory[] = [
      (lane, depth) => makeFiveYears(s, lane, depth),
      (lane, depth) => makeWorkAuth(s, lane, depth),
      (lane, depth) => makeUnpaid(s, lane, depth),
      (lane, depth) => makeSalary(s, lane, depth),
      (lane, depth) => makeInflation(s, lane, depth),
    ];
    const mid: Factory[] = [
      ...early,
      (lane, depth) => makeReposted(s, lane, depth),
      (lane, depth) => makeRepostLoop(s, lane, depth),
      (lane, depth) => makeAutoReject(s, lane, depth),
      (lane, depth) => makeGhostJob(s, lane, depth),
      (lane, depth) => makeDegree(s, lane, depth),
      (lane, depth) => makePythonFlood(s, lane, depth),
      (lane, depth) => makeRto(s, [lane], depth),
    ];
    const late: Factory[] = [
      ...mid,
      (lane, depth) => makeEliminated(s, lane, depth),
      (lane, depth) => makeVideoInterview(s, lane, depth),
      (lane, depth) => makeTakeHome(s, lane, depth),
      (lane, depth) => makeFiveRound(s, lane, depth),
      (lane, depth) => makeGhosted(s, lane, depth),
      (lane, depth) => makeFullStack(s, lane, depth),
      (lane, depth) => makeTenX(s, lane, depth),
      (lane, depth) => makeSponsorship(s, lane, depth),
      (lane, depth) => makeVisaForms(s, lane, depth),
      (lane, depth) => makeLaborSign(s, lane, depth, pick(this.rand, LABOR), 'freeze'),
    ];
    const night: Factory[] = [
      ...late,
      (lane, depth) => makeAiCoder(s, lane, depth),
      (lane, depth) => makeAiReplaced(s, lane, depth),
      (lane, depth) => makeJustOneMore(s, lane, depth),
      (lane, depth) => makeGlobalNo(s, lane, depth),
      (lane, depth) => makeLaborSign(s, lane, depth, 'THE JOB MARKET HAS BECOME UNSTABLE', 'unstable'),
    ];
    if (elapsed < 30) return early;
    if (elapsed < 60) return mid;
    if (elapsed < 120) return late;
    return night;
  }

  private spawnCollectible(elapsed: number): void {
    const lane = this.freeLane();
    const depth = Z_SPAWN;
    const roll = this.rand();
    if (roll < 0.42 * this.market.expMult) this.spawn(makeExperience(this.scene, lane, depth));
    else if (roll < 0.58) this.spawn(makeCoffee(this.scene, lane, depth));
    else if (roll < 0.72) this.spawn(makeNetworking(this.scene, lane, depth));
    else if (roll < 0.84) this.spawn(makeReferral(this.scene, lane, depth));
    else if (roll < 0.93 && elapsed > 12) this.spawn(makeAiPickup(this.scene, lane, depth));
    else if (elapsed > 18) this.spawn(makeNepotism(this.scene, lane, depth));
    else this.spawn(makeExperience(this.scene, lane, depth));
  }

  private spawnAts(): void {
    const safeLane = Math.floor(this.rand() * 3);
    const blocked = [0, 1, 2].filter((lane) => lane !== safeLane);
    this.spawn(makeAts(this.scene, blocked, safeLane, Z_SPAWN + 0.08));
  }

  private spawnNpc(): void {
    const lane = this.freeLane();
    const roll = this.rand();
    if (roll < 0.34) this.spawn(makeCareerLifer(this.scene, lane, Z_SPAWN));
    else if (roll < 0.67) this.spawn(makePermanentChair(this.scene, [lane, this.otherLane(lane)], Z_SPAWN));
    else this.spawn(makeStatesman(this.scene, lane, Z_SPAWN));
  }

  private freeLane(): number {
    return Math.floor(this.rand() * 3);
  }

  private otherLane(lane: number): number {
    const options = [0, 1, 2].filter((value) => value !== lane);
    return pick(this.rand, options);
  }
}
