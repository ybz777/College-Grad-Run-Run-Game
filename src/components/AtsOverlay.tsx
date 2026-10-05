import type { ResumeSkill } from '../game/data/types';

interface Props {
  phase: 'scan' | 'skills' | 'clear' | null;
  failSkill?: string;
  skills?: ResumeSkill[];
}

export function AtsOverlay({ phase, failSkill = 'Kubernetes', skills }: Props) {
  if (!phase || phase === 'clear') return null;
  const rows = (skills ?? [
    { name: 'Python', ok: true },
    { name: 'React', ok: true },
    { name: 'SQL', ok: true },
  ]).slice(0, 4);

  return (
    <div className="ats-card">
      <p className="eyebrow">ATS SCAN</p>
      {phase === 'skills' ? (
        <ul>
          {rows.map((skill) => (
            <li key={skill.name} className={skill.ok ? 'ok' : 'bad'}>
              {skill.name} {skill.ok ? '✓' : '✗'}
            </li>
          ))}
          <li className="bad">{failSkill} ✗</li>
        </ul>
      ) : (
        <p className="muted">One lane is safe.</p>
      )}
    </div>
  );
}
