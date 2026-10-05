import * as Phaser from 'phaser';
import { ERA_SIGNS } from '../data/copy';
import type { AvoidType, EntityKind, Era, ObstacleProfile } from '../data/types';

export interface WorldEntity {
  id: number;
  kind: EntityKind;
  subtype: string;
  lanes: number[];
  depth: number;
  extraX: number;
  avoid: AvoidType;
  profile: ObstacleProfile;
  hitBottom: number;
  hitTop: number;
  collectible: boolean;
  dead: boolean;
  resolved: boolean;
  view: Phaser.GameObjects.Container;
  safeLane?: number;
  cause?: string;
  tagged?: boolean;
  hint?: string;
}

let nextId = 1;

function inferProfile(avoid: AvoidType, profile?: ObstacleProfile): ObstacleProfile {
  if (profile) return profile;
  if (avoid === 'jump') return 'low';
  if (avoid === 'slide') return 'high';
  return 'full';
}

function hitsFor(profile: ObstacleProfile): { hitBottom: number; hitTop: number } {
  if (profile === 'low') return { hitBottom: 0, hitTop: 0.4 };
  if (profile === 'high') return { hitBottom: 0.5, hitTop: 2 };
  return { hitBottom: 0, hitTop: 2 };
}

function text(
  scene: Phaser.Scene,
  value: string,
  y: number,
  size: number,
  color: string,
  wrap = 120,
): Phaser.GameObjects.Text {
  return scene.add
    .text(0, y, value, {
      fontFamily: 'Arial Black, Arial, Helvetica, sans-serif',
      fontSize: `${size}px`,
      color,
      align: 'center',
      wordWrap: { width: wrap },
    })
    .setOrigin(0.5);
}

function panel(
  scene: Phaser.Scene,
  w: number,
  h: number,
  fill: number,
  stroke: number,
  y = 0,
): Phaser.GameObjects.Rectangle {
  const rect = scene.add.rectangle(0, y, w, h, fill).setOrigin(0.5, 1);
  rect.setStrokeStyle(3, stroke, 1);
  return rect;
}

function entity(
  partial: Omit<WorldEntity, 'id' | 'dead' | 'hitBottom' | 'hitTop' | 'profile' | 'resolved' | 'tagged'> & {
    view: Phaser.GameObjects.Container;
    profile?: ObstacleProfile;
  },
): WorldEntity {
  const profile = inferProfile(partial.avoid, partial.profile);
  return {
    tagged: false,
    resolved: false,
    ...hitsFor(profile),
    ...partial,
    profile,
    id: nextId++,
    dead: false,
  };
}

function addCurb(
  scene: Phaser.Scene,
  view: Phaser.GameObjects.Container,
  profile: ObstacleProfile,
  w: number,
): void {
  const color = profile === 'low' ? 0xf5c542 : profile === 'high' ? 0x38bdf8 : 0xef4444;
  view.add(scene.add.ellipse(0, 8, w + 16, 16, 0x05070c, 0.35).setOrigin(0.5, 0.5));
  view.add(scene.add.rectangle(0, 0, w, 8, color).setOrigin(0.5, 1));
}

export function makeBillboard(
  scene: Phaser.Scene,
  lane: number,
  depth: number,
  subtype: string,
  fill: number,
  stroke: number,
  lines: Array<[string, number, string]>,
  avoid: AvoidType = 'lane',
  cause?: string,
  h = 150,
  profile?: ObstacleProfile,
): WorldEntity {
  const resolved = inferProfile(avoid, profile);
  const view = scene.add.container(0, 0);
  const w = 128;
  if (resolved === 'high') {
    const postH = 108;
    const signH = Math.min(h, 78);
    addCurb(scene, view, 'high', w);
    view.add(scene.add.rectangle(-54, 0, 12, postH, 0x64748b).setOrigin(0.5, 1));
    view.add(scene.add.rectangle(54, 0, 12, postH, 0x64748b).setOrigin(0.5, 1));
    view.add(scene.add.rectangle(0, -postH + 8, 124, 12, 0x38bdf8).setOrigin(0.5, 1));
    view.add(panel(scene, w, signH, fill, stroke, -postH));
    let y = -postH - signH + 20;
    for (const [value, size, color] of lines) {
      view.add(text(scene, value, y, size, color, 118));
      y += size + 9;
    }
  } else if (resolved === 'low') {
    const lh = Math.min(Math.max(h * 0.48, 62), 78);
    addCurb(scene, view, 'low', w + 8);
    view.add(panel(scene, w, lh, fill, stroke));
    let y = -lh + 18;
    for (const [value, size, color] of lines.slice(0, 3)) {
      view.add(text(scene, value, y, Math.min(size, 13), color, 118));
      y += Math.min(size, 13) + 8;
    }
  } else {
    addCurb(scene, view, 'full', w + 8);
    view.add(panel(scene, w + 4, h, fill, stroke));
    let y = -h + 22;
    for (const [value, size, color] of lines) {
      view.add(text(scene, value, y, size, color, 122));
      y += size + 10;
    }
  }
  return entity({
    kind: 'obstacle',
    subtype,
    lanes: [lane],
    depth,
    extraX: 0,
    avoid,
    profile: resolved,
    collectible: false,
    view,
    cause,
  });
}

