import React from 'react';
import { createPortal } from 'react-dom';
import { useGame } from '../../store';
import { JOBS } from '../../engine';
import { CAREER_LEVELS } from './careerLevels';
import { generateJobMarket, type JobListing } from './jobMarket';

type Props = { jobId: string; onClose: () => void };
type ReqItem = { key: string; label: string; ok: boolean };

const toNaira = (n: number) => `₦${Math.max(0, Math.round(n)).toLocaleString()}`;

export default function JobDetailModal({ jobId, onClose }: Props) {
  const { state, applyJob } = useGame();
  const { stats, job: currentJob } = state;

  const def = JOBS[jobId];
  if (!def) return null;

  const levels = CAREER_LEVELS[jobId] ?? Array.from({ length: def.maxLevel + 1 }, (_, i) => `Level ${i}`);
  const market = React.useMemo(() => generateJobMarket(state), [state.seed, state.day]);
  const listings = market.byJob[jobId] ?? [];

  const [level, setLevel] = React.useState<number>(
    Math.min(def.maxLevel, currentJob?.id === def.id ? currentJob.level : 0)
  );
  const [selected, setSelected] = React.useState<JobListing | null>(listings[0] ?? null);

  const isCurrent = currentJob?.id === def.id;
  const minIQ = def.minIntellect ?? 0;

  // demand-/company-adjusted requirement set
  const reqs: ReqItem[] = selected
    ? buildLevelRequirements(jobId, level, stats, minIQ, selected.iqDelta, selected.statDelta)
    : [{ key: 'none', label: 'No listing available right now', ok: false }];

  const meetsAll = !!selected && reqs.every(r => r.ok);

  const payDay = (lvl: number) => {
    const base = def.basePerDay + def.perLevel * lvl;
    const mul = selected?.payMultiplier ?? 1;
    return Math.round(base * mul);
  };

  const body = (
    <div
      className="modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="job-detail-title"
      onClick={(e) => {
        if ((e.target as HTMLElement).classList.contains('modal-backdrop')) onClose();
      }}
    >
      <div className="modal job-modal modal--wide" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="job-modal__header">
          <div className="job-modal__title" id="job-detail-title">
            {def.title}
          </div>
          {isCurrent && <span className="chip chip--green">Currently Employed</span>}
        </div>

        {/* Summary bar */}
        <div className="job-modal__summary">
          <KV k="Selected Company" v={selected ? selected.companyName : '—'} />
          <KV k="Industry Demand" v={<DemandBar value={selected?.demand ?? 0} showPercent />} />
          <KV
            k="Target Level"
            v={
              <div className="level-chooser">
                <input
                  type="range"
                  min={0}
                  max={def.maxLevel}
                  value={level}
                  onChange={(e) => setLevel(Number(e.target.value))}
                  aria-label="Target level"
                />
                <select
                  value={level}
                  onChange={(e) => setLevel(Number(e.target.value))}
                  aria-label="Target level select"
                >
                  {Array.from({ length: def.maxLevel + 1 }, (_, i) => (
                    <option key={i} value={i}>
                      {`Level ${i} — ${levels[i] ?? `Level ${i}`}`}
                    </option>
                  ))}
                </select>
              </div>
            }
          />
          <KV
            k="Projected Pay"
            v={
              selected
                ? `${toNaira(payDay(level))}/day • ${toNaira(payDay(level) * 30)}/mo`
                : '—'
            }
          />
        </div>

        {/* 2-column content grid */}
        <div className="job-modal__grid">
          {/* Left: Companies (scrollable list) */}
          <section className="panel panel--left">
            <div className="panel__header">
              <b>Openings</b>
              <span className="muted">Pick a company</span>
            </div>

            <div className="company-list">
              {listings.length === 0 ? (
                <div className="empty">
                  <NoIcon />
                  <span>No companies are hiring for this role today.</span>
                </div>
              ) : (
                listings.map((l) => (
                  <label
                    key={`${l.companyId}-${l.jobId}`}
                    className={`company ${selected?.companyId === l.companyId ? 'is-selected' : ''}`}
                    title={`${l.companyName} • Demand ${l.demand}%`}
                  >
                    <input
                      type="radio"
                      name="company"
                      checked={selected?.companyId === l.companyId}
                      onChange={() => setSelected(l)}
                    />
                    <div className="company__meta">
                      <b className="company__name">{l.companyName}</b>
                      <span className="muted">Pay ×{l.payMultiplier.toFixed(2)}</span>
                    </div>
                    <div className="company__demand">
                      <DemandBar value={l.demand} />
                    </div>
                  </label>
                ))
              )}
            </div>
          </section>

          {/* Right: Requirements + compact pay table */}
          <section className="panel panel--right">
            {/* Requirements */}
            <div className="panel__header">
              <b>Requirements</b>
              <span className="muted">Base + Level {level} extras (demand-adjusted)</span>
            </div>
            <div className="requirements">
              {reqs.map((r) => (
                <span key={r.key} className={`chip ${r.ok ? 'chip--green' : 'chip--red'}`}>
                  {r.label}
                </span>
              ))}
            </div>

            {/* Pay table (scrolls inside) */}
            <div className="panel__header" style={{ marginTop: 10 }}>
              <b>Per-Level Pay</b>
              <span className="muted">
                Shown for <b>{selected?.companyName ?? '—'}</b>
              </span>
            </div>
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th align="left">Level</th>
                    <th align="left">Title</th>
                    <th align="right">Day</th>
                    <th align="right">Month (×30)</th>
                    <th align="right">Year (×365)</th>
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: def.maxLevel + 1 }, (_, i) => {
                    const day = payDay(i);
                    return (
                      <tr key={i} className={i === level ? 'is-active' : ''}>
                        <td>{i}</td>
                        <td>{levels[i] ?? `Level ${i}`}</td>
                        <td align="right">{toNaira(day)}</td>
                        <td align="right">{toNaira(day * 30)}</td>
                        <td align="right">{toNaira(day * 365)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        {/* Footer actions */}
        <div className="job-modal__footer">
          <button className="btn ghost" onClick={onClose}>Close</button>
          <button
            className={`btn ${meetsAll ? 'primary' : ''}`}
            disabled={!meetsAll}
            onClick={() => {
              if (!selected) return;
              applyJob({
                kind: 'apply',
                jobId: def.id,
                level,
                company: selected.companyName,
                demand: selected.demand,
                payMultiplier: selected.payMultiplier,
              });
              onClose();
            }}
            title={meetsAll ? 'Apply' : 'Requirements not met'}
          >
            {selected ? `Apply @ ${selected.companyName} (Lv ${level})` : 'Apply'}
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(body, document.body);
}

/* ---------- small UI helpers ---------- */

function KV({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="kv">
      <div className="kv__k">{k}</div>
      <div className="kv__v">{v}</div>
    </div>
  );
}

function DemandBar({ value, showPercent = false }: { value: number; showPercent?: boolean }) {
  const v = Math.max(0, Math.min(100, Math.round(value)));
  return (
    <span className="demand">
      <span className="demand__track">
        <span className="demand__fill" style={{ width: `${v}%` }} />
      </span>
      {showPercent && <span className="demand__value">{v}%</span>}
    </span>
  );
}

function NoIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" opacity="0.7"/>
      <path d="M7 7l10 10" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

/* ====== Requirement logic (same rules, demand-adjusted) ====== */

type Family =
  | 'engineering' | 'analytics' | 'product' | 'finance' | 'marketing' | 'sales' | 'design'
  | 'security' | 'science' | 'hr' | 'ops' | 'supply' | 'economics' | 'accounting' | 'general';

function buildLevelRequirements(
  jobId: string,
  level: number,
  stats: any,
  minIQ: number,
  iqDelta: number,
  statDelta: number
): ReqItem[] {
  const items: ReqItem[] = [];
  const iq = Math.round(stats.intellect ?? 0);

  const family = familyOf(jobId);
  const baseIQ = clamp01_100(minIQ + iqDelta);

  items.push({
    key: 'base.intellect',
    label: `Intellect ≥ ${baseIQ} (you: ${iq})`,
    ok: iq >= baseIQ,
  });

  const add = additionalReqsForLevel(family, level);
  for (const a of add) {
    const val = Math.round(stats[a.stat] ?? 0);
    const reqMin = clamp01_100(a.min + statDelta);
    items.push({
      key: `lvl${level}.${a.stat}`,
      label: `${labelForStat(a.stat)} ≥ ${reqMin} (you: ${val})`,
      ok: val >= reqMin,
    });
  }

  const techIQ = extraIntellectFor(family, level, baseIQ);
  if (techIQ) {
    items.push({
      key: `lvl${level}.intellect.tech`,
      label: `Intellect ≥ ${techIQ} (you: ${iq})`,
      ok: iq >= techIQ,
    });
  }

  return items;
}

function familyOf(id: string): Family {
  if (/software|network|electrical|mechanical|civil/.test(id)) return 'engineering';
  if (/data_analyst|business_analyst/.test(id)) return 'analytics';
  if (/operations_analyst/.test(id)) return 'ops';
  if (/supply_chain_analyst/.test(id)) return 'supply';
  if (/product_manager/.test(id)) return 'product';
  if (/finance_analyst/.test(id)) return 'finance';
  if (/accountant/.test(id)) return 'accounting';
  if (/economist/.test(id)) return 'economics';
  if (/marketing/.test(id)) return 'marketing';
  if (/sales/.test(id)) return 'sales';
  if (/ux_designer/.test(id)) return 'design';
  if (/cybersecurity/.test(id)) return 'security';
  if (/biomedical|environmental_scientist/.test(id)) return 'science';
  if (/hr_specialist/.test(id)) return 'hr';
  return 'general';
}

function labelForStat(k: string): string {
  const map: Record<string, string> = {
    discipline: 'Discipline',
    communication: 'Communication',
    confidence: 'Confidence',
    financialLiteracy: 'Financial Literacy',
    creativity: 'Creativity',
    charisma: 'Charisma',
    resilience: 'Resilience',
    wisdom: 'Wisdom',
    ambition: 'Ambition',
    reputation: 'Reputation',
  };
  return map[k] ?? k;
}

function additionalReqsForLevel(family: Family, level: number): Array<{ stat: string; min: number }> {
  if (level === 0) return [];
  const baseAll: Record<number, Array<{ stat: string; min: number }>> = {
    1: [{ stat: 'discipline', min: 50 }],
    2: [{ stat: 'communication', min: 50 }],
    3: [{ stat: 'ambition', min: 55 }],
    4: [{ stat: 'reputation', min: 60 }],
  };
  const familyExtras: Partial<Record<Family, Record<number, Array<{ stat: string; min: number }>>>> = {
    engineering: { 1: [{ stat: 'confidence', min: 48 }], 2: [{ stat: 'resilience', min: 50 }], 3: [{ stat: 'resilience', min: 55 }], 4: [{ stat: 'communication', min: 60 }] },
    analytics:   { 1: [{ stat: 'wisdom', min: 48 }],     2: [{ stat: 'discipline', min: 52 }], 3: [{ stat: 'wisdom', min: 56 }],     4: [{ stat: 'communication', min: 58 }] },
    product:     { 1: [{ stat: 'communication', min: 55 }], 2: [{ stat: 'ambition', min: 60 }], 3: [{ stat: 'reputation', min: 58 }], 4: [{ stat: 'communication', min: 62 }] },
    finance:     { 1: [{ stat: 'financialLiteracy', min: 52 }], 2: [{ stat: 'discipline', min: 55 }], 3: [{ stat: 'financialLiteracy', min: 60 }], 4: [{ stat: 'confidence', min: 60 }] },
    accounting:  { 1: [{ stat: 'financialLiteracy', min: 52 }], 2: [{ stat: 'discipline', min: 55 }], 3: [{ stat: 'financialLiteracy', min: 58 }], 4: [{ stat: 'communication', min: 58 }] },
    economics:   { 1: [{ stat: 'wisdom', min: 50 }],     2: [{ stat: 'communication', min: 55 }], 3: [{ stat: 'financialLiteracy', min: 58 }], 4: [{ stat: 'reputation', min: 60 }] },
    marketing:   { 1: [{ stat: 'creativity', min: 50 }], 2: [{ stat: 'communication', min: 55 }], 3: [{ stat: 'confidence', min: 56 }], 4: [{ stat: 'communication', min: 60 }] },
    sales:       { 1: [{ stat: 'charisma', min: 55 }],   2: [{ stat: 'communication', min: 60 }], 3: [{ stat: 'confidence', min: 58 }], 4: [{ stat: 'discipline', min: 55 }] },
    design:      { 1: [{ stat: 'creativity', min: 52 }], 2: [{ stat: 'communication', min: 55 }], 3: [{ stat: 'confidence', min: 56 }], 4: [{ stat: 'communication', min: 60 }] },
    security:    { 1: [{ stat: 'discipline', min: 52 }], 2: [{ stat: 'resilience', min: 52 }], 3: [{ stat: 'confidence', min: 56 }], 4: [{ stat: 'communication', min: 60 }] },
    science:     { 1: [{ stat: 'wisdom', min: 50 }],     2: [{ stat: 'discipline', min: 52 }], 3: [{ stat: 'resilience', min: 55 }], 4: [{ stat: 'communication', min: 58 }] },
    hr:          { 1: [{ stat: 'communication', min: 55 }], 2: [{ stat: 'confidence', min: 52 }], 3: [{ stat: 'reputation', min: 56 }], 4: [{ stat: 'communication', min: 60 }] },
    ops:         { 1: [{ stat: 'discipline', min: 52 }], 2: [{ stat: 'resilience', min: 52 }], 3: [{ stat: 'communication', min: 55 }], 4: [{ stat: 'confidence', min: 58 }] },
    supply:      { 1: [{ stat: 'discipline', min: 52 }], 2: [{ stat: 'communication', min: 55 }], 3: [{ stat: 'resilience', min: 55 }], 4: [{ stat: 'confidence', min: 58 }] },
  };
  return [
    ...(baseAll[level] ?? []),
    ...((familyExtras[family]?.[level]) ?? []),
  ];
}

function extraIntellectFor(family: Family, level: number, baseIQ: number): number | null {
  if (level <= 0) return null;
  const technical = new Set<Family>(['engineering', 'analytics', 'security', 'science']);
  if (!technical.has(family)) return null;
  return Math.min(100, baseIQ + 5 * level);
}

function clamp01_100(n: number) {
  return Math.max(0, Math.min(100, Math.round(n)));
}
