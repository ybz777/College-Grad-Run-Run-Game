import * as Phaser from 'phaser';
import { Sfx } from '../audio/sfx';
import type { GameBus } from '../bus';
import {
  BASE_SPEED,
  CENTER_X,
  COFFEE_MULT,
  DEBT_PER_SECOND,
  GAME_HEIGHT,
  GAME_WIDTH,
  MAX_SPEED,
  STARTING_DEBT,
} from '../data/constants';
import { getCharacter } from '../data/characters';
import {
  CAUSE_BY_SUBTYPE,
  clockFromElapsed,
  DEATH_CAUSES,
  INTERVIEW_BANK,
  resumeSkills,
} from '../data/copy';
import type { CharacterId, DailyMarket, HudState, InterviewQuestion, RunStats } from '../data/types';
import { Player } from '../entities/Player';
import { makeDecor, type WorldEntity } from '../entities/factories';
import { evaluateAchievements } from '../persistence/achievements';
import { getDailyMarket } from '../persistence/dailyMarket';
import { averageLane, dashOn, HORIZON_Y, project, roadZs, sliceAt } from '../utils/perspective';
import { crossedPlane, shouldCollect, shouldCollide } from '../systems/collision';
import { Fx } from '../systems/Fx';
import type { InputQueue } from '../systems/InputQueue';
import type { RunBridge } from '../systems/RunBridge';
import { Spawner } from '../systems/Spawner';

interface SkylineBuilding {
  x: number;
  w: number;
  h: number;
  color: number;
}

export class GameScene extends Phaser.Scene {
  private bus!: GameBus;
  private inputQueue!: InputQueue;
  private sfx!: Sfx;
  private market!: DailyMarket;
  private player!: Player;
  private spawner!: Spawner;
  private fx!: Fx;
  private bridge!: RunBridge;
  private entities: WorldEntity[] = [];
  private worldLayer!: Phaser.GameObjects.Container;
  private bg!: Phaser.GameObjects.Graphics;
  private mid!: Phaser.GameObjects.Graphics;
  private road!: Phaser.GameObjects.Graphics;
  private dim!: Phaser.GameObjects.Rectangle;
  private skyline: SkylineBuilding[] = [];
  private farScroll = 0;
  private midScroll = 0;
  private elapsed = 0;
  private distance = 0;
  private score = 0;
  private experience = 0;
  private applications = 0;
  private interviews = 0;
  private rejections = 0;
  private referrals = 0;
  private nearMisses = 0;
  private streak = 0;
  private atsDodges = 0;
  private debt = STARTING_DEBT;
  private speed = BASE_SPEED;
  private difficulty = 0;
  private ended = false;
  private frozen = false;
  private interviewLeft = 0;
  private interviewQuestion: InterviewQuestion | null = null;
  private interviewResolved = false;
  private applicationLock = false;
  private hudAcc = 0;
  private roadScroll = 0;
  private hintLabel!: Phaser.GameObjects.Text;
  private hintUntil = 0;
  private shake = true;
  private deathTimer = 0;
  private deathSent = false;
  private hitstop = 0;
  private timeScale = 1;
  private atsBoss = false;
  private unstableShown = false;
  private interviewed = false;
  private lastCause = 'POSITION ELIMINATED';
  private deathReason: RunStats['reason'] = 'collision';
  private pendingToasts: Array<{ at: number; event: Parameters<GameBus['emit']>[0] }> = [];

  constructor() {
    super({ key: 'GameScene' });
  }

