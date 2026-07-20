import StatMeter from '../stats/StatMeter';
import type { StatBlock, StatKey } from '../../types';

type Props = {
  keys: StatKey[];
  stats: StatBlock;
  columns?: number; // optional manual columns
};

export default function StatsStrip({ keys, stats, columns }: Props) {
  return (
    <div
      style={{
        display: 'grid',
        gap: 8,
        gridTemplateColumns: columns
          ? `repeat(${columns}, minmax(160px, 1fr))`
          : 'repeat(auto-fill, minmax(180px, 1fr))',
        marginTop: 8,
      }}
    >
      {keys.map((k) => (
        <StatMeter key={k} stat={k} value={stats[k]} />
      ))}
    </div>
  );
}
