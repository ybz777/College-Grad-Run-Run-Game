import * as Phaser from 'phaser';
import { JUMP_GRAVITY, JUMP_PIXELS, JUMP_VELOCITY, SLIDE_DURATION } from '../data/constants';
import type { CharacterDef } from '../data/characters';
import { CHARACTERS } from '../data/characters';
import { project } from '../utils/perspective';

const FOOT = 62;

export class Player {
  view: Phaser.GameObjects.Container;
  lane = 1;
  visualLane = 1;
  jumpY = 0;
  jumpVel = 0;
  sliding = false;
  slideTime = 0;
  invincible = false;
  invincibleTime = 0;
  coffeeTime = 0;
  nepotismTime = 0;
  aiCharges = 0;
  dead = false;
  runPhase = 0;
  jumpedThisFrame = false;
  landedThisFrame = false;
  squash = 1;

  private shadow: Phaser.GameObjects.Ellipse;
  private bodyRoot: Phaser.GameObjects.Container;
  private leftLeg: Phaser.GameObjects.Rectangle;
  private rightLeg: Phaser.GameObjects.Rectangle;
  private leftArm: Phaser.GameObjects.Rectangle;
  private rightArm: Phaser.GameObjects.Rectangle;
  private tassel: Phaser.GameObjects.Rectangle | null = null;
  private diploma: Phaser.GameObjects.Rectangle;
  private backpack: Phaser.GameObjects.Rectangle;
  private packFlap: Phaser.GameObjects.Rectangle;
  private capGroup: Phaser.GameObjects.Container;

  constructor(scene: Phaser.Scene, look: CharacterDef = CHARACTERS[0]!) {
    this.view = scene.add.container(0, 0);
    this.shadow = scene.add.ellipse(0, 6, 88, 22, 0x05070c, 0.48);
    this.bodyRoot = scene.add.container(0, 0);
    this.capGroup = scene.add.container(0, 0);

    this.leftLeg = scene.add.rectangle(-10, 28, 10, 34, look.pants).setOrigin(0.5, 0);
    this.rightLeg = scene.add.rectangle(10, 28, 10, 34, look.pants).setOrigin(0.5, 0);
    const leftShoe = scene.add.rectangle(-10, 60, 16, 7, 0x1a1d24);
    const rightShoe = scene.add.rectangle(10, 60, 16, 7, 0x1a1d24);

    const hips = scene.add.rectangle(0, 22, 36, 18, look.pants);
    const shirt = scene.add.rectangle(0, look.hoodie ? -2 : -4, 42, look.hoodie ? 40 : 36, look.shirt);
    const collar = look.hoodie
      ? scene.add.rectangle(0, -22, 28, 10, look.sleeve)
      : scene.add.triangle(0, -20, 0, 8, -12, -6, 12, -6, 0xf2f4f8);
    const tie = look.hoodie || look.id === 'bootcamp'
      ? scene.add.rectangle(0, 0, 1, 1, look.shirt, 0)
      : scene.add.rectangle(0, -2, 6, 22, 0xc0392b);

    this.backpack = scene.add.rectangle(-26, -6, 16, 30, 0x8b3a2a);
    this.packFlap = scene.add.rectangle(-26, -18, 16, 8, 0x6e2c21);
    const laptop = scene.add.rectangle(-26, 4, 18, 12, 0x1e293b);
    laptop.setStrokeStyle(1, 0x93c5fd, 0.9);

    this.diploma = scene.add.rectangle(24, 6, 22, 8, 0xf4ead5).setAngle(18);
    const ribbon = scene.add.rectangle(24, 6, 6, 10, 0xc0392b).setAngle(18);

    this.leftArm = scene.add.rectangle(-22, -2, 8, 28, look.sleeve).setOrigin(0.5, 0);
    this.rightArm = scene.add.rectangle(22, -2, 8, 28, look.sleeve).setOrigin(0.5, 0);

    const head = scene.add.circle(0, -38, 16, 0xf0c8a0);
    const hair = scene.add.ellipse(0, -48, 28, 12, look.hair);
    const eyeL = scene.add.circle(-6, -38, 2.2, 0x1a1a1a);
    const eyeR = scene.add.circle(6, -38, 2.2, 0x1a1a1a);
    const bagL = scene.add.ellipse(-6, -34, 7, 3, 0xd4a07a, 0.7);
    const bagR = scene.add.ellipse(6, -34, 7, 3, 0xd4a07a, 0.7);
    const mouth = scene.add.rectangle(0, -31, 6, 2, 0xb07a5a);

    if (look.cap) {
      const cap = scene.add.rectangle(0, -52, 38, 8, 0x14141f);
      const capTop = scene.add.rectangle(0, -58, 46, 6, 0x1a1a2e).setAngle(-8);
      this.tassel = scene.add.rectangle(20, -50, 4, 22, 0xf5c542).setOrigin(0.5, 0);
      this.capGroup.add([cap, capTop, this.tassel]);
    }

    const extras: Phaser.GameObjects.GameObject[] = [];
    if (look.lanyard) {
      extras.push(scene.add.rectangle(0, -8, 4, 26, 0xf5c542));
      extras.push(scene.add.rectangle(0, 8, 16, 12, 0xe2e8f0));
    }
    if (look.coffee) {
      extras.push(scene.add.rectangle(30, 8, 10, 14, 0xf4ead5));
      extras.push(scene.add.rectangle(30, 4, 8, 8, 0x3b2a1a));
    }

    this.bodyRoot.add([
      this.leftLeg,
      this.rightLeg,
      leftShoe,
      rightShoe,
      this.backpack,
      this.packFlap,
      laptop,
      hips,
      shirt,
      collar,
      tie,
      this.leftArm,
      this.rightArm,
      this.diploma,
      ribbon,
      hair,
      head,
      bagL,
      bagR,
      eyeL,
      eyeR,
      mouth,
      this.capGroup,
      ...extras,
    ]);

    this.view.add([this.shadow, this.bodyRoot]);
  }