  create(): void {
    this.bus = this.registry.get('bus') as GameBus;
    this.inputQueue = this.registry.get('input') as InputQueue;
    this.sfx = this.registry.get('sfx') as Sfx;
    this.bridge = this.registry.get('bridge') as RunBridge;
    this.shake = this.registry.get('shake') !== false;
    const character = this.registry.get('character') as CharacterId | undefined;
    this.market = getDailyMarket();
    this.cameras.main.setBackgroundColor('#0b1524');

    this.bg = this.add.graphics();
    this.mid = this.add.graphics();
    this.road = this.add.graphics();
    this.worldLayer = this.add.container(0, 0);
    this.dim = this.add.rectangle(CENTER_X, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x020617, 0).setDepth(8);
    this.fx = new Fx(this);
    this.player = new Player(this, getCharacter(character));
    this.worldLayer.add(this.player.view);
    this.hintLabel = this.add
      .text(CENTER_X, GAME_HEIGHT - 52, '', {
        fontFamily: 'Arial Black, Arial, sans-serif',
        fontSize: '18px',
        color: '#f5c542',
        stroke: '#071018',
        strokeThickness: 6,
        align: 'center',
      })
      .setOrigin(0.5)
      .setDepth(3500)
      .setAlpha(0);

    this.skyline = Array.from({ length: 22 }, (_, i) => ({
      x: i * 48 - 40,
      w: 24 + ((i * 13) % 36),
      h: 34 + ((i * 29) % 92),
      color: [0x152238, 0x1c314c, 0x22344f][i % 3]!,
    }));

    this.spawner = new Spawner(this, this.market, (entity) => this.addEntity(entity), Math.random);
    for (let i = 0; i < 12; i += 1) {
      const side: -1 | 1 = i % 2 === 0 ? -1 : 1;
      this.addEntity(makeDecor(this, side, 0.18 + i * 0.08, i + 3, 'early'));
    }
    this.drawBackground();
    this.sfx.startMusic();

    this.events.once('shutdown', () => {
      this.sfx.stopMusic();
      this.fx.destroy();
      this.entities.forEach((entity) => entity.view.destroy(true));
      this.entities = [];
    });
  }

  update(_time: number, delta: number): void {
    const raw = Math.min(delta, 48) / 1000;
    this.fx.update(raw);

    if (this.hitstop > 0) {
      this.hitstop -= raw;
      return;
    }

    const dt = raw * this.timeScale;
    if (this.ended) {
      this.player.update(dt, 0);
      this.deathTimer -= raw;
      this.timeScale = Math.max(0.25, this.timeScale - raw * 1.4);
      if (this.deathTimer <= 0 && !this.deathSent) this.finishDeath();
      return;
    }
    this.flushToasts();

    if (this.frozen) {
      this.tickInterview(dt);
      this.player.update(dt * 0.2, 0.05);
      return;
    }

    this.handleInput();
    this.elapsed += dt;
    this.difficulty = Math.max(0, Math.min(1, (this.elapsed - 22) / 90));
    const coffee = this.player.coffeeTime > 0;
    this.speed = (BASE_SPEED + this.difficulty * (MAX_SPEED - BASE_SPEED)) * (coffee ? COFFEE_MULT : 1);
    this.distance += this.speed * dt * 290;
    this.score += this.speed * dt * 46 * this.comboMult();
    this.debt += dt * DEBT_PER_SECOND;
    this.roadScroll += this.speed * dt;
    this.farScroll += this.speed * dt * 18;
    this.midScroll += this.speed * dt * 42;
    this.sfx.setIntensity(this.difficulty);
    this.updateHint();

    this.player.update(dt, this.speed);
    if (this.player.landedThisFrame) {
      this.fx.dust(this.player.view.x, this.player.view.y);
      if (this.shake) this.cameras.main.shake(70, 0.002);
    }

    this.spawner.update(dt, this.elapsed, this.difficulty);
    this.updateEntities(dt);
    this.trimEntities();
    this.drawBackground();
    this.sortWorld();
    this.maybeBanners();

    if (this.spawner.shouldInterview()) this.startInterview();

    this.hudAcc += dt;
    if (this.hudAcc >= 0.12) {
      this.hudAcc = 0;
      this.bus.emit({ type: 'hud', state: this.hud() });
      this.checkLiveAchievements();
    }
  }

  private comboMult(): number {
    return 1 + Math.min(this.streak, 10) * 0.08;
  }