export function makeFiveYears(scene: Phaser.Scene, lane: number, depth: number): WorldEntity {
  const view = scene.add.container(0, 0);
  addCurb(scene, view, 'low', 126);
  view.add(panel(scene, 118, 72, 0x0f2744, 0xf5c542));
  view.add(scene.add.rectangle(0, -72, 118, 16, 0xf5c542).setOrigin(0.5, 1));
  view.add(text(scene, 'ENTRY LEVEL', -80, 11, '#14141f', 110));
  view.add(text(scene, '5 YEARS EXPERIENCE', -42, 12, '#ff6b6b', 112));
  return entity({
    kind: 'obstacle',
    subtype: 'five_years',
    lanes: [lane],
    depth,
    extraX: 0,
    avoid: 'jump',
    profile: 'low',
    collectible: false,
    view,
  });
}

export function makeWorkAuth(scene: Phaser.Scene, lane: number, depth: number): WorldEntity {
  const view = scene.add.container(0, 0);
  addCurb(scene, view, 'full', 128);
  view.add(panel(scene, 124, 150, 0xf7f1e4, 0x1a1a2e));
  view.add(text(scene, 'HR FORM 9-B', -132, 10, '#8a6a3a'));
  view.add(text(scene, 'WORK\nAUTHORIZATION\nREQUIRED', -78, 13, '#1a1a2e'));
  view.add(text(scene, 'ATTACH 14 IDs', -22, 11, '#c0392b'));
  return entity({
    kind: 'obstacle',
    subtype: 'work_auth',
    lanes: [lane],
    depth,
    extraX: 0,
    avoid: 'lane',
    profile: 'full',
    collectible: false,
    view,
  });
}

export function makeUnpaid(scene: Phaser.Scene, lane: number, depth: number): WorldEntity {
  const view = scene.add.container(0, 0);
  addCurb(scene, view, 'low', 136);
  view.add(scene.add.rectangle(0, 0, 130, 18, 0x6b4f32).setOrigin(0.5, 1));
  view.add(scene.add.rectangle(-40, -18, 12, 36, 0x4a3624).setOrigin(0.5, 1));
  view.add(scene.add.rectangle(40, -18, 12, 36, 0x4a3624).setOrigin(0.5, 1));
  view.add(scene.add.rectangle(0, -18, 120, 10, 0x3d6ea8).setOrigin(0.5, 1));
  view.add(scene.add.rectangle(20, -40, 28, 18, 0x1e293b).setOrigin(0.5, 1));
  view.add(panel(scene, 108, 36, 0xf4ead5, 0xc0392b, -48));
  view.add(text(scene, 'UNPAID INTERNSHIP', -66, 11, '#c0392b', 104));
  return entity({
    kind: 'obstacle',
    subtype: 'unpaid',
    lanes: [lane],
    depth,
    extraX: 0,
    avoid: 'jump',
    profile: 'low',
    collectible: false,
    view,
  });
}

export function makeReposted(scene: Phaser.Scene, lane: number, depth: number): WorldEntity {
  return makeBillboard(
    scene,
    lane,
    depth,
    'reposted',
    0x152238,
    0x7dd3fc,
    [
      ['JOB POSTED', 12, '#7dd3fc'],
      ['47 TIMES', 16, '#ffffff'],
      ['STILL "URGENT"', 11, '#f5c542'],
    ],
    'jump',
    'GHOST JOB DETECTED',
    150,
    'low',
  );
}

