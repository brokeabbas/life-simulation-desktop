import React from 'react';
import { useGame } from '../store';
import { JOBS, salaryPerDay } from '../engine';
import { CalendarIcon, BriefcaseIcon, CoinsIcon } from './Icon';
import { StatMeter } from './stats';
import AllStatsModal from './stats/AllStatsModal';
import CharacterView from './CharacterView';
import KebabMenu from './KebabMenu';
import { CORE_STAT_KEYS, type StatKey } from '../types';

type Props = {
  onOpenNewGame: () => void;
  onOpenCategory: () => void;
  onToast?: (msg: string) => void;
};

function yearsFromDays(days: number) {
  return Math.floor(days / 365);
}
const toNaira = (n: number) => `₦${Math.max(0, Math.round(n)).toLocaleString()}`;

export default function StatsPanel({ onOpenNewGame, onOpenCategory, onToast }: Props) {
  const { state } = useGame();
  const { stats, traits, dateISO, day, job, gender, star, seed } = state; // ⬅️ seed added

  const jobText = job ? `${JOBS[job.id]?.title ?? job.id} · Lv ${job.level}` : 'Unemployed';
  const daily = job ? toNaira(salaryPerDay(job)) + '/day' : '—';

  const [allOpen, setAllOpen] = React.useState(false);

  return (
    <div className="sidebar sidebar-pinned">
      {/* Life Sim title bar with menu icon on the right */}
      <div className="header" style={{ position: 'relative' }}>
        <div>
          <div className="title">FEEBLE-US</div>
          <div className="sub">Life Sim 2025</div>
        </div>
        <KebabMenu
          onOpenNewGame={onOpenNewGame}
          onOpenCategory={onOpenCategory}
          onToast={onToast}
        />
      </div>

      <div className="card" style={{ display: 'grid', gap: 12 }}>
        {/* Character */}
        <div className="avatar-wrap">
          <CharacterView gender={gender ?? 'female'} happiness={stats.happiness} />
        </div>

        {/* Info rows */}
        <div className="row" style={{ display: 'flex', gap: 10, alignItems: 'center', marginTop: -4 }}>
          <CalendarIcon />
          <b>Date</b>
          <span style={{ marginLeft: 'auto' }}>{dateISO}</span>
        </div>
        <div className="row" style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <BriefcaseIcon />
          <b>Age</b>
          <span style={{ marginLeft: 'auto' }}>{yearsFromDays(day)} yrs</span>
        </div>
        <div className="row" style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <CoinsIcon />
          <b>Wealth</b>
          <span style={{ marginLeft: 'auto' }}>{toNaira(stats.wealth)}</span>
        </div>

        {/* Stats header + modal trigger */}
        <div className="row" style={{ display: 'flex', alignItems: 'center' }}>
          <b>Stats</b>
          <button
            type="button"
            onClick={() => setAllOpen(true)}
            className="btn-ghost"
            style={{
              marginLeft: 'auto',
              fontSize: 12,
              background: 'transparent',
              color: '#cfe4ff',
              border: '1px solid rgba(255,255,255,.15)',
              padding: '4px 8px',
              borderRadius: 8,
              cursor: 'pointer',
            }}
            title="View all stats"
          >
            Show more
          </button>
        </div>

        {/* Core stats inline (classic five) */}
        <div className="stats">
          {CORE_STAT_KEYS.map((k) => (
            <StatMeter key={k} stat={k as StatKey} value={stats[k]} />
          ))}
        </div>

        {/* Details */}
        <div className="pair">
          <b>Gender</b>
          <span className="muted" style={{ textTransform: 'capitalize' }}>
            {gender}
          </span>
        </div>
        <div className="pair">
          <b>Traits</b>
          <span className="muted">{traits.join(', ') || '—'}</span>
        </div>
        <div className="pair">
          <b>Job</b>
          <span className="muted">{jobText}</span>
        </div>
        <div className="pair">
          <b>Income</b>
          <span className="muted">{daily}</span>
        </div>
      </div>

      {/* All-stats modal */}
      <AllStatsModal
        open={allOpen}
        onClose={() => setAllOpen(false)}
        stats={stats}
        star={star}
        seed={seed}
      />
    </div>
  );
}