  private handleInput(): void {
    const action = this.inputQueue.consume();
    if (action.laneDelta !== 0 && this.player.shift(action.laneDelta)) this.sfx.lane();
    if (action.jump && this.player.tryJump()) {
      this.sfx.jump();
      this.fx.dust(this.player.view.x, this.player.view.y);
    }
    if (action.slide && this.player.trySlide()) this.sfx.slide();
  }

  private addEntity(entity: WorldEntity): void {
    this.entities.push(entity);
    this.worldLayer.add(entity.view);
    this.applyPose(entity);
    if (entity.kind === 'ats') {
      this.atsBoss = true;
      this.dim.setAlpha(0.16);
      this.sfx.scan();
      this.bus.emit({ type: 'ats', phase: 'scan', failSkill: 'Kubernetes' });
      this.queueToast(0.8, { type: 'ats', phase: 'skills', failSkill: this.failSkill() });
    }
  }

  private failSkill(): string {
    return this.experience >= 8 ? 'Terraform' : 'Kubernetes';
  }

  private updateEntities(dt: number): void {
    const keep: WorldEntity[] = [];
    for (const entity of this.entities) {
      if (entity.dead) {
        entity.view.destroy(true);
        continue;
      }
      const before = entity.depth;
      entity.depth -= this.speed * dt * (entity.kind === 'ats' ? 0.78 : 1);
      this.applyPose(entity);
      if (entity.hint && entity.depth < 0.28 && entity.depth > 0.08) {
        this.showHint(entity.hint);
        entity.hint = undefined;
      }

      if (!entity.resolved && !entity.dead && crossedPlane(before, entity.depth)) {
        entity.resolved = true;
        if (entity.collectible) this.tryCollect(entity);
        else if (entity.kind !== 'decor') {
          if (shouldCollide(this.player, entity)) this.tryHit(entity);
          if (!this.ended && !entity.dead) this.maybeNearMiss(entity);
        }
      }

      if (entity.kind === 'ats' && !this.ended && !entity.dead && crossedPlane(before, entity.depth)) {
        if (!entity.lanes.includes(this.player.lane)) this.atsSuccess();
      }

      if (entity.depth < -0.16) {
        entity.view.destroy(true);
        continue;
      }
      if (!entity.dead) keep.push(entity);
      else entity.view.destroy(true);
    }
    this.entities = keep;
  }

  private maybeNearMiss(entity: WorldEntity): void {
    entity.tagged = true;
    const adjacent = entity.lanes.some((lane) => Math.abs(lane - this.player.lane) === 1);
    const sameAvoided =
      entity.lanes.includes(this.player.lane) &&
      ((entity.profile === 'low' && this.player.airborne) || (entity.profile === 'high' && this.player.sliding));
    if (!adjacent && !sameAvoided) return;
    const hard = sameAvoided || this.difficulty > 0.45;
    const pts = Math.floor((hard ? 250 : 100) * this.comboMult());
    this.nearMisses += 1;
    this.bumpStreak();
    this.score += pts;
    this.sfx.nearMiss();
    this.fx.floatText(this.player.view.x, this.player.view.y, hard ? `RECRUITER IMPRESSED +${pts}` : `CLOSE CALL! +${pts}`, '#3ee0a0');
  }

  private bumpStreak(): void {
    this.streak += 1;
    if (this.streak === 2 || this.streak === 5 || this.streak === 10) {
      this.fx.floatText(this.player.view.x, this.player.view.y - 40, `APPLICATION STREAK ×${this.streak}`, '#f5c542');
    }
  }

  private applyPose(entity: WorldEntity): void {
    const pose = project(averageLane(entity.lanes), entity.depth, entity.extraX);
    const bob =
      entity.kind === 'collectible' || entity.kind === 'job'
        ? Math.sin(this.elapsed * 6 + entity.id) * 8 * pose.scale
        : 0;
    entity.view.setPosition(pose.x, pose.y + bob);
    entity.view.setScale(pose.scale);
    entity.view.setAlpha(entity.depth > 0.88 ? 0.55 : 1);
  }

