import type { StatKey } from '../../types';

type EffectChip = { k: StatKey; v: number };

export default function OfficeActionCard({
  title,
  desc,
  cost = 0,
  effects = [],
  actionLabel = 'Select',
  variant = 'default',
  disabled,
  onAction,
}: {
  title: string;
  desc?: string;
  cost?: number;
  effects?: EffectChip[];
  actionLabel?: string;
  variant?: 'default' | 'primary' | 'danger';
  disabled?: boolean;
  onAction: () => void;
}) {
  const costText = cost > 0 ? `₦${Math.max(0, Math.round(cost)).toLocaleString()}` : null;

  const bg =
    variant === 'primary'
      ? 'linear-gradient(170deg, rgba(14,165,233,.12), rgba(59,130,246,.08))'
      : variant === 'danger'
      ? 'linear-gradient(170deg, rgba(239,68,68,.12), rgba(239,68,68,.06))'
      : 'linear-gradient(170deg, #0d1424, #0c1322)';

  const border =
    variant === 'primary'
      ? 'rgba(96,165,250,.45)'
      : variant === 'danger'
      ? 'rgba(248,113,113,.45)'
      : 'var(--border)';

  return (
    <div
      className="choice"
      style={{
        display: 'grid',
        gap: 8,
        alignContent: 'start',
        background: bg,
        borderColor: border,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
        <div style={{ fontWeight: 800 }}>{title}</div>
        {costText ? (
          <span
            className="tag"
            style={{
              marginLeft: 'auto',
              background: 'rgba(96,165,250,.14)',
              color: '#bfdbfe',
              border: '1px solid rgba(96,165,250,.25)',
            }}
          >
            {costText}
          </span>
        ) : null}
      </div>
      {desc ? <div className="muted" style={{ fontSize: 12 }}>{desc}</div> : null}

      {effects.length ? (
        <div className="tags" style={{ margin: 0 }}>
          {effects.map((e, i) => {
            const sign = e.v > 0 ? '+' : '';
            const color = e.v > 0 ? '#34d399' : e.v < 0 ? '#f87171' : '#e5e7eb';
            return (
              <span
                key={i}
                className="tag"
                style={{
                  borderColor: 'rgba(255,255,255,.18)',
                  color,
                  background: 'rgba(255,255,255,.06)',
                }}
                title={`${e.k}`}
              >
                {`${e.k.replace(/([A-Z])/g, ' $1')}: ${sign}${e.v}`}
              </span>
            );
          })}
        </div>
      ) : null}

      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button
          className={`btn ${variant === 'primary' ? 'primary' : variant === 'danger' ? '' : 'ghost'}`}
          onClick={onAction}
          disabled={disabled}
          style={disabled ? { opacity: .6, cursor: 'not-allowed' } : undefined}
        >
          {actionLabel}
        </button>
      </div>
    </div>
  );
}
