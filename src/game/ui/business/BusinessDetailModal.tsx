// src/game/ui/business/BusinessDetailModal.tsx
import React from 'react';
import { createPortal } from 'react-dom';
import { useGame, type Business } from '../../store';
import BusinessDeepDive from './BusinessDeepDive';

const toNaira = (n: number) => `₦${Math.max(0, Math.round(n)).toLocaleString()}`;

export default function BusinessDetailModal({ id, onClose }: { id: string; onClose: () => void }) {
  const {
    state,
    businesses,
    simulateBusinesses,
    bizInjectCapital,
    bizWithdrawDividends,
    bizHire,
    bizInvestMarketing,
    bizInvestRnD,
    bizOpenBranch,
  } = useGame();

  const b = businesses[id];

  React.useEffect(() => {
    simulateBusinesses();
  }, [simulateBusinesses, state.day]);

  // --- Interactive lever state ---
  const [capitalAmount, setCapitalAmount] = React.useState(100_000);
  const [dividendAmount, setDividendAmount] = React.useState(50_000);
  const [hireCount, setHireCount] = React.useState(2);
  const [marketingSpend, setMarketingSpend] = React.useState(100_000);
  const [rndSpend, setRndSpend] = React.useState(150_000);
  const [branchCount, setBranchCount] = React.useState(1); // how many branches to open in macro plays

  if (!b) return null;

  const { rev, cost, profit } = computeKPIs(b);

  const body = (
    <div
      className="modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="bdm-title"
      onClick={(e) => {
        if ((e.target as HTMLElement).classList.contains('modal-backdrop')) onClose();
      }}
    >
      <div
        className="modal"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 'min(1160px, 98vw)',   // wider
          maxHeight: '90vh',            // constrain height
          overflowY: 'auto',            // scroll inside
          display: 'grid',
          gap: 12,
        }}
      >
        <div className="title" id="bdm-title">
          {b.name} <span className="muted">• {b.industry.toUpperCase()}</span>
        </div>

        {/* KPIs */}
        <div className="card" style={{ display: 'grid', gap: 10 }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: 10,
            }}
          >
            <Kpi label="Revenue/day" value={toNaira(rev)} />
            <Kpi label="Cost/day" value={toNaira(cost)} />
            <Kpi label="Est. Profit/day" value={toNaira(profit)} strong />
            <Kpi label="Company Cash" value={toNaira(b.cash)} />
          </div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
            <Meter label="Demand" v={b.demand} />
            <Meter label="Quality" v={b.quality} />
            <Meter label="Marketing" v={b.marketing} />
            <span className="chip">Staff {b.staff}</span>
            <span className="chip">Branches {b.branches}</span>
          </div>
        </div>

        {/* Controls */}
        <div className="card" style={{ display: 'grid', gap: 10 }}>
          <div style={{ fontWeight: 800 }}>Growth Levers</div>

          <div
            className="choices"
            style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 10 }}
          >
            {/* Money levers */}
            <Action
              title="Inject Capital"
              desc="Increase runway; boosts company cash. Great before aggressive expansion plays."
              cta={`Inject ${toNaira(capitalAmount)}`}
              onClick={() => {
                const amt = Math.max(10_000, capitalAmount || 0);
                const ok = bizInjectCapital(b.id, amt);
                if (!ok) alert('Not enough personal funds.');
              }}
            >
              <NumberInputRow
                label="Amount"
                value={capitalAmount}
                min={10_000}
                step={10_000}
                onChange={setCapitalAmount}
              />
            </Action>

            <Action
              title="Withdraw Dividends"
              desc="Move profits to your wallet. Useful for de-risking after a growth sprint."
              cta={`Withdraw ${toNaira(dividendAmount)}`}
              onClick={() => {
                const amt = Math.max(10_000, dividendAmount || 0);
                const ok = bizWithdrawDividends(b.id, amt);
                if (!ok) alert('Not enough company cash.');
              }}
            >
              <NumberInputRow
                label="Amount"
                value={dividendAmount}
                min={10_000}
                step={10_000}
                onChange={setDividendAmount}
              />
            </Action>

            {/* People lever */}
            <Action
              title="Hire Staff"
              desc="Scale operations; increases capacity and base cost. Think throughput & service quality."
              cta={`Hire +${hireCount} staff`}
              onClick={() => {
                const n = Math.max(1, Math.round(hireCount) || 1);
                bizHire(b.id, n);
              }}
            >
              <NumberInputRow
                label="Number of staff"
                value={hireCount}
                min={1}
                step={1}
                onChange={setHireCount}
              />
            </Action>

            {/* Demand & quality levers */}
            <Action
              title="Run Marketing"
              desc="Grow demand; increases brand awareness and acquisition over time."
              cta={`Spend ${toNaira(marketingSpend)}`}
              onClick={() => {
                const amt = Math.max(50_000, marketingSpend || 0);
                const ok = bizInvestMarketing(b.id, amt);
                if (!ok) alert('Not enough personal funds.');
              }}
            >
              <NumberInputRow
                label="Budget"
                value={marketingSpend}
                min={50_000}
                step={25_000}
                onChange={setMarketingSpend}
              />
            </Action>

            <Action
              title="Invest in R&D"
              desc="Improve product quality; boosts reviews and long-term pricing power."
              cta={`Spend ${toNaira(rndSpend)}`}
              onClick={() => {
                const amt = Math.max(50_000, rndSpend || 0);
                const ok = bizInvestRnD(b.id, amt);
                if (!ok) alert('Not enough personal funds.');
              }}
            >
              <NumberInputRow
                label="Budget"
                value={rndSpend}
                min={50_000}
                step={25_000}
                onChange={setRndSpend}
              />
            </Action>

            {/* Scale lever */}
            <Action
              title="Open New Branch"
              desc="Expand coverage; increases scale and base cost. Multiplies both risk and opportunity."
              cta={`Open +${branchCount} branch${branchCount > 1 ? 'es' : ''}`}
              onClick={() => {
                const n = Math.max(1, Math.round(branchCount) || 1);
                for (let i = 0; i < n; i++) {
                  bizOpenBranch(b.id);
                }
              }}
            >
              <NumberInputRow
                label="Branches to open"
                value={branchCount}
                min={1}
                step={1}
                onChange={setBranchCount}
              />
            </Action>

            {/* Macro Plays / Scenarios */}
            <Action
              title="Aggressive Growth Play"
              desc="Heavy marketing + R&D + hires + 1 new branch. High risk, high upside."
              cta="Run aggressive play"
              variant="primary-strong"
              onClick={() => {
                const log: string[] = [];
                let okAll = true;

                if (!bizInvestMarketing(b.id, Math.max(150_000, marketingSpend))) {
                  okAll = false;
                  log.push('Marketing spend');
                }
                if (!bizInvestRnD(b.id, Math.max(150_000, rndSpend))) {
                  okAll = false;
                  log.push('R&D spend');
                }

                bizHire(b.id, Math.max(2, Math.round(hireCount) || 2));
                bizOpenBranch(b.id);

                if (!okAll) {
                  alert(`Not enough personal funds for: ${log.join(', ')}.`);
                }
              }}
            >
              <small className="muted" style={{ fontSize: 11 }}>
                Uses your configured Marketing / R&D amounts and hire count above.
              </small>
            </Action>

            <Action
              title="Defensive Mode"
              desc="De-risk: pull some cash out and avoid big spends. Good when system feels overstretched."
              cta="Run defensive move"
              variant="ghost"
              onClick={() => {
                const withdrawAmt = Math.max(25_000, dividendAmount || 0);
                const ok = bizWithdrawDividends(b.id, withdrawAmt);
                if (!ok) {
                  alert('Not enough company cash to withdraw that much.');
                }
              }}
            >
              <small className="muted" style={{ fontSize: 11 }}>
                Focus on extracting cash; pairs well with conservative choices in the simulation preview.
              </small>
            </Action>

            <Action
              title="Brand & Quality Boost"
              desc="Strong R&D + healthy marketing. Less about branches, more about depth & reputation."
              cta="Boost brand & quality"
              variant="ghost"
              onClick={() => {
                const log: string[] = [];
                let okAll = true;

                if (!bizInvestMarketing(b.id, Math.max(100_000, marketingSpend))) {
                  okAll = false;
                  log.push('Marketing spend');
                }
                if (!bizInvestRnD(b.id, Math.max(200_000, rndSpend))) {
                  okAll = false;
                  log.push('R&D spend');
                }

                if (!okAll) {
                  alert(`Not enough personal funds for: ${log.join(', ')}.`);
                }
              }}
            >
              <small className="muted" style={{ fontSize: 11 }}>
                Great combo when your simulation preview shows high franchise potential.
              </small>
            </Action>
          </div>
        </div>

        {/* Deep Simulation Preview (UI only) */}
        <BusinessDeepDive biz={b} />

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button className="btn ghost" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(body, document.body);
}