  private tryCollect(entity: WorldEntity): void {
    if (!shouldCollect(this.player, entity)) return;
    entity.dead = true;
    this.fx.burst(entity.view.x, entity.view.y - 40, 0xf5c542, 10);
    this.tweens.add({
      targets: entity.view,
      scale: entity.view.scale * 1.25,
      alpha: 0,
      duration: 160,
    });
    this.applyCollect(entity.subtype, entity.view.x, entity.view.y);
  }

  private applyCollect(subtype: string, x: number, y: number): void {
    switch (subtype) {
      case 'experience':
        this.experience += 1;
        this.score += Math.floor(250 * this.comboMult());
        this.sfx.collect();
        this.fx.floatText(x, y, '+1 YEAR');
        break;
      case 'referral':
        this.referrals += 1;
        this.player.grantReferral();
        this.sfx.powerup();
        this.fx.floatText(x, y, 'YOU KNOW A GUY', '#f5c542');
        break;
      case 'coffee':
        this.player.grantCoffee();
        this.sfx.collect();
        this.fx.floatText(x, y, 'CAFFEINATED', '#3ee0a0');
        break;
      case 'networking': {
        const pts = Math.floor(250 * this.comboMult());
        this.score += pts;
        this.bumpStreak();
        this.sfx.collect();
        this.fx.floatText(x, y, `NETWORKING +${pts}`, '#93c5fd');
        break;
      }
      case 'nepotism':
        this.player.grantNepotism();
        this.clearAhead();
        this.sfx.powerup();
        this.fx.floatText(x, y, 'DIFFICULTY DISABLED', '#c4b5fd');
        break;
      case 'ai':
        this.player.grantAi();
        this.sfx.powerup();
        this.fx.floatText(x, y, 'AI READY', '#3ee0a0');
        break;
      case 'job_post':
        this.bumpStreak();
        this.startApplication();
        break;
      default:
        this.sfx.collect();
    }
  }

  private tryHit(entity: WorldEntity): void {
    if (!shouldCollide(this.player, entity)) return;
    if (this.player.nepotismTime > 0 || this.player.invincible) {
      entity.dead = true;
      this.fx.burst(entity.view.x, entity.view.y - 30, 0xf5c542, 6);
      return;
    }

    if (this.player.consumeAi()) {
      entity.dead = true;
      this.sfx.powerup();
      this.fx.floatText(this.player.view.x, this.player.view.y, 'AI HANDLED IT', '#3ee0a0');
      return;
    }

    this.lastCause = entity.cause || CAUSE_BY_SUBTYPE[entity.subtype] || 'POSITION ELIMINATED';
    if (entity.kind === 'ats') this.toast('APPLICATION REJECTED', this.lastCause, 'red');
    this.die(entity.kind === 'ats' ? 'rejected' : 'collision');
  }

  private atsSuccess(): void {
    this.atsBoss = false;
    this.dim.setAlpha(0);
    this.atsDodges += 1;
    this.bumpStreak();
    this.score += Math.floor(400 * this.comboMult());
    this.sfx.powerup();
    this.bus.emit({ type: 'ats', phase: 'clear' });
    this.fx.floatText(this.player.view.x, this.player.view.y, 'APPLICATION ADVANCED', '#3ee0a0');
  }

  private clearAhead(): void {
    for (const entity of this.entities) {
      if (entity.kind === 'decor' || entity.collectible) continue;
      if (entity.depth < 0.72) entity.dead = true;
    }
  }

  private trimEntities(): void {
    if (this.entities.length < 52) return;
    const extras = this.entities.filter((entity) => entity.kind === 'decor').sort((a, b) => b.depth - a.depth);
    extras.slice(0, 8).forEach((entity) => {
      entity.dead = true;
    });
  }

