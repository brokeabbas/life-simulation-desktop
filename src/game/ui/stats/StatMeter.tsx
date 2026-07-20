// src/game/ui/stats/StatMeter.tsx
import React from 'react';
import { HeartIcon, SmileIcon, BrainIcon, CoinsIcon, StarIcon } from '../Icon';
import type { StatKey } from '../../types';

const badge = (label: string) => (
  <span
    aria-hidden
    style={{
      width: 20,
      minWidth: 20,
      height: 16,
      display: 'inline-grid',
      placeItems: 'center',
      borderRadius: 4,
      border: '1px solid rgba(255,255,255,.18)',
      fontSize: 9,
      fontWeight: 800,
      lineHeight: 1,
      color: '#cfe4ff',
    }}
  >
    {label}
  </span>
);

const ICONS: Record<StatKey, React.ReactNode> = {
  health: <HeartIcon size={16} />,
  happiness: <SmileIcon size={16} />,
  intellect: <BrainIcon size={16} />,
  wealth: <CoinsIcon size={16} />,
  reputation: <StarIcon size={16} />,
  charisma: badge('CH'),
  fitness: badge('FI'),
  sexAppeal: badge('SX'),
  luck: badge('LU'),
  discipline: badge('DI'),
  empathy: badge('EM'),
  creativity: badge('CR'),
  confidence: badge('CO'),
  hygiene: badge('HY'),
  social: badge('SO'),
  stress: badge('ST'),
  energy: badge('EN'),
  morality: badge('MO'),
  ambition: badge('AM'),
  wisdom: badge('WI'),
  cooking: badge('CK'),
  streetSmarts: badge('SS'),
  communication: badge('CM'),
  resilience: badge('RS'),
  financialLiteracy: badge('FL'),
  academicAbility: <BrainIcon size={16} />,
  workEthic: badge('WE'),
  emotionalStability: badge('EQ'),
  physicalFitness: badge('PF'),
  socialStatus: <StarIcon size={16} />,
  patience: badge('PA'),
  practicalSkill: badge('PS'),
  mentalHealth: badge('MH'),
  familyBond: <HeartIcon size={16} />,
  schoolGrades: badge('GR'),
};

function clamp01(n: number) {
  return Math.max(0, Math.min(1, n / 100));
}

function formatValue(stat: StatKey, value: number) {
  if (stat === 'wealth') return `N${Math.max(0, Math.round(value)).toLocaleString()}`;
  if (stat === 'stress') return `${Math.round(value)}%`;
  return `${Math.round(value)}`;
}

export default function StatMeter({ stat, value }: { stat: StatKey; value: number }) {
  const base = stat === 'wealth' ? Math.min(100, value / 20) : value;
  const pct = Math.round(clamp01(base) * 100);

  return (
    <div className="meter">
      <div className="label">
        <span style={{ opacity: 0.9 }}>{ICONS[stat]}</span>
        <span style={{ textTransform: 'capitalize', marginLeft: 6 }}>
          {stat.replace(/([A-Z])/g, ' $1')}
        </span>
        <span style={{ marginLeft: 'auto', color: '#cfe4ff' }}>
          {formatValue(stat, value)}
        </span>
      </div>
      <div className="bar">
        <div className="fill" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