/* helpers */
function computeKPIs(b: Business) {
  const rev = Math.round(
    b.baseRevPerDay *
      (1 + (b.demand / 100) * 0.6) *
      (1 + (b.quality / 100) * 0.3) *
      (1 + (b.marketing / 100) * 0.25) *
      (1 + Math.max(0, b.branches - 1) * 0.22),
  );
  const cost = Math.round(
    b.baseCostPerDay * (1 + Math.max(0, b.branches - 1) * 0.12) + b.staff * 900 + b.marketing * 10,
  );
  const profit = rev - cost;
  return { rev, cost, profit };
}

function Kpi({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div style={{ display: 'grid', gap: 4 }}>
      <div className="muted" style={{ fontSize: 12 }}>
        {label}
      </div>
      <div style={{ fontWeight: strong ? 800 : 700 }}>{value}</div>
    </div>
  );
}

function Meter({ label, v }: { label: string; v: number }) {
  const vv = Math.max(0, Math.min(100, Math.round(v)));
  return (
    <span style={{ display: 'inline-grid', width: 140 }}>
      <span
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: 11,
          color: 'rgba(230,240,255,.7)',
        }}
      >
        <span>{label}</span>
        <span>{vv}%</span>
      </span>
      <span
        style={{
          height: 6,
          background: '#0b1220',
          border: '1px solid var(--border)',
          borderRadius: 6,
          overflow: 'hidden',
        }}
      >
        <span
          style={{
            display: 'block',
            height: '100%',
            width: `${vv}%`,
            background: 'linear-gradient(90deg,#10b981,#22d3ee,#3b82f6)',
          }}
        />
      </span>
    </span>
  );
}