  private startApplication(): void {
    if (this.applicationLock) return;
    this.applicationLock = true;
    this.applications += 1;
    this.score += Math.floor(180 * this.comboMult());
    this.sfx.stamp();
    this.fx.floatText(this.player.view.x, this.player.view.y, 'APPLICATION SUBMITTED', '#f4ead5');
    this.time.delayedCall(2300, () => {
      this.rejections += 1;
      this.sfx.reject();
      this.fx.floatText(this.player.view.x, this.player.view.y, 'POSITION ELIMINATED', '#fca5a5');
      this.applicationLock = false;
    });
  }

  private startInterview(): void {
    this.interviews += 1;
    this.interviewed = true;
    this.frozen = true;
    this.interviewLeft = 8.5;
    this.interviewResolved = false;
    this.interviewQuestion = INTERVIEW_BANK[Math.floor(Math.random() * INTERVIEW_BANK.length)]!;
    this.bridge.reset();
    this.inputQueue.clear();
    this.sfx.scan();
    this.bus.emit({ type: 'interview', phase: 'start', question: this.interviewQuestion });
  }

  private tickInterview(dt: number): void {
    this.interviewLeft -= dt;
    if (!this.interviewResolved && this.bridge.interviewChoice !== null && this.interviewQuestion) {
      this.interviewResolved = true;
      const ok = this.bridge.interviewChoice === this.interviewQuestion.correct;
      this.toast(ok ? 'TECHNICAL ROUND PASSED' : 'TECHNICAL ROUND FAILED', ok ? 'Correct. Irrelevant.' : 'Wrong. Also irrelevant.', ok ? 'mint' : 'red');
      if (ok) this.score += 500;
    }
    if (this.interviewLeft <= 1.8 && !this.interviewResolved) {
      this.interviewResolved = true;
      this.toast('NO RESPONSE', 'Silence is also an answer.', 'red');
    }
    if (this.interviewLeft <= 0) {
      this.frozen = false;
      this.rejections += 1;
      this.sfx.reject();
      this.toast('FINAL DECISION', 'POSITION ELIMINATED', 'red');
      this.bus.emit({ type: 'interview', phase: 'end' });
    }
  }

  private die(reason: RunStats['reason']): void {
    if (this.ended) return;
    this.ended = true;
    this.deathReason = reason;
    this.streak = 0;
    this.atsBoss = false;
    this.dim.setAlpha(0);
    this.player.kill();
    this.inputQueue.clear();
    this.sfx.stopMusic();
    this.sfx.hit();
    this.fx.flash(0xff3b3b, 0.32);
    this.fx.burst(this.player.view.x, this.player.view.y - 20, 0xef4444, 14);
    this.hitstop = 0.1;
    this.timeScale = 0.45;
    this.deathTimer = 0.85;
    if (this.shake) this.cameras.main.shake(280, 0.012);
    this.bus.emit({ type: 'hud', state: this.hud() });
    this.lastCause = this.lastCause || DEATH_CAUSES[Math.floor(Math.random() * DEATH_CAUSES.length)]!;
    if (reason === 'rejected') this.lastCause = this.lastCause || 'ATS COULD NOT PARSE YOUR RESUME';
  }

  private finishDeath(): void {
    this.deathSent = true;
    this.sfx.gameOver();
    const stats = this.stats(this.deathReason);
    const unlocked = evaluateAchievements(stats, {
      atsDodges: this.atsDodges,
      referrals: this.referrals,
      interviewed: this.interviewed,
    });
    unlocked.forEach((row) => this.bus.emit({ type: 'achievement', id: row.id, title: row.title }));
    this.bus.emit({ type: 'gameover', stats });
  }

  private maybeBanners(): void {
    if (this.elapsed > 120 && !this.unstableShown) {
      this.unstableShown = true;
      this.toast('THE JOB MARKET HAS BECOME UNSTABLE', 'Please remain professional.', 'red');
    }
  }

  private checkLiveAchievements(): void {
    const unlocked = evaluateAchievements(this.stats('collision'), {
      atsDodges: this.atsDodges,
      referrals: this.referrals,
      interviewed: this.interviewed,
    });
    unlocked.forEach((row) => {
      this.bus.emit({ type: 'achievement', id: row.id, title: row.title });
      this.toast(row.title, row.blurb, 'gold');
    });
  }