  get grounded(): boolean {
    return this.jumpY <= 0 && !this.sliding;
  }

  get airborne(): boolean {
    return this.jumpY > 0.12;
  }

  get feet(): number {
    return this.jumpY;
  }

  get head(): number {
    if (this.sliding) return 0.34;
    return this.jumpY + 0.9;
  }

  update(dt: number, speed: number): void {
    this.jumpedThisFrame = false;
    this.landedThisFrame = false;

    if (this.dead) {
      this.bodyRoot.angle += 160 * dt;
      this.bodyRoot.y += 70 * dt;
      this.bodyRoot.setScale(1.1, 0.55);
      this.view.alpha = Math.max(0.15, this.view.alpha - dt * 0.7);
      return;
    }

    this.visualLane += (this.lane - this.visualLane) * Math.min(1, dt * 14);
    this.runPhase += dt * (11 + speed * 20);
    this.squash += (1 - this.squash) * Math.min(1, dt * 10);

    if (this.jumpY > 0 || this.jumpVel > 0) {
      this.jumpVel -= JUMP_GRAVITY * dt;
      this.jumpY += this.jumpVel * dt;
      if (this.jumpY < 0) {
        this.jumpY = 0;
        this.jumpVel = 0;
        this.landedThisFrame = true;
        this.squash = 0.78;
      }
    }

    if (this.sliding) {
      this.slideTime -= dt;
      if (this.slideTime <= 0) this.sliding = false;
    }

    if (this.invincible) {
      this.invincibleTime -= dt;
      this.view.alpha = 0.55 + Math.sin(this.invincibleTime * 18) * 0.35;
      if (this.invincibleTime <= 0) {
        this.invincible = false;
        this.view.alpha = 1;
      }
    }

    if (this.coffeeTime > 0) this.coffeeTime -= dt;
    if (this.nepotismTime > 0) this.nepotismTime -= dt;

    const swing = Math.sin(this.runPhase) * (this.sliding ? 0.12 : this.airborne ? 0.25 : 0.82);
    this.leftLeg.rotation = this.airborne ? -0.55 : swing;
    this.rightLeg.rotation = this.airborne ? 0.55 : -swing;
    this.leftArm.rotation = this.airborne ? 0.7 : -swing * 0.85;
    this.rightArm.rotation = this.airborne ? -0.55 : swing * 0.85;
    if (this.tassel) this.tassel.rotation = Math.sin(this.runPhase * 1.6) * 0.32;
    this.diploma.rotation = 0.3 + Math.sin(this.runPhase) * 0.1;
    this.backpack.y = -6 + Math.sin(this.runPhase * 2) * 2.4;
    this.packFlap.y = -18 + Math.sin(this.runPhase * 2) * 2.4;
    this.capGroup.rotation = Math.sin(this.runPhase * 1.2) * 0.04;
    this.capGroup.y = Math.sin(this.runPhase * 2) * 1.4;

    const lean = this.sliding ? 12 : 7 + (this.visualLane - this.lane) * -14;
    const bob = this.airborne ? 0 : Math.abs(Math.sin(this.runPhase * 2)) * 2.4;
    if (this.sliding) {
      this.bodyRoot.setScale(1.22 * this.squash, 0.46);
      this.bodyRoot.y = -28;
      this.bodyRoot.angle = lean;
    } else {
      const stretch = this.airborne ? 1.1 : 1;
      this.bodyRoot.setScale(this.squash, stretch / this.squash);
      this.bodyRoot.y = -FOOT - this.jumpY * JUMP_PIXELS - bob;
      this.bodyRoot.angle = lean;
    }

    const pose = project(this.visualLane, 0);
    this.view.setPosition(pose.x, pose.y + 2);
    this.view.setScale(pose.scale);
    const lift = Math.min(1, this.jumpY / 1.6);
    this.shadow.setScale(1.12 - lift * 0.48, 1 - lift * 0.18);
    this.shadow.setAlpha(this.sliding ? 0.38 : 0.5 - lift * 0.28);
    this.shadow.y = 6;
  }

  tryJump(): boolean {
    if (this.dead || this.jumpY > 0 || this.sliding) return false;
    this.jumpVel = JUMP_VELOCITY;
    this.jumpY = 0.08;
    this.jumpedThisFrame = true;
    this.squash = 1.22;
    return true;
  }

  trySlide(): boolean {
    if (this.dead || this.jumpY > 0 || this.sliding) return false;
    this.sliding = true;
    this.slideTime = SLIDE_DURATION;
    this.squash = 0.86;
    return true;
  }

  shift(delta: number): boolean {
    if (this.dead) return false;
    const next = Math.max(0, Math.min(2, this.lane + delta));
    if (next === this.lane) return false;
    this.lane = next;
    return true;
  }

  grantReferral(): void {
    this.invincible = true;
    this.invincibleTime = Math.max(this.invincibleTime, 5);
  }

  grantCoffee(): void {
    this.coffeeTime = Math.max(this.coffeeTime, 4.2);
  }

  grantNepotism(): void {
    this.nepotismTime = 2.4;
  }

  grantAi(): void {
    this.aiCharges += 1;
  }

  consumeAi(): boolean {
    if (this.aiCharges <= 0) return false;
    this.aiCharges -= 1;
    return true;
  }

  kill(): void {
    this.dead = true;
    this.invincible = false;
    this.squash = 1.25;
  }
}
