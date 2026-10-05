import type { CharacterId } from './types';

export interface CharacterDef {
  id: CharacterId;
  name: string;
  blurb: string;
  shirt: number;
  pants: number;
  sleeve: number;
  hair: number;
  cap: boolean;
  hoodie: boolean;
  lanyard: boolean;
  coffee: boolean;
}

export const CHARACTERS: CharacterDef[] = [
  {
    id: 'grad',
    name: 'RECENT GRADUATE',
    blurb: 'Oversized cap. Unpaid optimism. Default.',
    shirt: 0x3d6ea8,
    pants: 0x2c3340,
    sleeve: 0x355f92,
    hair: 0x3b2a1a,
    cap: true,
    hoodie: false,
    lanyard: false,
    coffee: false,
  },
  {
    id: 'cs',
    name: 'CS MAJOR',
    blurb: 'Hoodie, internships, and a recursive identity crisis.',
    shirt: 0x1e293b,
    pants: 0x111827,
    sleeve: 0x334155,
    hair: 0x1a1a1a,
    cap: true,
    hoodie: true,
    lanyard: false,
    coffee: false,
  },
  {
    id: 'bootcamp',
    name: 'BOOTCAMP GRADUATE',
    blurb: 'Lanyard still on. Portfolio hotter than the market.',
    shirt: 0x0ea5e9,
    pants: 0x1e3a5f,
    sleeve: 0x38bdf8,
    hair: 0x7c2d12,
    cap: false,
    hoodie: false,
    lanyard: true,
    coffee: false,
  },
  {
    id: 'switcher',
    name: 'CAREER SWITCHER',
    blurb: 'Transferable skills. Non-transferable job titles.',
    shirt: 0x3f6212,
    pants: 0x1c1917,
    sleeve: 0x4d7c0f,
    hair: 0x44403c,
    cap: false,
    hoodie: false,
    lanyard: true,
    coffee: true,
  },
  {
    id: 'senior',
    name: 'SENIOR ENGINEER',
    blurb: 'Applying to “entry level” for the culture.',
    shirt: 0x334155,
    pants: 0x0f172a,
    sleeve: 0x475569,
    hair: 0xe5e7eb,
    cap: false,
    hoodie: false,
    lanyard: false,
    coffee: true,
  },
];

export function getCharacter(id: CharacterId | undefined): CharacterDef {
  return CHARACTERS.find((row) => row.id === id) ?? CHARACTERS[0]!;
}