export function makeRto(scene: Phaser.Scene, lanes: number[], depth: number): WorldEntity {
  const view = scene.add.container(0, 0);
  const w = lanes.length > 1 ? 210 : 140;
  addCurb(scene, view, 'high', w);
  view.add(scene.add.rectangle(-w / 2 + 8, 0, 14, 110, 0x94a3b8).setOrigin(0.5, 1));
  view.add(scene.add.rectangle(w / 2 - 8, 0, 14, 110, 0x94a3b8).setOrigin(0.5, 1));
  view.add(scene.add.rectangle(0, -110, w - 8, 16, 0x38bdf8).setOrigin(0.5, 1));
  view.add(panel(scene, w, 70, 0x334155, 0xe2e8f0, -118));
  for (let r = 0; r < 2; r += 1) {
    for (let c = 0; c < (lanes.length > 1 ? 4 : 3); c += 1) {
      const x = -w / 2 + 28 + c * 32;
      const y = -130 - r * 22;
      view.add(scene.add.rectangle(x, y, 18, 16, 0x7dd3fc, 0.55).setOrigin(0.5, 1));
    }
  }
  view.add(text(scene, 'RETURN TO OFFICE', -168, 11, '#f5c542', w - 12));
  return entity({
    kind: 'obstacle',
    subtype: 'rto',
    lanes,
    depth,
    extraX: 0,
    avoid: 'slide',
    profile: 'high',
    collectible: false,
    view,
  });
}

export function makeSalary(scene: Phaser.Scene, lane: number, depth: number): WorldEntity {
  return makeBillboard(
    scene,
    lane,
    depth,
    'salary',
    0x14532d,
    0x86efac,
    [
      ['SALARY', 12, '#86efac'],
      ['COMPETITIVE', 14, '#f4ead5'],
      ['DO NOT ASK', 11, '#bbf7d0'],
    ],
    'slide',
    'SALARY: COMPETITIVE',
    140,
    'high',
  );
}

export function makeEliminated(scene: Phaser.Scene, lane: number, depth: number): WorldEntity {
  const view = scene.add.container(0, 0);
  addCurb(scene, view, 'full', 140);
  view.add(panel(scene, 136, 148, 0x7f1d1d, 0xfca5a5));
  view.add(text(scene, 'CORPORATE NOTICE', -128, 10, '#fecaca'));
  view.add(text(scene, 'POSITION\nELIMINATED', -78, 16, '#ffffff'));
  view.add(text(scene, 'CHANGE LANES', -22, 11, '#fca5a5'));
  return entity({
    kind: 'obstacle',
    subtype: 'eliminated',
    lanes: [lane],
    depth,
    extraX: 0,
    avoid: 'lane',
    profile: 'full',
    collectible: false,
    view,
  });
}

function oldExecutive(
  scene: Phaser.Scene,
  suit: number,
  tie: number,
): Phaser.GameObjects.GameObject[] {
  const chair = scene.add.rectangle(0, 8, 86, 70, 0x1f2937).setOrigin(0.5, 1);
  const chairBack = scene.add.rectangle(0, -62, 90, 70, 0x111827).setOrigin(0.5, 1);
  const body = scene.add.rectangle(0, -28, 54, 50, suit).setOrigin(0.5, 1);
  const head = scene.add.circle(0, -86, 16, 0xe8c4a0);
  const hair = scene.add.ellipse(0, -98, 28, 10, 0xf8fafc);
  const brow = scene.add.rectangle(0, -90, 20, 3, 0xd6d3d1);
  const eyeL = scene.add.circle(-6, -86, 2, 0x1a1a1a);
  const eyeR = scene.add.circle(6, -86, 2, 0x1a1a1a);
  const tieObj = scene.add.rectangle(0, -40, 8, 24, tie).setOrigin(0.5, 1);
  return [chairBack, chair, body, tieObj, head, hair, brow, eyeL, eyeR];
}

export function makeCareerLifer(scene: Phaser.Scene, lane: number, depth: number): WorldEntity {
  const view = scene.add.container(0, 0);
  view.add(oldExecutive(scene, 0x1e3a5f, 0xb91c1c));
  const paper = scene.add.rectangle(28, -48, 26, 20, 0xf4ead5).setAngle(12);
  view.add(paper);
  view.add(panel(scene, 120, 36, 0xf5c542, 0x1a1a2e, -118));
  view.add(text(scene, 'BACK IN MY DAY...', -136, 11, '#14141f', 118));
  return entity({
    kind: 'npc',
    subtype: 'career_lifer',
    lanes: [lane],
    depth,
    extraX: 0,
    avoid: 'lane',
    collectible: false,
    view,
  });
}

export function makePermanentChair(scene: Phaser.Scene, lanes: number[], depth: number): WorldEntity {
  const view = scene.add.container(0, 0);
  view.add(scene.add.rectangle(0, 6, 200, 24, 0x0f172a).setOrigin(0.5, 1));
  view.add(oldExecutive(scene, 0x111827, 0x1d4ed8));
  view.add(panel(scene, 170, 40, 0xe2e8f0, 0x0f172a, -128));
  view.add(text(scene, 'IN OFFICE SINCE\nTHE MAINFRAME ERA', -148, 11, '#0f172a', 160));
  return entity({
    kind: 'npc',
    subtype: 'permanent_chair',
    lanes,
    depth,
    extraX: 0,
    avoid: 'lane',
    collectible: false,
    view,
  });
}

