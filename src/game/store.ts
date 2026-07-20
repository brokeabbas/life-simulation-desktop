// src/game/store.ts
import { create } from 'zustand';
import { produce } from 'immer';
import {
  newGame,
  nextStep,
  choose,
  advanceDay,
  JOBS,
  salaryPerDay,
  syncGameFromWorld,
  syncWorldFromGame,
} from './engine';
import type { GameEvent, GameState, Choice, Gender, StatBlock, StatKey } from './types';
import { saveGame, loadGame } from './save';
import type { Category } from './lifestyle/categories';
import { tagsForCategory } from './lifestyle/categories';
import { seededRandom } from './rng';
import { applyPrimarySchoolChoice, startPrimarySchool } from './school/school';
import { advanceWorldYears, continueAsChild, runGenerationalDemo } from './simulation/simulation';
import { ageInYears } from './world/date';
import { getActivePerson } from './world/selectors';
import { applyLifeAction } from './life/lifeActions';
import {
  advanceEducationTerm as advanceEducationTermWorld,
  applyEducationChoice as applyEducationChoiceWorld,
  enrollActiveStudent,
  ensureEducationState,
  runEducationExam as runEducationExamWorld,
} from './education/educationSimulation';

type Screen = 'dashboard' | 'category';

type ApplyActionPayload = {
  id: string;
  label: string;
  cost: number;
  deltas: Partial<StatBlock>; // e.g. { health:+2, energy:+1 }
};

type ApplyJobPayload =
  | { kind: 'apply'; jobId: string; level?: number; company?: string | null; demand?: number; payMultiplier?: number }
  | { kind: 'promote'; levels?: number }
  | { kind: 'quit' }
  | { kind: 'progress'; delta: number }; // progress meter delta (0..100)

// 👇 lightweight coworker relationship tracking (UI-layer)
// key convention: `${seed}:${company}:${employeeId}`
type RelationKind = 'neutral' | 'contact' | 'friend' | 'ally' | 'rival' | 'romance';
type RelationState = { opinion: number; relation: RelationKind };

/* =======================
   Business (UI-layer)
   ======================= */
export type IndustryId =
  | 'tech' | 'food' | 'fashion' | 'transport' | 'health'
  | 'education' | 'agriculture' | 'energy' | 'media';

export type Business = {
  id: string;
  name: string;
  industry: IndustryId;
  foundedDay: number;
  capital: number;     // total invested by player
  cash: number;        // company cash (for dividends etc.)
  demand: number;      // 0..100 (market interest)
  quality: number;     // 0..100 (product/ops quality)
  marketing: number;   // 0..100 (brand reach)
  staff: number;       // headcount
  branches: number;    // scaling
  baseRevPerDay: number;
  baseCostPerDay: number;
  lastSimDay: number;  // last game day we simulated to
  alive: boolean;
};

type CreateBizPayload = { name: string; industry: IndustryId; capital: number };

export type UIState = {
  state: GameState;
  current: { event: GameEvent | null; choices: Choice[] };
  selected: Category | null;
  screen: Screen;

  start: (seed?: string, gender?: Gender) => void;
  setGender: (gender: Gender) => void;

  setCategory: (cat: Category | null) => void;
  back: () => void;

  roll: () => void;
  execute: () => void;
  advance: () => void;
  startSchool: () => boolean;
  chooseSchoolAction: (choiceId: string) => boolean;
  startEducation: () => boolean;
  applyEducationChoice: (choiceId: string) => boolean;
  advanceEducationTerm: () => boolean;
  runEducationExam: () => boolean;
  advanceYears: (years: number) => void;
  runSeedScenario: () => boolean;
  continueAsLineageChild: (childId: string) => boolean;
  applyCategoryLifeAction: (category: Category, actionId: string) => boolean;

  applyAction: (payload: ApplyActionPayload) => boolean;
  applyJob: (payload: ApplyJobPayload) => boolean;

  // 👇 coworkers: UI-persistent (not saved to disk yet)
  relations: Record<string, RelationState>;
  getOpinion: (key: string, fallback: number) => number;
  changeOpinion: (key: string, delta: number) => number;
  setRelation: (key: string, relation: RelationKind) => void;

  // === Business (UI-layer) ===
  businesses: Record<string, Business>;
  createBusiness: (p: CreateBizPayload) => boolean;
  simulateBusinesses: () => void;
  bizInjectCapital: (id: string, amount: number) => boolean;
  bizWithdrawDividends: (id: string, amount: number) => boolean;
  bizHire: (id: string, count: number) => boolean;
  bizInvestMarketing: (id: string, naira: number) => boolean;
  bizInvestRnD: (id: string, naira: number) => boolean;
  bizOpenBranch: (id: string) => boolean;

  save: () => Promise<void>;
  load: () => Promise<void>;
};

