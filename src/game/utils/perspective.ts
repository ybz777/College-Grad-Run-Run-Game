import { CENTER_X } from '../data/constants';

export const HORIZON_Y = 228;
export const GROUND_Y = 638;
export const CAM_Z = 0.3;
export const Z_FAR = 1.04;
export const Z_SPAWN = 0.94;
export const LANE_SPACING = 204;
export const ROAD_HALF_LANES = 1.64;

export interface Projected {
  x: number;
  y: number;
  scale: number;
}

export interface RoadSlice {
  z: number;
  y: number;
  scale: number;
  left: number;
  right: number;
  shoulderL: number;
  shoulderR: number;
  dividerL: number;
  dividerR: number;
  laneLeft: [number, number, number];
  laneRight: [number, number, number];
  laneCenter: [number, number, number];
}

export function depthScale(z: number): number {
  return CAM_Z / (CAM_Z + Math.max(z, -0.14));
}

export function screenY(z: number): number {
  return HORIZON_Y + (GROUND_Y - HORIZON_Y) * depthScale(z);
}

export function screenX(lane: number, z: number, extraLane = 0): number {
  return CENTER_X + (lane - 1 + extraLane) * LANE_SPACING * depthScale(z);
}

export function project(lane: number, depth: number, extraLane = 0): Projected {
  const scale = depthScale(depth);
  return {
    x: screenX(lane, depth, extraLane),
    y: screenY(depth),
    scale,
  };
}

export function roadHalf(z: number): number {
  return ROAD_HALF_LANES * LANE_SPACING * depthScale(z);
}

export function sliceAt(z: number): RoadSlice {
  const scale = depthScale(z);
  const space = LANE_SPACING * scale;
  const asphalt = ROAD_HALF_LANES * LANE_SPACING * scale;
  const c0 = CENTER_X - space;
  const c1 = CENTER_X;
  const c2 = CENTER_X + space;
  return {
    z,
    y: screenY(z),
    scale,
    left: CENTER_X - asphalt,
    right: CENTER_X + asphalt,
    shoulderL: CENTER_X - asphalt - 90 * scale,
    shoulderR: CENTER_X + asphalt + 90 * scale,
    dividerL: CENTER_X - space * 0.5,
    dividerR: CENTER_X + space * 0.5,
    laneLeft: [c0 - space * 0.5, c1 - space * 0.5, c2 - space * 0.5],
    laneRight: [c0 + space * 0.5, c1 + space * 0.5, c2 + space * 0.5],
    laneCenter: [c0, c1, c2],
  };
}

export function averageLane(lanes: number[]): number {
  if (lanes.length === 0) return 1;
  return lanes.reduce((sum, lane) => sum + lane, 0) / lanes.length;
}

export function roadZs(): number[] {
  const zs: number[] = [];
  for (let z = -0.12; z <= Z_FAR; z += 0.032) zs.push(z);
  if (zs[zs.length - 1]! < Z_FAR) zs.push(Z_FAR);
  return zs;
}

export function dashOn(z: number, scroll: number, period = 0.07): boolean {
  const v = z + scroll;
  return Math.floor((v / period + 1000) % 2) === 0;
}