export function makeStatesman(scene: Phaser.Scene, lane: number, depth: number): WorldEntity {
  const view = scene.add.container(0, 0);
  view.add(oldExecutive(scene, 0x1f2937, 0xf5c542));
  view.add(scene.add.circle(26, -44, 8, 0xf4ead5));
  view.add(scene.add.rectangle(26, -36, 6, 10, 0xf4ead5));
  view.add(panel(scene, 150, 48, 0xffffff, 0x1a1a2e, -128));
  view.add(text(scene, 'YOUNG PEOPLE JUST\nDON\'T WANT TO WORK.', -152, 10, '#1a1a2e', 144));
  return entity({
    kind: 'npc',
    subtype: 'statesman',
    lanes: [lane],
    depth,
    extraX: 0,
    avoid: 'lane',
    collectible: false,
    view,
  });
}

export function makeExperience(scene: Phaser.Scene, lane: number, depth: number): WorldEntity {
  const view = scene.add.container(0, 0);
  view.add(scene.add.rectangle(0, 0, 44, 58, 0xf4ead5).setOrigin(0.5, 1).setStrokeStyle(2, 0xf5c542));
  view.add(text(scene, 'CV', -32, 14, '#1a1a2e', 40));
  view.add(scene.add.circle(0, -70, 6, 0xf5c542, 0.9));
  return entity({
    kind: 'collectible',
    subtype: 'experience',
    lanes: [lane],
    depth,
    extraX: 0,
    avoid: 'lane',
    collectible: true,
    view,
  });
}

export function makeReferral(scene: Phaser.Scene, lane: number, depth: number): WorldEntity {
  const view = scene.add.container(0, 0);
  view.add(scene.add.rectangle(0, 0, 70, 44, 0xf5c542).setOrigin(0.5, 1).setStrokeStyle(3, 0xfff7d6));
  view.add(text(scene, 'REFERRAL', -22, 11, '#14141f', 66));
  return entity({
    kind: 'collectible',
    subtype: 'referral',
    lanes: [lane],
    depth,
    extraX: 0,
    avoid: 'lane',
    collectible: true,
    view,
  });
}

export function makeCoffee(scene: Phaser.Scene, lane: number, depth: number): WorldEntity {
  const view = scene.add.container(0, 0);
  view.add(scene.add.rectangle(0, 0, 28, 36, 0xf4ead5).setOrigin(0.5, 1));
  view.add(scene.add.rectangle(0, -8, 22, 22, 0x3b2a1a).setOrigin(0.5, 1));
  view.add(scene.add.rectangle(18, -18, 10, 16, 0xf4ead5).setOrigin(0.5, 1));
  view.add(text(scene, 'COFFEE', -48, 10, '#f5c542', 70));
  return entity({
    kind: 'collectible',
    subtype: 'coffee',
    lanes: [lane],
    depth,
    extraX: 0,
    avoid: 'lane',
    collectible: true,
    view,
  });
}

export function makeNetworking(scene: Phaser.Scene, lane: number, depth: number): WorldEntity {
  const view = scene.add.container(0, 0);
  view.add(scene.add.circle(0, -18, 22, 0x1d4ed8));
  view.add(scene.add.circle(0, -18, 10, 0x93c5fd));
  view.add(text(scene, 'CONNECT', -48, 10, '#dbeafe', 80));
  return entity({
    kind: 'collectible',
    subtype: 'networking',
    lanes: [lane],
    depth,
    extraX: 0,
    avoid: 'lane',
    collectible: true,
    view,
  });
}

export function makeNepotism(scene: Phaser.Scene, lane: number, depth: number): WorldEntity {
  const view = scene.add.container(0, 0);
  view.add(scene.add.rectangle(0, 0, 76, 48, 0x7c3aed).setOrigin(0.5, 1).setStrokeStyle(3, 0xf5c542));
  view.add(text(scene, 'NEPOTISM', -24, 11, '#f5c542', 72));
  return entity({
    kind: 'collectible',
    subtype: 'nepotism',
    lanes: [lane],
    depth,
    extraX: 0,
    avoid: 'lane',
    collectible: true,
    view,
  });
}

export function makeAiPickup(scene: Phaser.Scene, lane: number, depth: number): WorldEntity {
  const view = scene.add.container(0, 0);
  view.add(scene.add.rectangle(0, 0, 64, 44, 0x0f172a).setOrigin(0.5, 1).setStrokeStyle(2, 0x3ee0a0));
  view.add(text(scene, 'AI', -22, 16, '#3ee0a0', 50));
  return entity({
    kind: 'collectible',
    subtype: 'ai',
    lanes: [lane],
    depth,
    extraX: 0,
    avoid: 'lane',
    collectible: true,
    view,
  });
}

