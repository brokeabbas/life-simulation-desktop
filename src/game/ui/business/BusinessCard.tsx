// src/game/ui/business/BusinessCard.tsx
import type { Business } from '../../store';
import { INDUSTRIES } from './industries';

const toNaira = (n: number) => `₦${Math.max(0, Math.round(n)).toLocaleString()}`;

export default function BusinessCard({ biz, onOpen }: { biz: Business; onOpen: () => void }) {
  // === KPI math (keep in sync with BusinessDetailModal) ===
  const rev = Math.round(
    biz.baseRevPerDay *
      (1 + (biz.demand / 100) * 0.6) *
      (1 + (biz.quality / 100) * 0.3) *
      (1 + (biz.marketing / 100) * 0.25) *
      (1 + Math.max(0, biz.branches - 1) * 0.22),
  );

  const cost = Math.round(
    biz.baseCostPerDay * (1 + Math.max(0, biz.branches - 1) * 0.12) +
      biz.staff * 900 +
      biz.marketing * 10,
  );

  const profit = rev - cost;
  const margin = rev > 0 ? (profit / rev) * 100 : 0;

  const paybackDays = profit > 0 ? Math.ceil(biz.capital / profit) : null;
  const runwayDays = profit < 0 ? Math.floor(biz.cash / Math.max(1, -profit)) : null;

  const industry = INDUSTRIES.find((i) => i.id === biz.industry);
  const industryLabel = industry?.name ?? biz.industry.toUpperCase();

  const { statusLabel, statusColor, statusBg } = getProfitStatus(profit);

  return (
    <button
      onClick={onOpen}
      className="card business-card"
      style={{
        textAlign: 'left',
        display: 'grid',
        gap: 12,
        padding: 16,
        cursor: 'pointer',
        background:
          'radial-gradient(140% 160% at 0% 0%, rgba(59,130,246,.16), transparent) , var(--card-bg, transparent)',
        border: '1px solid rgba(148,163,184,.35)',
        boxShadow: '0 14px 30px rgba(15,23,42,.45)',
        width: '100%',
        minWidth: 0, // 👈 allow shrinking inside grid
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
        <div style={{ display: 'grid', gap: 3, minWidth: 0 }}>
          <div style={{ fontWeight: 800, fontSize: 15, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {biz.name}
          </div>
          <div className="muted" style={{ fontSize: 11, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {industryLabel} • Invested: <b>{toNaira(biz.capital)}</b>
          </div>
        </div>

        <div style={{ marginLeft: 'auto', display: 'flex', gap: 6, alignItems: 'center', flexShrink: 0 }}>
          <span
            className="chip"
            style={{
              backgroundColor: statusBg,
              color: statusColor,
              borderColor: 'transparent',
              fontSize: 11,
              fontWeight: 700,
            }}
          >
            {statusLabel}
          </span>
          <span className="chip" style={{ fontSize: 11 }}>
            Staff {biz.staff}
          </span>
          <span className="chip" style={{ fontSize: 11 }}>
            Branches {biz.branches}
          </span>
        </div>
      </div>

      {/* Core KPIs */}
      <div
        style={{
          display: 'grid',
          // responsive: 1–3 columns depending on available width
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: 10,
          alignItems: 'stretch',
          minWidth: 0,
        }}
      >
        <Stat
          label="Revenue / day"
          value={toNaira(rev)}
          hint={rev > 0 ? 'Top-line sales' : 'No revenue yet'}
        />
        <Stat
          label="Est. Profit / day"
          value={toNaira(profit)}
          strong
          tone={profit > 0 ? 'positive' : profit < 0 ? 'negative' : 'neutral'}
          hint={
            rev > 0
              ? `${margin >= 0 ? '+' : ''}${margin.toFixed(1)}% margin`
              : 'Improve demand & quality'
          }
        />
        <Stat
          label="Company Cash"
          value={toNaira(biz.cash)}
          hint={
            profit > 0
              ? paybackDays
                ? `Payback ≈ ${paybackDays} days`
                : ''
              : profit < 0 && runwayDays !== null
              ? `Runway ≈ ${runwayDays} days`
              : 'Breakeven'
          }
        />
      </div>

      {/* Market signals */}
      <div style={{ display: 'grid', gap: 6, minWidth: 0 }}>
        <div className="muted" style={{ fontSize: 11, fontWeight: 700 }}>
          Market Signals
        </div>
        <div
          style={{
            display: 'flex',
            gap: 10,
            alignItems: 'center',
            flexWrap: 'wrap',
            minWidth: 0,
          }}
        >
          <Meter label="Demand" v={biz.demand} />
          <Meter label="Quality" v={biz.quality} />
          <Meter label="Marketing" v={biz.marketing} />
        </div>
      </div>
    </button>
  );
}

/* === Subcomponents === */

type Tone = 'positive' | 'negative' | 'neutral' | undefined;

function Stat({
  label,
  value,
  hint,
  strong,
  tone,
}: {
  label: string;
  value: string;
  hint?: string;
  strong?: boolean;
  tone?: Tone;
}) {
  const color =
    tone === 'positive'
      ? '#22c55e'
      : tone === 'negative'
      ? '#f97373'
      : tone === 'neutral'
      ? '#eab308'
      : undefined;

  return (
    <div
      style={{
        display: 'grid',
        gap: 4,
        padding: '8px 10px',
        borderRadius: 10,
        background: 'linear-gradient(160deg, rgba(15,23,42,.9), rgba(15,23,42,.7))',
        border: '1px solid rgba(148,163,184,.35)',
        minWidth: 0,
      }}
    >
      <div className="muted" style={{ fontSize: 11 }}>
        {label}
      </div>
      <div style={{ fontWeight: strong ? 800 : 700, color, fontSize: 14, wordBreak: 'break-word' }}>
        {value}
      </div>
      {hint && (
        <div className="muted" style={{ fontSize: 11 }}>
          {hint}
        </div>
      )}
    </div>
  );
}

function Meter({ label, v }: { label: string; v: number }) {
  const vv = Math.max(0, Math.min(100, Math.round(v)));

  let gradient = 'linear-gradient(90deg,#22c55e,#22d3ee,#3b82f6)';
  let badge = 'Strong';
  if (vv < 40) {
    gradient = 'linear-gradient(90deg,#f97373,#f97316)';
    badge = 'Weak';
  } else if (vv < 70) {
    gradient = 'linear-gradient(90deg,#eab308,#22c55e)';
    badge = 'Okay';
  }

  return (
    <span
      style={{
        display: 'inline-grid',
        gap: 3,
        flex: '1 1 90px', // 👈 flex, not fixed width
        minWidth: 0,
      }}
    >
      <span
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: 11,
          color: 'rgba(226,232,240,.8)',
          alignItems: 'center',
          minWidth: 0,
        }}
      >
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {label}
        </span>
        <span style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          <span>{vv}%</span>
          <span
            style={{
              padding: '1px 6px',
              borderRadius: 999,
              fontSize: 10,
              textTransform: 'uppercase',
              letterSpacing: 0.04,
              background: 'rgba(15,23,42,.9)',
              border: '1px solid rgba(148,163,184,.4)',
            }}
          >
            {badge}
          </span>
        </span>
      </span>
      <span
        style={{
          height: 6,
          background: '#020617',
          border: '1px solid var(--border)',
          borderRadius: 999,
          overflow: 'hidden',
        }}
      >
        <span
          style={{
            display: 'block',
            height: '100%',
            width: `${vv}%`,
            background: gradient,
            transition: 'width 220ms ease-out',
          }}
        />
      </span>
    </span>
  );
}

/* === helpers === */

function getProfitStatus(profit: number) {
  if (profit > 0) {
    return {
      statusLabel: 'Profitable',
      statusColor: '#22c55e',
      statusBg: 'rgba(34,197,94,.12)',
    };
  }
  if (profit < 0) {
    return {
      statusLabel: 'Burning Cash',
      statusColor: '#f97373',
      statusBg: 'rgba(248,113,113,.12)',
    };
  }
  return {
    statusLabel: 'Breakeven',
    statusColor: '#eab308',
    statusBg: 'rgba(234,179,8,.12)',
  };
}
