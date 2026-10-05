import type { Player } from '../entities/Player';
import type { WorldEntity } from '../entities/factories';

export function sharesLane(entity: WorldEntity, lane: number): boolean {
  return entity.lanes.includes(lane);
}

export function verticalOverlap(player: Player, entity: WorldEntity): boolean {
  const pad = 0.035;
  return player.feet < entity.hitTop - pad && player.head > entity.hitBottom + pad;
}

export function shouldCollide(player: Player, entity: WorldEntity): boolean {
  if (!sharesLane(entity, player.lane)) return false;
  return verticalOverlap(player, entity);
}

export function shouldCollect(player: Player, entity: WorldEntity): boolean {
  if (!sharesLane(entity, player.lane)) return false;
  if (player.sliding && entity.kind !== 'job') return false;
  return true;
}

export function crossedPlane(before: number, depth: number): boolean {
  return before > 0 && depth <= 0;
}