export function makeJobPosting(scene: Phaser.Scene, lane: number, depth: number): WorldEntity {
  const view = scene.add.container(0, 0);
  view.add(panel(scene, 130, 168, 0xfffffe, 0x1e3a5f));
  view.add(text(scene, 'SOFTWARE ENGINEER', -150, 10, '#1e3a5f', 120));
  view.add(text(scene, 'ENTRY LEVEL', -128, 11, '#c0392b', 120));
  view.add(text(scene, '✓ Bachelor\'s\n✓ Python  ✓ SQL\n✓ React  ✓ Leadership', -78, 10, '#1a1a2e', 118));
  view.add(text(scene, '5 YEARS EXPERIENCE', -28, 10, '#b45309', 120));
  view.add(text(scene, 'Salary: COMPETITIVE', -10, 9, '#64748b', 120));
  return entity({
    kind: 'job',
    subtype: 'job_post',
    lanes: [lane],
    depth,
    extraX: 0,
    avoid: 'lane',
    collectible: true,
    view,
  });
}

export function makeAts(scene: Phaser.Scene, blocked: number[], safeLane: number, depth: number): WorldEntity {
  const view = scene.add.container(0, 0);
  const w = Math.max(180, blocked.length * 188);
  addCurb(scene, view, 'full', w);
  view.add(scene.add.rectangle(0, 0, w, 28, 0x111827).setOrigin(0.5, 1));
  view.add(scene.add.rectangle(0, -28, w - 16, 150, 0x334155).setOrigin(0.5, 1).setStrokeStyle(4, 0xef4444));
  view.add(scene.add.circle(-40, -150, 16, 0x22c55e));
  view.add(scene.add.circle(40, -150, 16, 0xef4444));
  view.add(scene.add.rectangle(0, -88, w - 50, 18, 0x0ea5e9).setOrigin(0.5, 1));
  view.add(text(scene, 'ATS MONSTER', -172, 14, '#fecaca', w - 8));
  view.add(text(scene, 'SAFE LANE OPEN', -20, 12, '#86efac', w - 8));
  return entity({
    kind: 'ats',
    subtype: 'ats',
    lanes: blocked,
    depth,
    extraX: 0,
    avoid: 'lane',
    profile: 'full',
    collectible: false,
    view,
    safeLane,
  });
}

export function makeDecor(
  scene: Phaser.Scene,
  side: -1 | 1,
  depth: number,
  variant: number,
  era: Era = 'early',
): WorldEntity {
  const view = scene.add.container(0, 0);
  const extraX = side * 2.22;
  const kind = variant % 6;
  const signs = ERA_SIGNS[era];

  if (kind === 0) {
    const h = 180 + (variant % 4) * 26;
    view.add(scene.add.rectangle(0, 0, 90, h, 0x1e293b).setOrigin(0.5, 1));
    for (let r = 0; r < 6; r += 1) {
      for (let c = 0; c < 3; c += 1) {
        view.add(
          scene.add
            .rectangle(-24 + c * 24, -20 - r * 24, 14, 12, 0xf5c542, 0.35 + ((r + c + variant) % 3) * 0.2)
            .setOrigin(0.5, 1),
        );
      }
    }
  } else if (kind === 1) {
    view.add(scene.add.rectangle(0, 0, 120, 90, 0x334155).setOrigin(0.5, 1));
    view.add(scene.add.rectangle(0, -90, 130, 16, 0x1e293b).setOrigin(0.5, 1));
    view.add(text(scene, 'PARKING', -50, 12, '#e2e8f0', 110));
  } else if (kind === 2) {
    view.add(scene.add.rectangle(0, 0, 70, 70, 0x7c2d12).setOrigin(0.5, 1));
    view.add(scene.add.circle(-8, -48, 10, 0xf4ead5));
    view.add(text(scene, 'BEAN\nTHERE', -88, 11, '#f4ead5', 80));
  } else if (kind === 3) {
    view.add(scene.add.rectangle(0, 0, 8, 160, 0xf59e0b).setOrigin(0.5, 1));
    view.add(scene.add.rectangle(30, -150, 70, 8, 0xf59e0b).setOrigin(0.5, 1));
    view.add(scene.add.rectangle(60, -130, 8, 40, 0x111827).setOrigin(0.5, 1));
  } else if (kind === 4) {
    view.add(scene.add.rectangle(0, 0, 140, 70, 0x0f172a).setOrigin(0.5, 1));
    view.add(text(scene, 'CAMPUS 7', -36, 14, '#7dd3fc', 130));
    view.add(text(scene, 'PING PONG REQUIRED', -14, 9, '#94a3b8', 130));
  } else {
    const sign = signs[variant % signs.length]!;
    view.add(scene.add.rectangle(0, 0, 8, 90, 0x334155).setOrigin(0.5, 1));
    view.add(scene.add.rectangle(0, -90, 130, 52, sign.color).setOrigin(0.5, 1));
    view.add(text(scene, sign.title, -116, 11, '#ffffff', 124));
  }

  return entity({
    kind: 'decor',
    subtype: 'decor',
    lanes: [side < 0 ? 0 : 2],
    depth,
    extraX,
    avoid: 'lane',
    collectible: false,
    view,
  });
}

