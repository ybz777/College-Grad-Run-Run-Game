import * as Phaser from 'phaser';

interface Puff {
  rect: Phaser.GameObjects.Rectangle;
  vx: number;
  vy: number;
  life: number;
}

export class Fx {
  private puffs: Puff[] = [];
  private flashRect: Phaser.GameObjects.Rectangle;
  private flashLife = 0;
  private scene: Phaser.Scene;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.flashRect = scene.add.rectangle(480, 360, 960, 720, 0xff3b3b, 0).setDepth(4000).setScrollFactor(0);
  }

  burst(x: number, y: number, color: number, count = 8): void {
    const n = Math.min(count, 28 - this.puffs.length);
    for (let i = 0; i < n; i += 1) {
      const rect = this.scene.add.rectangle(x, y, 6 + Math.random() * 6, 6, color, 0.9).setDepth(2500);
      this.puffs.push({
        rect,
        vx: (Math.random() - 0.5) * 220,
        vy: -40 - Math.random() * 180,
        life: 0.35 + Math.random() * 0.25,
      });
    }
  }

  dust(x: number, y: number): void {
    this.burst(x, y + 18, 0xd6d3d1, 6);
  }

  floatText(x: number, y: number, value: string, color = '#f5c542'): void {
    const label = this.scene.add
      .text(x, y - 70, value, {
        fontFamily: 'Arial Black, Arial, sans-serif',
        fontSize: '18px',
        color,
        stroke: '#0b1524',
        strokeThickness: 4,
      })
      .setOrigin(0.5)
      .setDepth(2600);
    this.scene.tweens.add({
      targets: label,
      y: y - 130,
      alpha: 0,
      duration: 720,
      ease: 'Cubic.easeOut',
      onComplete: () => label.destroy(),
    });
  }

  flash(color = 0xff3b3b, alpha = 0.28): void {
    this.flashRect.fillColor = color;
    this.flashRect.setAlpha(alpha);
    this.flashLife = 0.16;
  }

  update(dt: number): void {
    if (this.flashLife > 0) {
      this.flashLife -= dt;
      this.flashRect.setAlpha(Math.max(0, this.flashLife * 1.6));
    }
    const keep: Puff[] = [];
    for (const puff of this.puffs) {
      puff.life -= dt;
      puff.rect.x += puff.vx * dt;
      puff.rect.y += puff.vy * dt;
      puff.vy += 280 * dt;
      puff.rect.setAlpha(Math.max(0, puff.life * 3));
      if (puff.life <= 0) puff.rect.destroy();
      else keep.push(puff);
    }
    this.puffs = keep;
  }

  destroy(): void {
    this.puffs.forEach((puff) => puff.rect.destroy());
    this.puffs = [];
    this.flashRect.destroy();
  }
}
