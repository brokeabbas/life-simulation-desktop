import { CoinsIcon, HeartIcon, BoltIcon } from '../Icon';

export type HFOption = {
  id: string;
  title: string;
  desc?: string;
  cost: number; // ₦
  effects: Array<{ k: string; v: number }>; // for preview only
  onPick: () => void;
  disabled?: boolean;
};

const toNaira = (n: number) => `₦${Math.max(0, Math.round(n)).toLocaleString()}`;

export default function OptionCard({ id, title, desc, cost, effects, onPick, disabled }: HFOption) {
  return (
    <button
      key={id}
      className="choice"
      onClick={onPick}
      disabled={disabled}
      style={{ textAlign: 'left' }}
      title={desc}
    >
      <div style={{ display: 'grid', gap: 4 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <HeartIcon size={16} />
          <b>{title}</b>
        </div>
        {desc ? <div className="sub" style={{ opacity: .85 }}>{desc}</div> : null}
        {effects?.length ? (
          <div className="tags">
            {effects.map((e, i) => (
              <span key={i} className="tag">
                {e.k} {e.v >= 0 ? '+' : ''}{e.v}
              </span>
            ))}
          </div>
        ) : null}
      </div>

      <div style={{ display:'grid', justifyItems:'end', gap:6 }}>
        <div className="tag" style={{ display:'inline-flex', alignItems:'center', gap:6 }}>
          <CoinsIcon size={14} /> {toNaira(cost)}
        </div>
        <div className="btn sm" style={{ justifySelf:'end' }}>
          <BoltIcon size={14} /> Apply
        </div>
      </div>
    </button>
  );
}