export function makeAutoReject(scene: Phaser.Scene, lane: number, depth: number): WorldEntity {
  return makeBillboard(
    scene,
    lane,
    depth,
    'auto_reject',
    0xf7f1e4,
    0x1a1a2e,
    [
      ['THANK YOU FOR', 11, '#1a1a2e'],
      ['YOUR INTEREST', 11, '#1a1a2e'],
      ['You were not selected.', 11, '#c0392b'],
    ],
    'jump',
    'WE WENT WITH ANOTHER CANDIDATE',
    150,
    'low',
  );
}

export function makeGhostJob(scene: Phaser.Scene, lane: number, depth: number): WorldEntity {
  return makeBillboard(
    scene,
    lane,
    depth,
    'ghost_job',
    0x0f172a,
    0x7dd3fc,
    [
      ['SOFTWARE ENGINEER', 10, '#7dd3fc'],
      ['ENTRY LEVEL', 12, '#f5c542'],
      ['POSTED 183 DAYS AGO', 10, '#e2e8f0'],
      ['APPS: 4,821', 11, '#fca5a5'],
      ['MAY NO LONGER EXIST', 10, '#94a3b8'],
    ],
    'slide',
    'POSITION MAY NO LONGER EXIST',
    150,
    'high',
  );
}

export function makeRepostLoop(scene: Phaser.Scene, lane: number, depth: number): WorldEntity {
  return makeBillboard(
    scene,
    lane,
    depth,
    'repost_loop',
    0x152238,
    0xf5c542,
    [
      ['NEW JOB POSTING!', 12, '#f5c542'],
      ['Same as last month.', 10, '#e2e8f0'],
      ['Posted again.', 11, '#94a3b8'],
      ['Posted again.', 11, '#94a3b8'],
      ['Posted again.', 11, '#64748b'],
    ],
    'jump',
    'GHOST JOB DETECTED',
    150,
    'low',
  );
}

export function makeVideoInterview(scene: Phaser.Scene, lane: number, depth: number): WorldEntity {
  const view = scene.add.container(0, 0);
  addCurb(scene, view, 'low', 126);
  view.add(scene.add.rectangle(0, 0, 120, 58, 0x0f172a).setOrigin(0.5, 1).setStrokeStyle(4, 0x38bdf8));
  view.add(scene.add.circle(0, -36, 12, 0x1e293b));
  view.add(text(scene, '5-MINUTE VIDEO', -72, 11, '#e2e8f0', 118));
  view.add(text(scene, 'Q 1 OF 47', -16, 10, '#f5c542', 118));
  return entity({
    kind: 'obstacle',
    subtype: 'video',
    lanes: [lane],
    depth,
    extraX: 0,
    avoid: 'jump',
    profile: 'low',
    collectible: false,
    view,
    cause: 'PLEASE RECORD A 5-MINUTE VIDEO',
  });
}

export function makeTakeHome(scene: Phaser.Scene, lane: number, depth: number): WorldEntity {
  return makeBillboard(
    scene,
    lane,
    depth,
    'takehome',
    0x1e293b,
    0x38bdf8,
    [
      ['ENTRY LEVEL', 11, '#f5c542'],
      ['TAKE-HOME PROJECT', 12, '#ffffff'],
      ['EST. TIME: 4 HOURS', 10, '#7dd3fc'],
      ['DEADLINE: TOMORROW', 11, '#fca5a5'],
      ['ACTUAL: 17 HOURS', 10, '#94a3b8'],
    ],
    'slide',
    'DEADLINE: TOMORROW',
    140,
    'high',
  );
}

export function makeFiveRound(scene: Phaser.Scene, lane: number, depth: number): WorldEntity {
  return makeBillboard(
    scene,
    lane,
    depth,
    'five_round',
    0x111827,
    0x3ee0a0,
    [
      ['INTERVIEW PROCESS', 11, '#3ee0a0'],
      ['ROUND 1 ✓  2 ✓  3 ✓', 10, '#86efac'],
      ['ROUND 4 ✓  5 …', 11, '#f4ead5'],
      ['ONE MORE QUICK ROUND', 11, '#f5c542'],
    ],
    'lane',
    'ONE MORE QUICK ROUND',
  );
}