console.log('[store] init');

const initial = newGame();

// helpers
function tagsForScreen(screen: Screen, selected: Category | null) {
  return screen === 'category' && selected ? tagsForCategory(selected) : undefined;
}

function normalizeLoadedState(data: GameState): GameState {
  const hasWorld = Boolean((data as Partial<GameState>).world);
  if (!hasWorld) {
    const fresh = newGame(data.seed ?? 'yakubu', data.gender ?? 'female');
    return {
      ...fresh,
      ...data,
      world: fresh.world,
      day: fresh.day,
      dateISO: fresh.dateISO,
      stats: fresh.stats,
      traits: fresh.traits,
    };
  }

  const next = { ...data };
  ensureEducationState(next.world);
  syncGameFromWorld(next);
  return next;
}

function clamp01(n: number) {
  return Math.max(0, Math.min(100, n));
}
function clamp100(n: number) {
  return Math.max(0, Math.min(100, Math.round(n)));
}

function industryDefaults(industry: IndustryId) {
  // Tuned to your game's Naira scale; tweak as desired
  switch (industry) {
    case 'tech':         return { baseRevPerDay: 12000, baseCostPerDay: 4500 };
    case 'food':         return { baseRevPerDay:  8000, baseCostPerDay: 3800 };
    case 'fashion':      return { baseRevPerDay:  7000, baseCostPerDay: 3200 };
    case 'transport':    return { baseRevPerDay:  9000, baseCostPerDay: 5200 };
    case 'health':       return { baseRevPerDay: 11000, baseCostPerDay: 6000 };
    case 'education':    return { baseRevPerDay:  7500, baseCostPerDay: 3300 };
    case 'agriculture':  return { baseRevPerDay:  6800, baseCostPerDay: 3000 };
    case 'energy':       return { baseRevPerDay: 14000, baseCostPerDay: 9000 };
    case 'media':        return { baseRevPerDay:  7200, baseCostPerDay: 3100 };
    default:             return { baseRevPerDay:  7000, baseCostPerDay: 3000 };
  }
}

function simulateOne(b: Business, days: number, seed: string) {
  if (days <= 0 || !b.alive) return { deltaCash: 0 };

  const rnd = seededRandom(`biz:${seed}:${b.id}:${b.lastSimDay}`);
  const staffCostPerDay = 900; // avg per head
  const branchMultiplier = 1 + Math.max(0, b.branches - 1) * 0.22; // each extra branch +22% scale
  const demandBoost = 1 + (b.demand / 100) * 0.60; // demand is strong driver
  const qualityBoost = 1 + (b.quality / 100) * 0.30;
  const marketingBoost = 1 + (b.marketing / 100) * 0.25;

  // slight noise
  const volatility = 1 + (rnd() - 0.5) * 0.06; // ±3%

  const revPerDay =
    b.baseRevPerDay * branchMultiplier * demandBoost * qualityBoost * marketingBoost * volatility;
  const costPerDay =
    b.baseCostPerDay * branchMultiplier + b.staff * staffCostPerDay + (b.marketing * 10);

  const profitPerDay = Math.round(revPerDay - costPerDay);
  const deltaCash = Math.max(-999999999, profitPerDay * days);
  return { deltaCash };
}

