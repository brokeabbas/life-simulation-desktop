// src/game/ui/jobs/CoworkerProfile.tsx
import React from 'react';
import { useGame } from '../../store';
import type { Employee } from './coworkers';

type Props = {
  employee: Employee;
  companyKey: string; // `${seed}:${company}`
};

export default function CoworkerProfile({ employee, companyKey }: Props) {
  const { applyAction, applyJob, getOpinion, changeOpinion, setRelation } = useGame();
  const key = `${companyKey}:${employee.id}`;

  const base = employee.opinion0;
  const opinion = getOpinion(key, base);
  const relation = useGame((s) => s.relations[key]?.relation ?? 'neutral');

  const bump = (delta: number) => {
    const v = changeOpinion(key, delta);
    return v;
  };

  // convenience: run + adjust opinion
  const act = (id: string, label: string, deltas: Record<string, number>, opinionDelta = 0, progressDelta = 0) => {
    applyAction({ id, label, cost: 0, deltas: deltas as any });
    if (opinionDelta) bump(opinionDelta);
    if (progressDelta) applyJob({ kind: 'progress', delta: progressDelta });
  };

  // thresholds
  const canFriend = opinion >= 45;
  const canAlly = opinion >= 40;
  const canRomance = opinion >= 60;
  const isCEO = employee.id === 'ceo';

  return (
    <aside className="cwprof">
      <header className="cwprof__head">
        <div>
          <div className="title">{employee.name}</div>
          <div className="muted">{employee.title} — {employee.department}</div>
        </div>
        <span className="chip">{relationLabel(relation)}</span>
      </header>

      {/* Opinion meter */}
      <div className="cwprof__meter">
        <div className="row">
          <b>Opinion of You</b>
          <span className="muted">{opinion}%</span>
        </div>
        <div className="bar" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={opinion}>
          <div className="fill" style={{ width: `${opinion}%` }} />
        </div>
        <div className="legend">
          <span>Cold</span><span>Neutral</span><span>Warm</span><span>Trusted</span>
        </div>
      </div>

      {/* Quick facts */}
      <div className="cwprof__facts">
        <Fact k="Age" v={`${employee.age}`} />
        <Fact k="Tenure" v={`${employee.tenure}y`} />
        <Fact k="Influence" v={`${employee.influence}%`} />
        <Fact k="Baseline" v={`${employee.opinion0}%`} />
      </div>

      {/* Actions */}
      <div className="cwprof__actions">
        <Group title="Build Rapport">
          <Action
            label="Get in Contact"
            sub="Intro DM / hallway chat"
            onClick={() => act('cw.contact', `Contact ${employee.name}`, { communication: +1, confidence: +1, social: +1 }, +6, +3)}
          />
          <Action
            label="Compliment"
            sub="Praise recent work"
            onClick={() => act('cw.compliment', `Compliment ${employee.name}`, { communication: +1 }, +5)}
          />
          <Action
            label="Become Friends"
            sub="Hangouts & support (needs ≥45)"
            disabled={!canFriend}
            onClick={() => { act('cw.friend', `Become Friends with ${employee.name}`, { happiness: +2, social: +2 }, +10, +4); setRelation(key, 'friend'); }}
          />
        </Group>

        <Group title="Office Politics">
          <Action
            label="Seek Alliance"
            sub="Coordinate goals (needs ≥40)"
            disabled={!canAlly}
            onClick={() => { act('cw.ally', `Ally with ${employee.name}`, { reputation: +1, communication: +1 }, +6, +6); setRelation(key, 'ally'); }}
          />
          <Action
            label="Plot Against"
            variant="danger"
            sub="Risky sabotage & rumors"
            onClick={() => { act('cw.plot', `Plot Against ${employee.name}`, { morality: -10, reputation: -8, stress: +5 }, -18, +8); setRelation(key, 'rival'); }}
          />
        </Group>

        <Group title="Personal">
          <Action
            label="Start Romantic Relationship"
            sub={`High risk & drama (needs ≥60${isCEO ? '; CEO risk HIGH' : ''})`}
            disabled={!canRomance}
            onClick={() => { act('cw.romance', `Romance ${employee.name}`, { happiness: +3, stress: +3, reputation: -4 }, +12, +10); setRelation(key, 'romance'); }}
          />
        </Group>
      </div>
    </aside>
  );
}

/* UI bits */
function Fact({ k, v }: { k: string; v: string }) {
  return (
    <div className="fact">
      <div className="k">{k}</div>
      <div className="v">{v}</div>
    </div>
  );
}
function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="group">
      <div className="group__title">{title}</div>
      <div className="group__grid">{children}</div>
    </section>
  );
}
function Action({
  label, sub, onClick, disabled, variant = 'default',
}: { label: string; sub?: string; onClick: () => void; disabled?: boolean; variant?: 'default'|'danger' }) {
  return (
    <button
      className={`action ${variant} ${disabled ? 'is-disabled' : ''}`}
      onClick={!disabled ? onClick : undefined}
      disabled={disabled}
      title={sub}
    >
      <div className="action__label">{label}</div>
      {sub && <div className="action__sub">{sub}</div>}
    </button>
  );
}
function relationLabel(r: string) {
  switch (r) {
    case 'contact': return 'Contact';
    case 'friend': return 'Friend';
    case 'ally': return 'Ally';
    case 'rival': return 'Rival';
    case 'romance': return 'Romance';
    default: return 'Neutral';
  }
}