export function makeGhosted(scene: Phaser.Scene, lane: number, depth: number): WorldEntity {
  const view = scene.add.container(0, 0);
  addCurb(scene, view, 'low', 100);
  view.add(scene.add.rectangle(0, 0, 86, 72, 0x0f172a).setOrigin(0.5, 1).setStrokeStyle(3, 0x93c5fd));
  view.add(text(scene, 'NO RESPONSE', -52, 11, '#fca5a5', 80));
  view.add(text(scene, '47 DAYS', -22, 12, '#e2e8f0', 80));
  return entity({
    kind: 'obstacle',
    subtype: 'ghosted',
    lanes: [lane],
    depth,
    extraX: 0,
    avoid: 'jump',
    profile: 'low',
    collectible: false,
    view,
    cause: 'NO RESPONSE FOR 47 DAYS',
  });
}

export function makeInflation(scene: Phaser.Scene, lane: number, depth: number): WorldEntity {
  return makeBillboard(
    scene,
    lane,
    depth,
    'inflation',
    0x1e3a5f,
    0xf5c542,
    [
      ['ENTRY LEVEL', 12, '#f5c542'],
      ['2–5 YEARS REQUIRED', 11, '#fecaca'],
      ['RECENT GRADUATES', 11, '#ffffff'],
      ['WELCOME', 13, '#86efac'],
    ],
    'jump',
    'RECENT GRADUATES WELCOME',
    150,
    'low',
  );
}

export function makeDegree(scene: Phaser.Scene, lane: number, depth: number): WorldEntity {
  return makeBillboard(
    scene,
    lane,
    depth,
    'degree',
    0x0f2744,
    0xe2e8f0,
    [
      ["BACHELOR'S REQUIRED", 10, '#e2e8f0'],
      ["MASTER'S PREFERRED", 10, '#94a3b8'],
      ['PhD A PLUS', 11, '#f5c542'],
      ['10 YEARS EXPERIENCE', 11, '#fca5a5'],
    ],
    'slide',
    'PhD A PLUS',
    140,
    'high',
  );
}

export function makePythonFlood(scene: Phaser.Scene, lane: number, depth: number): WorldEntity {
  return makeBillboard(
    scene,
    lane,
    depth,
    'python_flood',
    0x1e3a5f,
    0xfacc15,
    [
      ['PYTHON', 16, '#facc15'],
      ['REQUIREMENT: BASIC', 10, '#e2e8f0'],
      ['APPLICANTS: 48,392', 12, '#fca5a5'],
    ],
    'jump',
    'EVERYONE LEARNED PYTHON',
    150,
    'low',
  );
}

export function makeAiCoder(scene: Phaser.Scene, lane: number, depth: number): WorldEntity {
  const view = scene.add.container(0, 0);
  addCurb(scene, view, 'full', 132);
  view.add(scene.add.rectangle(0, 0, 128, 140, 0x022c22).setOrigin(0.5, 1).setStrokeStyle(3, 0x3ee0a0));
  view.add(scene.add.circle(-18, -110, 12, 0x3ee0a0));
  view.add(scene.add.circle(18, -110, 12, 0x3ee0a0));
  view.add(text(scene, 'AI CAN WRITE\nTHIS CODE', -70, 11, '#ecfdf5', 120));
  view.add(text(scene, 'WHY HIRE YOU?', -28, 11, '#f5c542', 120));
  view.add(text(scene, 'AI EXPERIENCE REQUIRED', -8, 9, '#86efac', 124));
  return entity({
    kind: 'obstacle',
    subtype: 'ai_code',
    lanes: [lane],
    depth,
    extraX: 0,
    avoid: 'lane',
    profile: 'full',
    collectible: false,
    view,
    cause: 'AI CAN WRITE THIS CODE',
  });
}

export function makeTenX(scene: Phaser.Scene, lane: number, depth: number): WorldEntity {
  return makeBillboard(
    scene,
    lane,
    depth,
    'ten_x',
    0x3b0764,
    0xf5c542,
    [
      ['10X ENGINEER', 14, '#f5c542'],
      ['REQUIRED', 12, '#ffffff'],
      ['ENTRY LEVEL', 12, '#fca5a5'],
    ],
    'lane',
    '10X ENGINEER REQUIRED',
  );
}

