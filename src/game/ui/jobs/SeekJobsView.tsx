import React from 'react';
import { useGame } from '../../store';
import { JOBS } from '../../engine';
import JobCard from './JobCard';
import { CAREER_LEVELS } from './careerLevels';
import { PROFESSIONAL_STAT_KEYS, type StatKey } from '../../types';
import { StatMeter } from '../stats';
import JobDetailModal from './JobDetailModal';
import { generateJobMarket } from './jobMarket';

const toNaira = (n: number) => `₦${Math.max(0, Math.round(n)).toLocaleString()}`;

export default function SeekJobsView() {
  const { state } = useGame();
  const { stats, job } = state;

  const [detailJobId, setDetailJobId] = React.useState<string | null>(null);

  const entries = React.useMemo(() => Object.values(JOBS).map(j => ({
    id: j.id,
    title: j.title,
    basePerDay: j.basePerDay,
    perLevel: j.perLevel,
    maxLevel: j.maxLevel,
    minIntellect: j.minIntellect ?? 0,
  })), []);

  const market = React.useMemo(() => generateJobMarket(state), [state.seed, state.day]); // deterministic by day
  const miniKeys: StatKey[] = (PROFESSIONAL_STAT_KEYS.slice(0, 3) as StatKey[]);

  return (
    <>
      <div style={{ display: 'grid', gap: 12 }}>
        {/* Minimal professional profile */}
        <div className="card" style={{ display: 'grid', gap: 10 }}>
          <div style={{ fontWeight: 800 }}>Professional Profile</div>
          <div className="stats" style={{ gridTemplateColumns: '1fr', gap: 8 }}>
            {miniKeys.map(k => (
              <StatMeter key={k} stat={k} value={stats[k]} />
            ))}
          </div>
        </div>

        {/* Tracks: exactly 5 per row */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(5, minmax(220px, 1fr))',
            gap: 12,
            alignItems: 'start',
          }}
        >
          {entries.map(j => {
            const applyingToCurrent = job?.id === j.id;
            const s0 = j.basePerDay + j.perLevel * 0;
            const sMax = j.basePerDay + j.perLevel * Math.max(0, j.maxLevel);
            const listings = market.byJob[j.id] ?? [];
            const avgDemand = listings.length
              ? Math.round(listings.reduce((a, b) => a + b.demand, 0) / listings.length)
              : null;

            return (
              <JobCard
                key={j.id}
                title={j.title}
                salaryPerDay={`${toNaira(s0)}/day`}
                maxInfo={`to ~${toNaira(sMax)}/day (Lv ${j.maxLevel})`}
                req={j.minIntellect ? `Requires Intellect ≥ ${j.minIntellect}` : null}
                levels={CAREER_LEVELS[j.id] ?? []}
                maxLevel={j.maxLevel}
                currentLevel={applyingToCurrent ? job!.level : undefined}
                applyingToCurrent={applyingToCurrent}
                onOpen={() => setDetailJobId(j.id)}
                listingsCount={listings.length}
                avgDemand={avgDemand}
              />
            );
          })}
        </div>
      </div>

      {detailJobId && (
        <JobDetailModal jobId={detailJobId} onClose={() => setDetailJobId(null)} />
      )}
    </>
  );
}
