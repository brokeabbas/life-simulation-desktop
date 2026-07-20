// src/game/ui/jobs/CurrentEmployment.tsx
import React from 'react';
import { useGame } from '../../store';
import { JOBS, salaryPerDay } from '../../engine';
import OfficeActionCard from './OfficeActionCard';
import CoworkersModal from './CoworkersModal';
import { BriefcaseIcon } from '../Icon';
import type { StatKey } from '../../types';

const toNaira = (n: number) => `₦${Math.max(0, Math.round(n)).toLocaleString()}`;

type OfficeAction = {
  id: string;
  title: string;
  desc: string;
  cost: number;
  deltas: Partial<Record<StatKey, number>>;
  on: () => void;
  danger?: boolean;
  highlight?: boolean;
  disabled?: boolean;
};

export default function CurrentEmployment() {
  const { state, applyAction, applyJob } = useGame();
  const { job } = state;

  const [coworkersOpen, setCoworkersOpen] = React.useState(false);

  if (!job) {
    return (
      <div className="card" style={{ display: 'grid', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <BriefcaseIcon />
          <div>
            <div className="title">Current Employment</div>
            <div className="sub">You’re currently unemployed</div>
          </div>
        </div>

        <div
          style={{
            display: 'grid',
            gap: 8,
            justifyItems: 'center',
            textAlign: 'center',
            padding: '16px 10px',
            border: '1px dashed var(--border)',
            borderRadius: 12,
            background: 'linear-gradient(170deg, rgba(16,24,39,.35), rgba(16,24,39,.20))',
          }}
        >
          <div style={{ fontWeight: 800 }}>No active employment</div>
          <div className="muted" style={{ fontSize: 12 }}>Switch to “Seek Jobs” to browse openings and apply.</div>
        </div>
      </div>
    );
  }

  const def = JOBS[job.id];
  const title = `${def?.title ?? job.id} · Lv ${job.level}`;
  const perDay = `${toNaira(salaryPerDay(job))}/day`;

  // toast
  const [toast, setToast] = React.useState<string | null>(null);
  const show = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 1400); };

  // helpers
  const run = (label: string, cost: number, deltas: Partial<Record<StatKey, number>>) => {
    const ok = applyAction({ id: `office.${label.toLowerCase().replace(/\s+/g, '_')}`, label, cost, deltas });
    show(ok ? `✓ ${label}${cost ? ` — ${toNaira(cost)}` : ''}` : 'Insufficient funds');
  };
  const gain = (amount: number, label = 'Progress') => {
    applyJob({ kind: 'progress', delta: amount });
    show(`+${amount}% ${label}`);
  };

  const canPromote = job.level < (def?.maxLevel ?? job.level);
  const progress = Math.max(0, Math.min(100, Math.round(job.progress ?? 0)));

  // ===== Actions =====
  const actions: OfficeAction[] = [
    // 🔎 NEW: View Co-workers (opens modal)
    {
      id: 'view_coworkers',
      title: 'View Co-workers',
      desc: 'See org roster: titles, ages, tenure & influence.',
      cost: 0,
      deltas: {},
      on: () => setCoworkersOpen(true),
    },

    // ——— Core growth
    {
      id: 'view_boss',
      title: 'Meet with Boss',
      desc: 'Schedule a 1:1 catch-up with your manager.',
      cost: 0,
      deltas: { communication: +1, reputation: +1, stress: -1 },
      on: () => { run('Meet with Boss', 0, { communication: +1, reputation: +1, stress: -1 }); gain(5, 'Momentum'); },
    },
    {
      id: 'work_harder',
      title: 'Work Harder (Overtime)',
      desc: 'Push extra hours to polish your deliverables.',
      cost: 0,
      deltas: { discipline: +2, reputation: +1, energy: -5, stress: +2 },
      on: () => { run('Work Harder (Overtime)', 0, { discipline: +2, reputation: +1, energy: -5, stress: +2 }); gain(10); },
    },
    {
      id: 'update_position',
      title: 'Set Objectives',
      desc: 'Define quarterly goals with measurable outcomes.',
      cost: 0,
      deltas: { ambition: +2, communication: +1 },
      on: () => { run('Set Objectives', 0, { ambition: +2, communication: +1 }); gain(8); },
    },
    {
      id: 'mentor_junior',
      title: 'Mentor a Junior',
      desc: 'Help a teammate grow; you’ll learn too.',
      cost: 0,
      deltas: { empathy: +2, reputation: +1 },
      on: () => { run('Mentor a Junior', 0, { empathy: +2, reputation: +1 }); gain(6); },
    },
    {
      id: 'critical_fix',
      title: 'Ship Critical Fix',
      desc: 'Overnight hotfix saves the day.',
      cost: 0,
      deltas: { reputation: +2, intellect: +2, energy: -8, health: -1, happiness: -1 },
      on: () => { run('Ship Critical Fix', 0, { reputation: +2, intellect: +2, energy: -8, health: -1, happiness: -1 }); gain(25, 'Milestone'); },
      highlight: true,
    },
    {
      id: 'volunteer',
      title: 'Volunteer for Stretch Project',
      desc: 'Step up for visibility.',
      cost: 0,
      deltas: { ambition: +2, discipline: +1, stress: +1 },
      on: () => { run('Volunteer for Stretch Project', 0, { ambition: +2, discipline: +1, stress: +1 }); gain(15); },
    },
    {
      id: 'ask_promotion',
      title: 'Pitch for Promotion',
      desc: canPromote ? 'Make your case; fills the meter faster.' : 'You are at max level.',
      cost: 0,
      deltas: { confidence: +1, communication: +1 },
      disabled: !canPromote,
      on: () => {
        if (!canPromote) return;
        run('Pitch for Promotion', 0, { confidence: +1, communication: +1 });
        gain(20, 'Promotion Pitch');
      },
    },

    // ——— Finance / business
    {
      id: 'buy_shares',
      title: 'Buy Shares',
      desc: 'Invest in the market for long-term gains.',
      cost: 50000,
      deltas: { wealth: -50000, financialLiteracy: +2, reputation: +1 },
      on: () => run('Buy Shares', 50000, { wealth: -50000, financialLiteracy: +2, reputation: +1 }),
    },
    {
      id: 'buy_company',
      title: 'Buy Company',
      desc: 'Acquire a small firm; huge commitment.',
      cost: 5000000,
      deltas: { wealth: -5000000, confidence: +5, reputation: +4, stress: +3 },
      on: () => run('Buy Company', 5000000, { wealth: -5000000, confidence: +5, reputation: +4, stress: +3 }),
    },

    // ——— Immoral (existing)
    {
      id: 'embezzle',
      title: 'Embezzle Funds',
      desc: 'Illicit shortcut—high moral and reputational risk.',
      cost: 0,
      deltas: { wealth: +100000, morality: -15, reputation: -12, stress: +10, happiness: -3 },
      on: () => { run('Embezzle Funds', 0, { wealth: +100000, morality: -15, reputation: -12, stress: +10, happiness: -3 }); gain(5, 'Dubious Boost'); },
      danger: true,
    },

    // ——— Immoral (NEW)
    {
      id: 'sleep_with_boss',
      title: 'Sleep with Boss',
      desc: 'Consensual affair for favoritism; severe moral, legal & reputational risk.',
      cost: 0,
      deltas: { morality: -25, reputation: -22, stress: +12, happiness: +2 },
      on: () => { run('Sleep with Boss', 0, { morality: -25, reputation: -22, stress: +12, happiness: +2 }); gain(16, 'Improper Favor'); },
      danger: true,
    },
    {
      id: 'take_credit',
      title: 'Take Credit for Team Work',
      desc: 'Claim ownership of others’ effort to look good.',
      cost: 0,
      deltas: { morality: -10, reputation: -12, confidence: +2, happiness: -2 },
      on: () => { run('Take Credit for Team Work', 0, { morality: -10, reputation: -12, confidence: +2, happiness: -2 }); gain(12, 'Perceived Impact'); },
      danger: true,
    },
    {
      id: 'sabotage_colleague',
      title: 'Sabotage a Colleague',
      desc: 'Quietly obstruct a rival’s delivery.',
      cost: 0,
      deltas: { morality: -20, reputation: -15, stress: +8, ambition: +2 },
      on: () => { run('Sabotage a Colleague', 0, { morality: -20, reputation: -15, stress: +8, ambition: +2 }); gain(10, 'Competitive Edge'); },
      danger: true,
    },
    {
      id: 'falsify_reports',
      title: 'Falsify Reports',
      desc: 'Pad metrics to impress stakeholders.',
      cost: 0,
      deltas: { morality: -15, reputation: -18, stress: +6, financialLiteracy: +1 },
      on: () => { run('Falsify Reports', 0, { morality: -15, reputation: -18, stress: +6, financialLiteracy: +1 }); gain(20, 'Inflated Results'); },
      danger: true,
    },
    {
      id: 'accept_kickback',
      title: 'Accept Kickback',
      desc: 'Quiet cash for “preferential” vendor selection.',
      cost: 0,
      deltas: { wealth: +60000, morality: -12, reputation: -8, stress: +5 },
      on: () => { run('Accept Kickback', 0, { wealth: +60000, morality: -12, reputation: -8, stress: +5 }); gain(6, 'Risky Favor'); },
      danger: true,
    },
    {
      id: 'spread_rumors',
      title: 'Spread Rumors About Rival',
      desc: 'Undermine a competitor’s standing socially.',
      cost: 0,
      deltas: { morality: -8, reputation: -10, social: -2, stress: +3 },
      on: () => { run('Spread Rumors About Rival', 0, { morality: -8, reputation: -10, social: -2, stress: +3 }); gain(6, 'Office Politics'); },
      danger: true,
    },

    // ——— Power play (NEW ×2)
    {
      id: 'ally_exec',
      title: 'Forge Executive Alliance',
      desc: 'Secure sponsorship from a senior exec.',
      cost: 0,
      deltas: { reputation: +6, ambition: +3, communication: +2, confidence: +2 },
      on: () => { run('Forge Executive Alliance', 0, { reputation: +6, ambition: +3, communication: +2, confidence: +2 }); gain(18, 'Executive Backing'); },
      highlight: true,
    },
    {
      id: 'control_narrative',
      title: 'Control the Narrative',
      desc: 'Shape comms & visibility to favor your roadmap.',
      cost: 0,
      deltas: { reputation: +4, communication: +3, confidence: +2 },
      on: () => { run('Control the Narrative', 0, { reputation: +4, communication: +3, confidence: +2 }); gain(14, 'Strategic Visibility'); },
      highlight: true,
    },

    // ——— Wellness / misc
    {
      id: 'remote_day',
      title: 'Take a Remote Day',
      desc: 'Recharge while staying productive.',
      cost: 0,
      deltas: { stress: -3, energy: +2, happiness: +1 },
      on: () => run('Take a Remote Day', 0, { stress: -3, energy: +2, happiness: +1 }),
    },
    {
      id: 'team_lunch',
      title: 'Host Team Lunch',
      desc: 'Everyone loves food. You pay.',
      cost: 8000,
      deltas: { happiness: +3, social: +2 },
      on: () => run('Host Team Lunch', 8000, { happiness: +3, social: +2 }),
    },
    {
      id: 'training',
      title: 'Take Training Course',
      desc: 'Upskill with a paid course.',
      cost: 15000,
      deltas: { intellect: +3, confidence: +2, financialLiteracy: +1 },
      on: () => run('Take Training Course', 15000, { intellect: +3, confidence: +2, financialLiteracy: +1 }),
    },
    {
      id: 'present',
      title: 'Present at Stand-up',
      desc: 'Give a crisp update; inspire the squad.',
      cost: 0,
      deltas: { confidence: +2, communication: +2, stress: +1 },
      on: () => run('Present at Stand-up', 0, { confidence: +2, communication: +2, stress: +1 }),
    },
    {
      id: 'politics',
      title: 'Navigate Office Politics',
      desc: 'Handle tricky dynamics with tact.',
      cost: 0,
      deltas: { wisdom: +1, resilience: +1, stress: +1 },
      on: () => run('Navigate Office Politics', 0, { wisdom: +1, resilience: +1, stress: +1 }),
    },
    {
      id: 'resign',
      title: 'Resign Gracefully',
      desc: 'Close the chapter on a high note.',
      cost: 0,
      deltas: { reputation: -2, happiness: +2, stress: -2 },
      on: () => { run('Resign Gracefully', 0, { reputation: -2, happiness: +2, stress: -2 }); applyJob({ kind: 'quit' }); },
      danger: true,
    },
  ] as const;

  return (
    <>
      <div style={{ display: 'grid', gap: 12 }}>
        {/* Header + Progress */}
        <div className="card" style={{ display: 'grid', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <BriefcaseIcon />
            <div style={{ fontWeight: 800 }}>{title}</div>
            <span className="muted">• {job.daysWorked ?? 0} days worked</span>
            <span style={{ marginLeft: 'auto', fontWeight: 800 }}>{perDay}</span>
          </div>

          <div style={{ display: 'grid', gap: 6 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <b>Progress to Promotion</b>
              <span className="muted" style={{ fontSize: 12 }}>{progress}%</span>
            </div>
            <div
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={progress}
              style={{
                position: 'relative',
                height: 12,
                borderRadius: 999,
                background: '#0b1220',
                border: '1px solid var(--border)',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  height: '100%',
                  width: `${progress}%`,
                  background: 'linear-gradient(90deg,#10b981,#22d3ee,#3b82f6)',
                  boxShadow: '0 0 14px rgba(59,130,246,.35)',
                }}
              />
            </div>
            <div className="muted" style={{ fontSize: 12 }}>
              Fill to 100% to earn a bonus, reputation boost, and automatic promotion (if eligible).
            </div>
          </div>
        </div>

        {/* Actions grid */}
        <div className="card" style={{ display: 'grid', gap: 10 }}>
          <div style={{ fontWeight: 800 }}>Office Actions</div>
          <div className="choices" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))' }}>
            {actions.map(a => (
              <OfficeActionCard
                key={a.id}
                title={a.title}
                desc={a.desc}
                cost={a.cost}
                effects={Object.entries(a.deltas).map(([k, v]) => ({ k: k as StatKey, v: v as number }))}
                actionLabel={a.id === 'view_coworkers' ? 'Open' : a.danger ? 'Proceed' : a.highlight ? 'Do it' : 'Select'}
                variant={a.danger ? 'danger' : a.highlight ? 'primary' : 'default'}
                disabled={!!a.disabled}
                onAction={a.on}
              />
            ))}
          </div>
        </div>

        {toast && (
          <div
            style={{
              position:'fixed', right:16, bottom:84, zIndex:90,
              background:'linear-gradient(160deg, #0ea5e9, #3b82f6)',
              padding:'8px 10px', border:'1px solid #2a5cc1', borderRadius:10,
              boxShadow:'0 10px 24px rgba(0,0,0,.3)',
            }}
          >
            {toast}
          </div>
        )}
      </div>

      {/* Coworkers Modal */}
      {coworkersOpen && (
        <CoworkersModal
          companyName={job.company ?? 'Your Company'}
          seed={`${state.seed}:${job.company ?? 'co'}`}
          onClose={() => setCoworkersOpen(false)}
        />
      )}
    </>
  );
}
