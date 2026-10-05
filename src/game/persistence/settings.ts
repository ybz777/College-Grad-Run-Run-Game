import { SETTINGS_KEY } from '../data/constants';
import type { CharacterId, GameSettings } from '../data/types';

const DEFAULTS: GameSettings = { muted: false, shake: true, character: 'grad' };

export function loadSettings(): GameSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return { ...DEFAULTS };
    const parsed = JSON.parse(raw) as Partial<GameSettings>;
    const character = parsed.character as CharacterId | undefined;
    const allowed: CharacterId[] = ['grad', 'cs', 'bootcamp', 'switcher', 'senior'];
    return {
      muted: Boolean(parsed.muted),
      shake: parsed.shake !== false,
      character: character && allowed.includes(character) ? character : 'grad',
    };
  } catch {
    return { ...DEFAULTS };
  }
}

export function saveSettings(settings: GameSettings): void {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}