  private hud(): HudState {
    const clock = clockFromElapsed(this.elapsed);
    return {
      ...this.stats('collision'),
      speed: this.speed,
      invincible: this.player.invincible,
      coffee: this.player.coffeeTime > 0,
      aiReady: this.player.aiCharges > 0,
      elapsed: this.elapsed,
      clock: clock.clock,
      clockLine: clock.line,
      combo: this.streak,
      atsBoss: this.atsBoss,
      skills: resumeSkills(this.experience),
    };
  }

  private stats(reason: RunStats['reason']): RunStats {
    return {
      distance: this.distance,
      score: this.score,
      experience: this.experience,
      applications: this.applications,
      interviews: this.interviews,
      rejections: this.rejections,
      referrals: this.referrals,
      nearMisses: this.nearMisses,
      streak: this.streak,
      debt: this.debt,
      reason,
      cause: this.lastCause,
    };
  }

  private toast(
    message: string,
    detail?: string,
    tone: 'gold' | 'red' | 'mint' | 'paper' = 'paper',
  ): void {
    this.bus.emit({ type: 'toast', message, detail, tone });
  }

  private queueToast(delay: number, event: Parameters<GameBus['emit']>[0]): void {
    this.pendingToasts.push({ at: this.elapsed + delay, event });
  }

  private flushToasts(): void {
    if (this.pendingToasts.length === 0) return;
    const due = this.pendingToasts.filter((item) => item.at <= this.elapsed);
    this.pendingToasts = this.pendingToasts.filter((item) => item.at > this.elapsed);
    due.forEach((item) => this.bus.emit(item.event));
  }

  private sortWorld(): void {
    this.worldLayer.sort('y');
  }

  private showHint(text: string, seconds = 3.2): void {
    this.hintLabel.setText(text);
    this.hintUntil = this.elapsed + seconds;
    this.hintLabel.setAlpha(1);
  }

  private updateHint(): void {
    if (this.hintUntil <= 0) return;
    if (this.elapsed >= this.hintUntil) {
      this.hintLabel.setAlpha(Math.max(0, this.hintLabel.alpha - 0.08));
      if (this.hintLabel.alpha <= 0) this.hintUntil = 0;
    }
  }

  private drawBackground(): void {
    const night = (this.elapsed % 120) / 120;
    const dusk = night > 0.55 ? Math.min(1, (night - 0.55) / 0.25) : 0;
    const g = this.bg;
    g.clear();
    const top = Phaser.Display.Color.Interpolate.ColorWithColor(
      Phaser.Display.Color.ValueToColor(0x1d3a5f),
      Phaser.Display.Color.ValueToColor(0x070b14),
      100,
      dusk * 100,
    );
    const bot = Phaser.Display.Color.Interpolate.ColorWithColor(
      Phaser.Display.Color.ValueToColor(0x274a73),
      Phaser.Display.Color.ValueToColor(0x0b1524),
      100,
      dusk * 100,
    );
    const topC = Phaser.Display.Color.GetColor(top.r, top.g, top.b);
    const botC = Phaser.Display.Color.GetColor(bot.r, bot.g, bot.b);
    g.fillGradientStyle(topC, topC, botC, botC, 1);
    g.fillRect(0, 0, GAME_WIDTH, HORIZON_Y + 10);
    g.fillStyle(dusk > 0.6 ? 0xf8fafc : 0xf8d56c, dusk > 0.6 ? 0.55 : 0.5);
    g.fillCircle(760 - this.farScroll * 0.02, 64 + dusk * 18, dusk > 0.6 ? 14 : 18);

    const m = this.mid;
    m.clear();
    for (const b of this.skyline) {
      const x = ((b.x - this.farScroll * 0.35) % (GAME_WIDTH + 80)) - 40;
      m.fillStyle(b.color, 1);
      m.fillRect(x, HORIZON_Y - b.h, b.w, b.h);
      m.fillStyle(dusk > 0.45 ? 0xf5c542 : 0x7dd3fc, dusk > 0.45 ? 0.28 : 0.12);
      m.fillRect(x + 6, HORIZON_Y - b.h + 10, 6, 6);
      m.fillRect(x + 16, HORIZON_Y - b.h + 22, 6, 6);
    }
    for (let i = 0; i < 10; i += 1) {
      const w = 36 + (i % 3) * 10;
      const h = 50 + (i % 4) * 16;
      const x = ((i * 110 - this.midScroll * 0.7) % (GAME_WIDTH + 120)) - 60;
      m.fillStyle(0x1a2a40, 0.85);
      m.fillRect(x, HORIZON_Y - h + 8, w, h);
    }

    g.fillStyle(0x141c28, 1);
    g.fillRect(0, HORIZON_Y, GAME_WIDTH, GAME_HEIGHT - HORIZON_Y);
    this.drawRoad();
  }

