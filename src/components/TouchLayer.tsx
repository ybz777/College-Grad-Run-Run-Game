import { useRef } from 'react';
import type { InputQueue } from '../game/systems/InputQueue';

interface Props {
  input: InputQueue;
  enabled: boolean;
}

export function TouchLayer({ input, enabled }: Props) {
  const start = useRef<{ x: number; y: number } | null>(null);

  if (!enabled) return null;

  const onStart = (x: number, y: number) => {
    start.current = { x, y };
  };

  const onEnd = (x: number, y: number) => {
    if (!start.current) return;
    const dx = x - start.current.x;
    const dy = y - start.current.y;
    start.current = null;
    if (Math.abs(dx) < 28 && Math.abs(dy) < 28) return;
    if (Math.abs(dx) > Math.abs(dy)) {
      if (dx < 0) input.moveLeft();
      else input.moveRight();
    } else if (dy < 0) input.doJump();
    else input.doSlide();
  };

  return (
    <div
      className="touch-layer"
      onTouchStart={(e) => {
        const t = e.changedTouches[0];
        if (t) onStart(t.clientX, t.clientY);
      }}
      onTouchEnd={(e) => {
        const t = e.changedTouches[0];
        if (t) onEnd(t.clientX, t.clientY);
      }}
    >
      <button type="button" className="zone" onClick={() => input.moveLeft()} onTouchEnd={(e) => e.stopPropagation()} aria-label="Left">
        LEFT
      </button>
      <div className="mid">
        <button type="button" className="zone" onClick={() => input.doJump()} aria-label="Jump">
          JUMP
        </button>
        <button type="button" className="zone" onClick={() => input.doSlide()} aria-label="Slide">
          SLIDE
        </button>
      </div>
      <button type="button" className="zone" onClick={() => input.moveRight()} aria-label="Right">
        RIGHT
      </button>
    </div>
  );
}
