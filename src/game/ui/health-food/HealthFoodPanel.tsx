import React from 'react';
import { useGame } from '../../store';
import OptionCard from './OptionCard';
import StatsStrip from './StatsStrip';
import { HeartIcon, BoltIcon, CoinsIcon } from '../Icon';
import type { StatKey } from '../../types';

const toNaira = (n: number) => `₦${Math.max(0, Math.round(n)).toLocaleString()}`;

export default function HealthFoodPanel() {
  const { state, applyAction } = useGame();
  const { wealth } = state.stats;

  // Local toast
  const [toast, setToast] = React.useState<string | null>(null);
  const show = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 1400); };

  // Which stats to showcase per container
  const FOOD_STATS: StatKey[] = ['health', 'energy', 'happiness', 'cooking'];
  const HEALTH_STATS: StatKey[] = ['health', 'fitness', 'hygiene', 'stress', 'energy', 'resilience'];

  // ---- FOOD OPTIONS (8) ----
  const food = [
    { id: 'food.groceries',   title: 'Buy Groceries',           desc: 'Stock up for the week.',      cost: 8000,  deltas: { health: +2, energy: +5, cooking: +1, happiness: +1 } },
    { id: 'food.eat_out',     title: 'Eat Out (Local Eatery)',  desc: 'Treat yourself.',              cost: 5000,  deltas: { health: +1, happiness: +3 } },
    { id: 'food.cook_meal',   title: 'Cook Simple Meal',        desc: 'Home-cooked is love.',         cost: 2000,  deltas: { health: +2, energy: +2, cooking: +2, happiness: +1 } },
    { id: 'food.takeout',     title: 'Order Takeout',           desc: 'Fast and easy.',               cost: 7000,  deltas: { happiness: +2, energy: +3 } },
    { id: 'food.street',      title: 'Street Food',             desc: 'Tasty but risky.',             cost: 1500,  deltas: { happiness: +1, energy: +2, health: -1 } },
    { id: 'food.mealprep',    title: 'Meal Prep (3 days)',      desc: 'Cook in bulk, save time.',     cost: 10000, deltas: { health: +3, energy: +5, cooking: +3 } },
    { id: 'food.fine_dining', title: 'Fine Dining',             desc: 'Luxury experience.',           cost: 25000, deltas: { happiness: +5, reputation: +2, health: +1 } },
    { id: 'food.snacks',      title: 'Buy Snacks',              desc: 'Quick bites.',                 cost: 1000,  deltas: { energy: +1, happiness: +1, health: -1 } },
  ] as const;

  // ---- HEALTH OPTIONS (11) ----
  const health = [
    { id: 'health.drugs',    title: 'Buy Drugs (OTC)',  desc: 'Painkillers, cold meds, etc.', cost: 3500,  deltas: { health: +3, happiness: -1 } },
    { id: 'health.clinic',   title: 'Go to Clinic',     desc: 'Professional checkup.',        cost: 12000, deltas: { health: +6 } },
    { id: 'health.get_help', title: 'Get Help',         desc: 'Talk to someone / support.',   cost: 1000,  deltas: { happiness: +2, resilience: +2 } },
    { id: 'health.vitamins', title: 'Buy Vitamins',     desc: 'Daily supplements.',           cost: 4000,  deltas: { health: +2, energy: +2 } },
    { id: 'health.herbal',   title: 'Herbal Remedy',    desc: 'Local alternative care.',      cost: 2500,  deltas: { health: +1, happiness: +1 } },
    { id: 'health.therapy',  title: 'Therapy Session',  desc: 'Talk to a therapist.',         cost: 15000, deltas: { happiness: +4, stress: -4 } },
    { id: 'health.dental',   title: 'Dental Checkup',   desc: 'Clean & check.',               cost: 20000, deltas: { hygiene: +4, health: +2 } },
    { id: 'health.eye',      title: 'Eye Test',         desc: 'Vision screening.',            cost: 8000,  deltas: { wisdom: +1, health: +1 } },
    { id: 'health.vaccine',  title: 'Vaccination',      desc: 'Stay protected.',              cost: 18000, deltas: { health: +4, resilience: +3 } },
    { id: 'health.massage',  title: 'Massage / Physio', desc: 'Relax & recover.',             cost: 10000, deltas: { stress: -3, energy: +3, health: +1 } },
    { id: 'health.gym_pass', title: 'Gym Day Pass',     desc: 'One day workout.',             cost: 2500,  deltas: { fitness: +4, health: +2, energy: -2, happiness: +1 } },
  ] as const;

  // Affordability pills
  const affordableFood = food.filter(f => wealth >= f.cost).length;
  const affordableHealth = health.filter(h => wealth >= h.cost).length;

  // Wallet tone (border/glow) based on wealth
  const walletTone = wealth <= 2000 ? '#f87171' : wealth <= 10000 ? '#f59e0b' : '#34d399';

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      {/* Sticky header with Wallet card */}
      <div
        className="header"
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 5,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 12,
          backdropFilter: 'blur(6px)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
          <HeartIcon />
          <div style={{ minWidth: 0 }}>
            <div className="title" style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <span>Health & Food</span>
              <span className="sub" style={{ fontSize: 11 }}>Manage your eating and wellbeing</span>
            </div>
          </div>
        </div>

        {/* Wallet card */}
        <div
          role="status"
          aria-label={`Wallet balance ${toNaira(wealth)}`}
          style={{
            display: 'grid',
            gridAutoFlow: 'column',
            alignItems: 'center',
            gap: 10,
            padding: '10px 12px',
            borderRadius: 12,
            border: `1px solid ${walletTone}`,
            background: 'linear-gradient(160deg, rgba(14,165,233,.25), rgba(59,130,246,.22))',
            boxShadow: `0 6px 22px rgba(0,0,0,.35), 0 0 0 3px ${walletTone}22 inset`,
            minWidth: 220,
          }}
          title="Available funds"
        >
          <div
            style={{
              width: 34, height: 34, display: 'grid', placeItems: 'center',
              borderRadius: 10, color: '#dbeafe',
              background: '#0b1220', border: '1px solid var(--border)',
              boxShadow: 'inset 0 0 10px rgba(255,255,255,.06)',
            }}
          >
            <CoinsIcon />
          </div>
          <div style={{ display: 'grid', lineHeight: 1 }}>
            <span style={{ color: 'rgba(255,255,255,.75)', fontSize: 11, fontWeight: 700, letterSpacing: .4 }}>WALLET</span>
            <span style={{ fontWeight: 900, fontSize: 18, letterSpacing: .2 }}>{toNaira(wealth)}</span>
          </div>
        </div>
      </div>

      {/* FOOD */}
      <div className="card" style={{ display: 'grid', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <BoltIcon />
          <b>Food</b>
          <span
            className="tag"
            style={{
              marginLeft: 'auto',
              background: 'rgba(125,211,252,.15)',
              borderColor: 'rgba(125,211,252,.35)',
              color: '#cfe4ff',
            }}
            title={`${affordableFood} affordable options`}
          >
            Affordable: {affordableFood}/{food.length}
          </span>
        </div>

        {/* attached stat meters for Food */}
        <StatsStrip keys={FOOD_STATS} stats={state.stats} />

        <div className="choices" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))' }}>
          {food.map(opt => (
            <OptionCard
              key={opt.id}
              id={opt.id}
              title={opt.title}
              desc={opt.desc}
              cost={opt.cost}
              effects={Object.entries(opt.deltas).map(([k, v]) => ({ k, v: v as number }))}
              disabled={wealth < opt.cost}
              onPick={() => {
                const ok = applyAction({ id: opt.id, label: opt.title, cost: opt.cost, deltas: opt.deltas });
                show(ok ? `✓ ${opt.title} — ${toNaira(opt.cost)}` : 'Insufficient funds');
              }}
            />
          ))}
        </div>
      </div>

      {/* HEALTH */}
      <div className="card" style={{ display: 'grid', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <HeartIcon />
          <b>Health</b>
          <span
            className="tag"
            style={{
              marginLeft: 'auto',
              background: 'rgba(125,211,252,.15)',
              borderColor: 'rgba(125,211,252,.35)',
              color: '#cfe4ff',
            }}
            title={`${affordableHealth} affordable options`}
          >
            Affordable: {affordableHealth}/{health.length}
          </span>
        </div>

        {/* attached stat meters for Health */}
        <StatsStrip keys={HEALTH_STATS} stats={state.stats} />

        <div className="choices" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))' }}>
          {health.map(opt => (
            <OptionCard
              key={opt.id}
              id={opt.id}
              title={opt.title}
              desc={opt.desc}
              cost={opt.cost}
              effects={Object.entries(opt.deltas).map(([k, v]) => ({ k, v: v as number }))}
              disabled={wealth < opt.cost}
              onPick={() => {
                const ok = applyAction({ id: opt.id, label: opt.title, cost: opt.cost, deltas: opt.deltas });
                show(ok ? `✓ ${opt.title} — ${toNaira(opt.cost)}` : 'Insufficient funds');
              }}
            />
          ))}
        </div>
      </div>

      {toast && (
        <div
          style={{
            position: 'fixed', right: 16, bottom: 84, zIndex: 90,
            background: 'linear-gradient(160deg, #0ea5e9, #3b82f6)',
            padding: '8px 10px', border: '1px solid #2a5cc1', borderRadius: 10,
            boxShadow: '0 10px 24px rgba(0,0,0,.3)',
          }}
        >
          {toast}
        </div>
      )}
    </div>
  );
}