export function makeFullStack(scene: Phaser.Scene, lane: number, depth: number): WorldEntity {
  return makeBillboard(
    scene,
    lane,
    depth,
    'fullstack',
    0x111827,
    0x38bdf8,
    [
      ['FULL STACK', 13, '#38bdf8'],
      ['Python Java C++ Go', 9, '#cbd5e1'],
      ['React AWS K8s ML', 9, '#cbd5e1'],
      ['ENTRY LEVEL', 12, '#f5c542'],
    ],
    'lane',
    'ENTRY LEVEL FULL STACK',
    150,
  );
}

export function makeJustOneMore(scene: Phaser.Scene, lane: number, depth: number): WorldEntity {
  return makeBillboard(
    scene,
    lane,
    depth,
    'just_one_more',
    0x0f172a,
    0xef4444,
    [
      ['Python ✓  SQL ✓', 11, '#86efac'],
      ['React ✓  Cloud ✓', 11, '#86efac'],
      ['Kubernetes ✗', 13, '#fca5a5'],
      ['REJECTED', 14, '#ef4444'],
    ],
    'lane',
    'KUBERNETES ✗',
  );
}

export function makeAiReplaced(scene: Phaser.Scene, lane: number, depth: number): WorldEntity {
  return makeBillboard(
    scene,
    lane,
    depth,
    'ai_replaced',
    0x052e16,
    0x3ee0a0,
    [
      ['NOW HIRING', 11, '#3ee0a0'],
      ['AI ENGINEER', 13, '#ffffff'],
      ['5 YEARS GEN AI', 10, '#bbf7d0'],
      ['Must have used AI', 10, '#f5c542'],
      ['before AI existed.', 10, '#f5c542'],
    ],
    'lane',
    'AI REPLACED YOUR ENTRY-LEVEL POSITION',
    168,
    'full',
  );
}

export function makeSponsorship(scene: Phaser.Scene, lane: number, depth: number): WorldEntity {
  return makeBillboard(
    scene,
    lane,
    depth,
    'sponsorship',
    0xf7f1e4,
    0x1a1a2e,
    [
      ['SOFTWARE ENGINEER', 10, '#1a1a2e'],
      ['ENTRY LEVEL', 11, '#9a3412'],
      ['SPONSORSHIP?', 12, '#1a1a2e'],
      ['NO', 18, '#c0392b'],
      ['GOOD LUCK', 11, '#64748b'],
    ],
    'lane',
    'H-1B SPONSORSHIP: NO',
    168,
  );
}

export function makeVisaForms(scene: Phaser.Scene, lane: number, depth: number): WorldEntity {
  const view = scene.add.container(0, 0);
  addCurb(scene, view, 'low', 110);
  view.add(scene.add.rectangle(8, 0, 90, 64, 0xe2e8f0).setOrigin(0.5, 1));
  view.add(scene.add.rectangle(-6, -6, 90, 64, 0xf4ead5).setOrigin(0.5, 1));
  view.add(scene.add.rectangle(-16, -12, 90, 64, 0xfffbeb).setOrigin(0.5, 1).setStrokeStyle(2, 0x1a1a2e));
  view.add(text(scene, 'FORM 1  2  3  4', -58, 11, '#1a1a2e', 110));
  view.add(text(scene, 'HR HAS NOT RESPONDED', -28, 10, '#c0392b', 110));
  return entity({
    kind: 'obstacle',
    subtype: 'visa_forms',
    lanes: [lane],
    depth,
    extraX: 0,
    avoid: 'jump',
    profile: 'low',
    collectible: false,
    view,
    cause: 'HR HAS NOT RESPONDED',
  });
}

export function makeGlobalNo(scene: Phaser.Scene, lane: number, depth: number): WorldEntity {
  return makeBillboard(
    scene,
    lane,
    depth,
    'global_no',
    0x0f2744,
    0xf5c542,
    [
      ['GLOBAL COMPANY', 11, '#f5c542'],
      ['INTERNATIONAL TEAM', 10, '#e2e8f0'],
      ['WORK AUTH REQUIRED', 10, '#fca5a5'],
      ['SPONSORSHIP: NO', 12, '#ef4444'],
    ],
    'lane',
    'WORK AUTHORIZATION REQUIRED',
  );
}

export function makeLaborSign(
  scene: Phaser.Scene,
  lane: number,
  depth: number,
  headline: string,
  subtype: string,
): WorldEntity {
  return makeBillboard(
    scene,
    lane,
    depth,
    subtype,
    0x7f1d1d,
    0xfca5a5,
    [
      ['CORPORATE NOTICE', 10, '#fecaca'],
      [headline, 13, '#ffffff'],
      ['PLEASE REMAIN PASSIONATE', 9, '#f4ead5'],
    ],
    'lane',
    headline,
    140,
    'full',
  );
}