type ActionVariant = 'primary' | 'primary-strong' | 'ghost';

function Action({
  title,
  desc,
  cta,
  onClick,
  variant = 'primary',
  children,
}: {
  title: string;
  desc: string;
  cta: string;
  onClick: () => void;
  variant?: ActionVariant;
  children?: React.ReactNode;
}) {
  const btnClass =
    variant === 'ghost'
      ? 'btn ghost'
      : variant === 'primary-strong'
      ? 'btn primary'
      : 'btn primary';

  return (
    <div className="card" style={{ display: 'grid', gap: 8, padding: 12 }}>
      <div style={{ fontWeight: 800 }}>{title}</div>
      <div className="muted" style={{ fontSize: 12 }}>
        {desc}
      </div>

      {children && <div style={{ fontSize: 11 }}>{children}</div>}

      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button className={btnClass} onClick={onClick}>
          {cta}
        </button>
      </div>
    </div>
  );
}

function NumberInputRow({
  label,
  value,
  min,
  step,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  step: number;
  onChange: (v: number) => void;
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <span className="muted" style={{ fontSize: 11 }}>
        {label}
      </span>
      <input
        type="number"
        value={Number.isFinite(value) ? value : ''}
        min={min}
        step={step}
        onChange={(e) => {
          const v = parseInt(e.target.value, 10);
          if (Number.isNaN(v)) {
            onChange(min);
          } else {
            onChange(Math.max(min, v));
          }
        }}
        style={{
          flex: 1,
          fontSize: 11,
          padding: '4px 6px',
          borderRadius: 6,
          border: '1px solid var(--border)',
          background: 'rgba(15,23,42,.9)',
          color: 'inherit',
        }}
      />
    </div>
  );
}