export const useGame = create<UIState>((set, get) => ({
  state: initial,
  current: nextStep(initial),
  selected: null,
  screen: 'dashboard',

  // ===== Basic lifecycle
  start: (seed = 'yakubu', gender) => {
    const s = newGame(seed, gender ?? 'female');
    set({
      state: s,
      current: nextStep(s),
      selected: null,
      screen: 'dashboard',
      relations: {},
      businesses: {},
    });
  },

  setGender: (gender) => {
    const next = produce(get().state, (draft) => {
      draft.gender = gender;
      const active = getActivePerson(draft.world);
      if (active) active.gender = gender;
      syncGameFromWorld(draft);
    });
    set({ state: next });
  },

  setCategory: (cat) => {
    const { state } = get();
    if (cat) {
      const tags = tagsForCategory(cat);
      set({ selected: cat, screen: 'category', current: nextStep(state, tags) });
    } else {
      set({ selected: null, screen: 'dashboard', current: nextStep(state) });
    }
  },

  back: () => set({ selected: null, screen: 'dashboard' }),

  roll: () => {
    const { state, selected, screen } = get();
    const tags = screen === 'category' && selected ? tagsForCategory(selected) : undefined;
    set({ current: nextStep(state, tags) });
  },

  execute: () => {
    const { state, current, selected, screen } = get();
    if (!current.event || !current.choices.length) return;
    const first = current.choices[0];
    const next = choose(state, current.event, first);
    const tags = screen === 'category' && selected ? tagsForCategory(selected) : undefined;
    set({ state: next, current: nextStep(next, tags) });
  },

  advance: () => {
    const { state, selected, screen } = get();
    const next = advanceDay(state);
    const tags = screen === 'category' && selected ? tagsForCategory(selected) : undefined;
    set({ state: next, current: nextStep(next, tags) });
  },

  startSchool: () => {
    const { state, selected, screen } = get();
    let ok = false;
    const next = produce(state, (draft) => {
      const active = getActivePerson(draft.world);
      if (!active) return;
      const age = ageInYears(active.birthDate, draft.world.currentDate);
      if (age < 5) advanceWorldYears(draft.world, 5 - age);
      const school = startPrimarySchool(draft.world);
      ok = Boolean(school);
      syncGameFromWorld(draft);
      if (ok) {
        draft.history.push({
          day: draft.day,
          eventId: 'world.school.start_primary',
          choiceId: 'start_primary',
          delta: {},
        });
      }
    });
    if (ok) {
      set({ state: next, current: nextStep(next, tagsForScreen(screen, selected)) });
    }
    return ok;
  },

  chooseSchoolAction: (choiceId) => {
    const { state, selected, screen } = get();
    let ok = false;
    const next = produce(state, (draft) => {
      ok = applyPrimarySchoolChoice(draft.world, choiceId);
      if (!ok) return;
      syncGameFromWorld(draft);
      draft.history.push({
        day: draft.day,
        eventId: `world.school.${choiceId}`,
        choiceId,
        delta: {},
      });
    });
    if (ok) {
      set({ state: next, current: nextStep(next, tagsForScreen(screen, selected)) });
    }
    return ok;
  },

  startEducation: () => {
    const { state, selected, screen } = get();
    let ok = false;
    const next = produce(state, (draft) => {
      ensureEducationState(draft.world);
      const active = getActivePerson(draft.world);
      if (!active) return;
      const age = ageInYears(active.birthDate, draft.world.currentDate);
      if (age < 5) advanceWorldYears(draft.world, 5 - age);
      ok = enrollActiveStudent(draft.world);
      if (!ok) return;
      syncGameFromWorld(draft);
      draft.history.push({
        day: draft.day,
        eventId: 'education.start',
        choiceId: 'start_primary_school',
        delta: {},
      });
    });
    if (ok) {
      set({ state: next, current: nextStep(next, tagsForScreen(screen, selected)) });
    }
    return ok;
  },

  applyEducationChoice: (choiceId) => {
    const { state, selected, screen } = get();
    let ok = false;
    const next = produce(state, (draft) => {
      ensureEducationState(draft.world);
      ok = applyEducationChoiceWorld(draft.world, choiceId);
      if (!ok) return;
      syncGameFromWorld(draft);
      draft.history.push({
        day: draft.day,
        eventId: `education.choice.${choiceId}`,
        choiceId,
        delta: {},
      });
    });
    if (ok) {
      set({ state: next, current: nextStep(next, tagsForScreen(screen, selected)) });
    }
    return ok;
  },

  advanceEducationTerm: () => {
    const { state, selected, screen } = get();
    let ok = false;
    const next = produce(state, (draft) => {
      ensureEducationState(draft.world);
      ok = advanceEducationTermWorld(draft.world);
      if (!ok) return;
      syncGameFromWorld(draft);
      draft.history.push({
        day: draft.day,
        eventId: 'education.term.advance',
        choiceId: 'advance_term',
        delta: {},
      });
    });
    if (ok) {
      set({ state: next, current: nextStep(next, tagsForScreen(screen, selected)) });
    }
    return ok;
  },

  runEducationExam: () => {
    const { state, selected, screen } = get();
    let ok = false;
    const next = produce(state, (draft) => {
      ensureEducationState(draft.world);
      ok = runEducationExamWorld(draft.world);
      if (!ok) return;
      syncGameFromWorld(draft);
      draft.history.push({
        day: draft.day,
        eventId: 'education.exam.run',
        choiceId: 'term_exam',
        delta: {},
      });
    });
    if (ok) {
      set({ state: next, current: nextStep(next, tagsForScreen(screen, selected)) });
    }
    return ok;
  },

  advanceYears: (years) => {
    const { state, selected, screen } = get();
    const next = produce(state, (draft) => {
      advanceWorldYears(draft.world, years);
      syncGameFromWorld(draft);
      draft.history.push({
        day: draft.day,
        eventId: 'world.advance_years',
        choiceId: String(years),
        delta: {},
      });
    });
    set({ state: next, current: nextStep(next, tagsForScreen(screen, selected)) });
  },

  runSeedScenario: () => {
    const { state, selected, screen } = get();
    let ok = false;
    const next = produce(state, (draft) => {
      ok = runGenerationalDemo(draft.world);
      if (!ok) return;
      syncGameFromWorld(draft);
      draft.history.push({
        day: draft.day,
        eventId: 'world.demo.generational_seed',
        choiceId: 'run',
        delta: {},
      });
    });
    if (ok) {
      set({ state: next, current: nextStep(next, tagsForScreen(screen, selected)) });
    }
    return ok;
  },

  continueAsLineageChild: (childId) => {
    const { state, selected, screen } = get();
    let ok = false;
    const next = produce(state, (draft) => {
      ok = continueAsChild(draft.world, childId);
      if (!ok) return;
      syncGameFromWorld(draft);
      draft.history.push({
        day: draft.day,
        eventId: 'world.lineage.continue_as_child',
        choiceId: childId,
        delta: {},
      });
    });
    if (ok) {
      set({ state: next, current: nextStep(next, tagsForScreen(screen, selected)) });
    }
    return ok;
  },

  applyCategoryLifeAction: (category, actionId) => {
    const { state, selected, screen } = get();
    let ok = false;
    const next = produce(state, (draft) => {
      const result = applyLifeAction(draft.world, category, actionId);
      ok = result.ok;
      if (!ok) return;
      syncGameFromWorld(draft);
      draft.history.push({
        day: draft.day,
        eventId: `category.${category}.${actionId}`,
        choiceId: result.message,
        delta: {},
      });
    });
    if (ok) {
      set({ state: next, current: nextStep(next, tagsForScreen(screen, selected)) });
    }
    return ok;
  },

  // ===== Actions (instant)
  applyAction: (payload) => {
    const { state } = get();
    let ok = false;

    const next = produce(state, (draft) => {
      const cost = Math.max(0, Math.round(payload.cost));
      if ((draft.stats.wealth ?? 0) < cost) return; // insufficient funds

      // Pay cost
      draft.stats.wealth = Math.max(0, Math.round(draft.stats.wealth - cost));

      // Apply stat deltas; clamp 0..100 for all but wealth
      for (const [k, v] of Object.entries(payload.deltas || {})) {
        const key = k as StatKey;
        const delta = Number(v || 0);
        if (key === 'wealth') {
          draft.stats.wealth = Math.max(0, Math.round((draft.stats.wealth ?? 0) + delta));
        } else {
          const prev = draft.stats[key] ?? 0;
          draft.stats[key] = clamp01(prev + delta);
        }
      }

      syncWorldFromGame(draft);
      syncGameFromWorld(draft);

      // history
      draft.history.push({
        day: draft.day,
        eventId: `action.${payload.id}`,
        choiceId: payload.label,
        delta: payload.deltas || {},
      });

      ok = true;
    });

    if (ok) set({ state: next });
    return ok;
  },

  // ===== Jobs operations (incl. progress meter)
  applyJob: (a) => {
    const { state } = get();
    let ok = false;

    const next = produce(state, (draft) => {
      if (a.kind === 'apply') {
        const def = JOBS[a.jobId];
        if (!def) return;

        const intellect = draft.stats.intellect ?? 0;
        if (def.minIntellect && intellect < def.minIntellect) return;

        const startingLevel = Math.min(def.maxLevel, Math.max(0, Math.round(a.level ?? 0)));

        draft.job = {
          id: def.id,
          level: startingLevel,
          daysWorked: 0,
          company: a.company ?? null,
          demand: typeof a.demand === 'number' ? a.demand : undefined,
          payMultiplier: typeof a.payMultiplier === 'number' ? a.payMultiplier : 1,
          progress: 0,
        };
        draft.history.push({
          day: draft.day,
          eventId: 'job.apply',
          choiceId: `${def.id}@${draft.job.company ?? 'unknown'}`,
          delta: {},
        });
        ok = true;

      } else if (a.kind === 'promote') {
        if (!draft.job) return;
        const def = JOBS[draft.job.id];
        const inc = Math.max(1, a.levels ?? 1);
        draft.job.level = Math.min(def.maxLevel, (draft.job.level ?? 0) + inc);
        draft.job.progress = 0;

        draft.history.push({
          day: draft.day,
          eventId: 'job.promote',
          choiceId: draft.job.id,
          delta: {},
        });
        ok = true;

      } else if (a.kind === 'quit') {
        if (!draft.job) return;
        const prevId = draft.job.id;
        draft.job = null;

        draft.history.push({
          day: draft.day,
          eventId: 'job.quit',
          choiceId: prevId,
          delta: {},
        });
        ok = true;

      } else if (a.kind === 'progress') {
        if (!draft.job) return;
        const def = JOBS[draft.job.id];
        const prev = Math.max(0, Math.round(draft.job.progress ?? 0));
        const inc = Math.round(a.delta);
        const now = clamp01(prev + inc);
        draft.job.progress = now;

        if (now >= 100) {
          const canPromote = draft.job.level < def.maxLevel;
          if (canPromote) {
            draft.job.level = Math.min(def.maxLevel, draft.job.level + 1);
          }
          const bonus = Math.max(1000, Math.round(salaryPerDay(draft.job) * 5));
          draft.stats.wealth = Math.max(0, Math.round((draft.stats.wealth ?? 0) + bonus));
          draft.stats.reputation = clamp01((draft.stats.reputation ?? 0) + (canPromote ? 3 : 1));
          draft.job.progress = 0;

          draft.history.push({
            day: draft.day,
            eventId: canPromote ? 'job.progress.promote' : 'job.progress.mastery',
            choiceId: draft.job.id,
            delta: { wealth: bonus, reputation: canPromote ? 3 : 1 },
          });
        }
        ok = true;
      }

      if (ok) {
        syncWorldFromGame(draft);
        syncGameFromWorld(draft);
      }
    });

    if (ok) set({ state: next });
    return ok;
  },

  // ===== Coworker relations (UI-layer persistence)
  relations: {},
  getOpinion: (key, fallback) => {
    const v = get().relations[key]?.opinion;
    return typeof v === 'number' ? v : fallback;
  },
  changeOpinion: (key, delta) => {
    let newVal = 0;
    set((s) => {
      const prev = s.relations[key]?.opinion ?? 0;
      newVal = Math.max(0, Math.min(100, Math.round(prev + delta)));
      s.relations = {
        ...s.relations,
        [key]: { opinion: newVal, relation: s.relations[key]?.relation ?? 'neutral' },
      };
      return s;
    });
    return newVal;
  },
  setRelation: (key, relation) => {
    set((s) => {
      const prev = s.relations[key]?.opinion ?? 0;
      s.relations = { ...s.relations, [key]: { opinion: prev, relation } };
      return s;
    });
  },

  /* =======================
     Businesses
     ======================= */
  businesses: {},

  createBusiness: (p) => {
    const { state } = get();
    let ok = false;
    if (!p.name.trim() || p.capital <= 0) return false;

    const next = produce(state, (draft) => {
      if ((draft.stats.wealth ?? 0) < p.capital) return;

      const { baseRevPerDay, baseCostPerDay } = industryDefaults(p.industry);
      const day = draft.day;
      const id = `biz_${Math.random().toString(36).slice(2, 9)}`;

      // pay capital
      draft.stats.wealth = Math.max(0, (draft.stats.wealth ?? 0) - p.capital);

      // history
      draft.history.push({
        day,
        eventId: 'business.create',
        choiceId: `${id}:${p.industry}`,
        delta: { wealth: -p.capital },
      });

      ok = true;

      // create UI-layer business record
      set((s) => {
        const r = seededRandom(`biz:init:${state.seed}:${id}:${day}`);
        const demand0 = 35 + Math.floor(r() * 30);   // 35..64
        const quality0 = 30 + Math.floor(r() * 35);  // 30..64
        const marketing0 = 10 + Math.floor(r() * 20);// 10..29
        s.businesses[id] = {
          id,
          name: p.name.trim(),
          industry: p.industry,
          foundedDay: day,
          capital: p.capital,
          cash: Math.round(p.capital * 0.2), // some runway
          demand: demand0,
          quality: quality0,
          marketing: marketing0,
          staff: 2,
          branches: 1,
          baseRevPerDay,
          baseCostPerDay,
          lastSimDay: day,
          alive: true,
        };
        return s;
      });
    });

    if (ok) set({ state: next });
    return ok;
  },

  simulateBusinesses: () => {
    const { state, businesses } = get();
    const day = state.day;

    const updated: Record<string, Business> = { ...businesses };
    let anyChange = false;

    for (const b of Object.values(updated)) {
      const days = day - b.lastSimDay;
      if (days > 0 && b.alive) {
        const { deltaCash } = simulateOne(b, days, state.seed);
        b.cash = Math.max(0, b.cash + deltaCash);
        b.lastSimDay = day;
        anyChange = true;
      }
    }
    if (anyChange) set({ businesses: updated });
  },

  bizInjectCapital: (id, amount) => {
    if (amount <= 0) return false;
    const { state, businesses } = get();
    const b = businesses[id];
    if (!b || !b.alive) return false;
    if ((state.stats.wealth ?? 0) < amount) return false;

    const next = produce(state, (draft) => {
      draft.stats.wealth = Math.max(0, (draft.stats.wealth ?? 0) - amount);
      draft.history.push({
        day: draft.day,
        eventId: 'business.inject',
        choiceId: id,
        delta: { wealth: -amount },
      });
    });

    set({
      state: next,
      businesses: {
        ...businesses,
        [id]: { ...b, capital: b.capital + amount, cash: b.cash + amount },
      },
    });
    return true;
  },

  bizWithdrawDividends: (id, amount) => {
    if (amount <= 0) return false;
    const { state, businesses } = get();
    const b = businesses[id];
    if (!b || !b.alive) return false;
    if (b.cash < amount) return false;

    const next = produce(state, (draft) => {
      draft.stats.wealth = Math.max(0, (draft.stats.wealth ?? 0) + amount);
      draft.history.push({
        day: draft.day,
        eventId: 'business.dividend',
        choiceId: id,
        delta: { wealth: +amount },
      });
    });

    set({
      state: next,
      businesses: {
        ...businesses,
        [id]: { ...b, cash: b.cash - amount },
      },
    });
    return true;
  },

  bizHire: (id, count) => {
    if (!Number.isFinite(count) || count === 0) return false;
    const { businesses } = get();
    const b = businesses[id];
    if (!b || !b.alive) return false;

    const target = Math.max(0, b.staff + count);
    set({ businesses: { ...businesses, [id]: { ...b, staff: target } } });
    return true;
  },

  bizInvestMarketing: (id, naira) => {
    if (naira <= 0) return false;
    const { state, businesses } = get();
    const b = businesses[id];
    if (!b || !b.alive) return false;
    if ((state.stats.wealth ?? 0) < naira) return false;

    const points = Math.max(1, Math.round(naira / 20000)); // ₦20k ≈ +1 pt
    const next = produce(state, (draft) => {
      draft.stats.wealth = Math.max(0, (draft.stats.wealth ?? 0) - naira);
      draft.history.push({
        day: draft.day,
        eventId: 'business.marketing',
        choiceId: id,
        delta: { wealth: -naira },
      });
    });
    set({
      state: next,
      businesses: { ...businesses, [id]: { ...b, marketing: clamp100(b.marketing + points) } },
    });
    return true;
  },

  bizInvestRnD: (id, naira) => {
    if (naira <= 0) return false;
    const { state, businesses } = get();
    const b = businesses[id];
    if (!b || !b.alive) return false;
    if ((state.stats.wealth ?? 0) < naira) return false;

    const points = Math.max(1, Math.round(naira / 30000)); // ₦30k ≈ +1 pt
    const next = produce(state, (draft) => {
      draft.stats.wealth = Math.max(0, (draft.stats.wealth ?? 0) - naira);
      draft.history.push({
        day: draft.day,
        eventId: 'business.rnd',
        choiceId: id,
        delta: { wealth: -naira },
      });
    });
    set({
      state: next,
      businesses: { ...businesses, [id]: { ...b, quality: clamp100(b.quality + points) } },
    });
    return true;
  },

  bizOpenBranch: (id) => {
    const { businesses } = get();
    const b = businesses[id];
    if (!b || !b.alive) return false;
    // simple: opening a branch increases branches by 1 and base costs slightly
    const newBranches = b.branches + 1;
    const newCost = Math.round(b.baseCostPerDay * 1.12);
    set({
      businesses: { ...businesses, [id]: { ...b, branches: newBranches, baseCostPerDay: newCost } },
    });
    return true;
  },

  // ===== Save/Load (GameState only for now)
  save: async () => { await saveGame('slot1', get().state); },

  load: async () => {
    const data = await loadGame<GameState>('slot1');
    if (data) {
      const s = normalizeLoadedState(data);
      set({ state: s, current: nextStep(s), selected: null, screen: 'dashboard' });
    }
  },
}));

export default useGame;
export type { RelationKind, RelationState };
