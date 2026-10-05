import * as Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from './data/constants';
import type { CharacterId } from './data/types';
import { GameScene } from './scenes/GameScene';
import type { GameBus } from './bus';
import type { Sfx } from './audio/sfx';
import type { InputQueue } from './systems/InputQueue';
import type { RunBridge } from './systems/RunBridge';

export function createJobRunGame(
  parent: HTMLElement,
  bus: GameBus,
  input: InputQueue,
  sfx: Sfx,
  shake: boolean,
  character: CharacterId,
  bridge: RunBridge,
): Phaser.Game {
  const game = new Phaser.Game({
    type: Phaser.AUTO,
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    parent,
    backgroundColor: '#0b1524',
    banner: false,
    disableContextMenu: true,
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    render: {
      antialias: true,
      roundPixels: false,
    },
    audio: {
      noAudio: true,
    },
    scene: [GameScene],
  });

  game.registry.set('bus', bus);
  game.registry.set('input', input);
  game.registry.set('sfx', sfx);
  game.registry.set('shake', shake);
  game.registry.set('character', character);
  game.registry.set('bridge', bridge);
  return game;
}
