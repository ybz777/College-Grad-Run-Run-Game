import type { GameEvent } from './data/types';

type Listener = (event: GameEvent) => void;

export class GameBus {
  private listeners = new Set<Listener>();

  on(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  emit(event: GameEvent): void {
    this.listeners.forEach((listener) => listener(event));
  }
}