  private drawRoad(): void {
    const r = this.road;
    r.clear();
    const zs = roadZs();
    const lane = Math.round(this.player.visualLane);

    for (let i = zs.length - 2; i >= 0; i -= 1) {
      const far = sliceAt(zs[i + 1]!);
      const near = sliceAt(zs[i]!);
      r.fillStyle(0x1a2332, 1);
      r.beginPath();
      r.moveTo(0, far.y);
      r.lineTo(far.shoulderL, far.y);
      r.lineTo(near.shoulderL, near.y);
      r.lineTo(0, near.y);
      r.closePath();
      r.fillPath();
      r.beginPath();
      r.moveTo(GAME_WIDTH, far.y);
      r.lineTo(far.shoulderR, far.y);
      r.lineTo(near.shoulderR, near.y);
      r.lineTo(GAME_WIDTH, near.y);
      r.closePath();
      r.fillPath();

      r.fillStyle(0x3a4558, 1);
      r.beginPath();
      r.moveTo(far.left, far.y);
      r.lineTo(far.right, far.y);
      r.lineTo(near.right, near.y);
      r.lineTo(near.left, near.y);
      r.closePath();
      r.fillPath();

      r.fillStyle(0x2c3444, 1);
      r.beginPath();
      r.moveTo(far.laneLeft[0], far.y);
      r.lineTo(far.laneRight[2], far.y);
      r.lineTo(near.laneRight[2], near.y);
      r.lineTo(near.laneLeft[0], near.y);
      r.closePath();
      r.fillPath();

      r.fillStyle(0xf5c542, 0.07);
      r.beginPath();
      r.moveTo(far.laneLeft[lane], far.y);
      r.lineTo(far.laneRight[lane], far.y);
      r.lineTo(near.laneRight[lane], near.y);
      r.lineTo(near.laneLeft[lane], near.y);
      r.closePath();
      r.fillPath();

      if (dashOn(near.z, this.roadScroll, 0.075)) {
        const lw = Math.max(2, 5 * near.scale);
        r.lineStyle(lw, 0xf5c542, 0.95);
        r.beginPath();
        r.moveTo(far.dividerL, far.y);
        r.lineTo(near.dividerL, near.y);
        r.strokePath();
        r.beginPath();
        r.moveTo(far.dividerR, far.y);
        r.lineTo(near.dividerR, near.y);
        r.strokePath();
      }

      r.lineStyle(Math.max(2, 4 * near.scale), 0xe2e8f0, 0.55);
      r.beginPath();
      r.moveTo(far.left, far.y);
      r.lineTo(near.left, near.y);
      r.strokePath();
      r.beginPath();
      r.moveTo(far.right, far.y);
      r.lineTo(near.right, near.y);
      r.strokePath();
    }

    r.fillStyle(0x94a3b8, 0.35);
    r.fillRect(CENTER_X - 18, HORIZON_Y - 2, 36, 3);
  }
}

