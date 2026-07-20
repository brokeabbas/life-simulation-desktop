import StatMeter from './StatMeter';
import {
  GROUP_CAPACITY,
  GROUP_LABELS,
  type StatBlock,
  type StatKey,
  type StatGroupId,
} from '../../types';
import { seededRandom } from '../../rng';

type Props = {
  title: string;
  groupId: StatGroupId;
  keys: StatKey[];
  stats: StatBlock;
  seed: string;
  capacity?: number; // defaults to GROUP_CAPACITY[groupId] or 30
};

export default function GroupSection({
  title,
  groupId,
  keys,
  stats,
  seed,
  capacity,
}: Props) {
  const cap = capacity ?? GROUP_CAPACITY[groupId] ?? 30;
  const labels = GROUP_LABELS[groupId] ?? [];
  const total = cap;

  return (
    <section className="group">
      <div className="group-header">
        <div className="group-title">{title}</div>
        <div className="group-count">{Math.min(keys.length, cap)}/{cap}</div>
      </div>

      <div className="stats-grid">
        {Array.from({ length: total }).map((_, i) => {
          if (i < keys.length) {
            const k = keys[i];
            return <StatMeter key={`${groupId}:${k}`} stat={k} value={stats[k]} />;
          }

          // --- Faux meter with deterministic value (0..100) ---
          const label = labels[i] ?? `Slot ${i + 1}`;
          const rnd = seededRandom(`${seed}::${groupId}::${label}`)();
          const value = Math.round(rnd * 100); // 0..100
          const textColor = '#cfe4ff';

          return (
            <div key={`faux:${groupId}:${i}`} className="meter">
              <div className="label">
                <span className="dot" />
                <span className="ph-text">{label}</span>
                <span style={{ marginLeft: 'auto', color: textColor }}>{value}</span>
              </div>
              <div className="bar">
                <div className="fill" style={{ width: `${value}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
