import { useEffect, useState } from 'react';
import type { GameEvent } from '../game/data/types';

interface ToastItem {
  id: number;
  message: string;
  tone: 'gold' | 'red' | 'mint' | 'paper';
}

interface Props {
  events: GameEvent[];
}

export function ToastStack({ events }: Props) {
  const [toast, setToast] = useState<ToastItem | null>(null);

  useEffect(() => {
    const last = events[events.length - 1];
    if (!last) return;
    let item: ToastItem | null = null;
    const id = Date.now() + Math.random();
    if (last.type === 'toast') {
      item = { id, message: last.message, tone: last.tone ?? 'paper' };
    }
    if (last.type === 'achievement') {
      item = { id, message: last.title, tone: 'gold' };
    }
    if (!item) return;
    setToast(item);
    const timeout = window.setTimeout(() => {
      setToast((current) => (current?.id === id ? null : current));
    }, 1600);
    return () => window.clearTimeout(timeout);
  }, [events]);

  if (!toast) return null;

  return (
    <div className="toasts">
      <div className={`toast ${toast.tone}`}>
        <strong>{toast.message}</strong>
      </div>
    </div>
  );
}
