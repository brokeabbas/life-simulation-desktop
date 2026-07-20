// src/game/engine.ts
import { produce } from 'immer';
import { eventsSchema } from './events.schema';
import sample from './events.sample.json';
import type {
  Choice,
  Condition,
  Effect,
  Gender,
  GameEvent,
  GameState,
  LifePhase,
  JobState,
} from './types';
import { DEFAULT_STATS } from './types';
import { seededRandom, pickWeighted } from './rng';
import { newWorld } from './world/generation';
import { ageInDays, formatSimDate } from './world/date';
import { getActivePerson } from './world/selectors';
import { advanceWorldDays } from './simulation/simulation';

// ===== Jobs Catalog =====
type JobDef = {
  id: string;
  title: string;        // Career field / track
  basePerDay: number;   // pay at level 0
  perLevel: number;     // increment per level
  maxLevel: number;     // 0..4 (Intern..Lead)
  minIntellect?: number;
};

export const JOBS: Record<string, JobDef> = {
  // Degree (B.Sc.) tracks
  software_engineer:      { id: 'software_engineer',      title: 'Software Engineer',       basePerDay: 120, perLevel: 60, maxLevel: 4, minIntellect: 50 },
  data_analyst:           { id: 'data_analyst',           title: 'Data Analyst',            basePerDay:  90, perLevel: 45, maxLevel: 4, minIntellect: 45 },
  product_manager:        { id: 'product_manager',        title: 'Product Manager',         basePerDay: 110, perLevel: 55, maxLevel: 4, minIntellect: 55 },
  finance_analyst:        { id: 'finance_analyst',        title: 'Finance Analyst',         basePerDay: 100, perLevel: 50, maxLevel: 4, minIntellect: 50 },
  marketing_specialist:   { id: 'marketing_specialist',   title: 'Marketing Specialist',    basePerDay:  80, perLevel: 40, maxLevel: 4, minIntellect: 40 },
  sales_executive:        { id: 'sales_executive',        title: 'Sales Executive',         basePerDay:  70, perLevel: 35, maxLevel: 4, minIntellect: 35 },
  civil_engineer:         { id: 'civil_engineer',         title: 'Civil Engineer',          basePerDay:  95, perLevel: 48, maxLevel: 4, minIntellect: 50 },
  mechanical_engineer:    { id: 'mechanical_engineer',    title: 'Mechanical Engineer',     basePerDay:  95, perLevel: 48, maxLevel: 4, minIntellect: 50 },
  electrical_engineer:    { id: 'electrical_engineer',    title: 'Electrical Engineer',     basePerDay:  95, perLevel: 48, maxLevel: 4, minIntellect: 50 },
  ux_designer:            { id: 'ux_designer',            title: 'UX Designer',             basePerDay:  90, perLevel: 45, maxLevel: 4, minIntellect: 45 },

  // +10 NEW tracks
  network_engineer:       { id: 'network_engineer',       title: 'Network Engineer',        basePerDay: 100, perLevel: 50, maxLevel: 4, minIntellect: 48 },
  cybersecurity_analyst:  { id: 'cybersecurity_analyst',  title: 'Cybersecurity Analyst',   basePerDay: 110, perLevel: 55, maxLevel: 4, minIntellect: 55 },
  business_analyst:       { id: 'business_analyst',       title: 'Business Analyst',        basePerDay:  95, perLevel: 47, maxLevel: 4, minIntellect: 48 },
  hr_specialist:          { id: 'hr_specialist',          title: 'HR Specialist',           basePerDay:  85, perLevel: 42, maxLevel: 4, minIntellect: 40 },
  operations_analyst:     { id: 'operations_analyst',     title: 'Operations Analyst',      basePerDay:  92, perLevel: 46, maxLevel: 4, minIntellect: 45 },
  supply_chain_analyst:   { id: 'supply_chain_analyst',   title: 'Supply Chain Analyst',    basePerDay:  96, perLevel: 48, maxLevel: 4, minIntellect: 48 },
  biomedical_engineer:    { id: 'biomedical_engineer',    title: 'Biomedical Engineer',     basePerDay: 100, perLevel: 50, maxLevel: 4, minIntellect: 52 },
  environmental_scientist:{ id: 'environmental_scientist',title: 'Environmental Scientist', basePerDay:  90, perLevel: 45, maxLevel: 4, minIntellect: 47 },
  accountant:             { id: 'accountant',             title: 'Accountant',              basePerDay:  95, perLevel: 48, maxLevel: 4, minIntellect: 50 },
  economist:              { id: 'economist',              title: 'Economist',               basePerDay: 105, perLevel: 52, maxLevel: 4, minIntellect: 55 },

  // Legacy simple jobs (for old events, optional)
  junior_dev:             { id: 'junior_dev',             title: 'Junior Developer',        basePerDay:  50, perLevel: 15, maxLevel: 3, minIntellect: 40 },
  barista:                { id: 'barista',                title: 'Barista',                 basePerDay:  35, perLevel:  8, maxLevel: 2 },
};

export function salaryPerDay(job: JobState): number {
  if (!job) return 0;
  const def = JOBS[job.id];
  if (!def) return 0;
  const base = def.basePerDay + def.perLevel * Math.max(0, job.level);
  const mul = typeof (job as any).payMultiplier === 'number' ? (job as any).payMultiplier : 1;
  return Math.max(0, Math.round(base * mul));
}

// ===== Events Load & Validation =====
export const EVENTS: GameEvent[] = (() => {
  try {
    const raw = eventsSchema.parse(sample);
    // keep UI balanced; remove the generic daily event if present
    return raw.filter((e) => e.id !== 'life.start');
  } catch (e) {
    console.error('Events validation failed:', e);
    return [];
  }
})();

// ===== Helpers =====
export function toISODate(day: number) {
  const start = new Date('2000-01-01T00:00:00Z');
  const d = new Date(start.getTime() + day * 86400000);
  return d.toISOString().slice(0, 10);
}

export function phaseForDay(day: number): LifePhase {
  const years = Math.floor(day / 365);
  if (years < 13) return 'child';
  if (years < 18) return 'teen';
  if (years < 65) return 'adult';
  return 'retired';
}

export function evalCondition(c: Condition, s: GameState): boolean {
  switch (c.kind) {
    case 'ageAtLeast': return s.day >= c.days;
    case 'ageAtMost': return s.day <= c.days;
    case 'statAtLeast': return s.stats[c.stat] >= c.value;
    case 'statAtMost': return s.stats[c.stat] <= c.value;
    case 'hasTrait': return s.traits.includes(c.trait);
    case 'notTrait': return !s.traits.includes(c.trait);
    case 'hasFlag': return !!(s.flags[c.flag]);
    case 'notFlag': return !s.flags[c.flag];
    case 'phaseIs': return phaseForDay(s.day) === c.phase;
    case 'hasJob': return !!s.job;
    case 'notJob': return !s.job;
    case 'jobLevelAtLeast': return !!s.job && s.job.level >= c.level;
    case 'daysWorkedAtLeast': return !!s.job && s.job.daysWorked >= c.days;
  }
}

export function eligible(event: GameEvent, s: GameState): boolean {
  if (event.once && s.seen[event.id]) return false;
  const cd = s.cooldowns[event.id];
  if (typeof cd === 'number' && s.day < cd) return false;
  return (event.when ?? []).every((c) => evalCondition(c, s));
}

function applyEffect(e: Effect, draft: GameState) {
  switch (e.kind) {
    case 'deltaStat':
      draft.stats[e.stat] = Math.max(0, draft.stats[e.stat] + e.delta);
      break;
    case 'setStat':
      draft.stats[e.stat] = e.value;
      break;
    case 'addTrait':
      if (!draft.traits.includes(e.trait)) draft.traits.push(e.trait);
      break;
    case 'removeTrait':
      draft.traits = draft.traits.filter((t) => t !== e.trait);
      break;
    case 'setFlag':
      draft.flags[e.flag] = e.value;
      break;
    case 'advanceDays':
      advanceWorldDays(draft.world, e.days);
      syncGameFromWorld(draft);
      break;
    case 'giveMoney':
      draft.stats.wealth = Math.max(0, draft.stats.wealth + e.amount);
      break;
      case 'setJob': {
        const def = JOBS[e.jobId];
        if (def) {
          draft.job = {
            id: def.id,
            level: Math.min(e.level ?? 0, def.maxLevel),
            daysWorked: 0,
            company: null,
            demand: undefined,
            payMultiplier: 1,
          };
        }
        break;
    }
    case 'promoteJob': {
      if (draft.job) {
        const def = JOBS[draft.job.id];
        const inc = Math.max(1, e.levels ?? 1);
        draft.job.level = Math.min(def.maxLevel, draft.job.level + inc);
      }
      break;
    }
    case 'fireJob':
      draft.job = null;
      break;
  }
}

function dailyTick(draft: GameState) {
  if (draft.job) {
    const pay = salaryPerDay(draft.job);
    draft.stats.wealth = Math.max(0, draft.stats.wealth + pay);
    draft.job.daysWorked += 1;
  }
}

export function syncGameFromWorld(draft: GameState) {
  const active = getActivePerson(draft.world);
  if (!active) return;
  draft.gender = active.gender;
  draft.day = ageInDays(active.birthDate, draft.world.currentDate);
  draft.dateISO = formatSimDate(draft.world.currentDate);
  draft.stats = { ...active.stats };
  draft.traits = [...active.traits];
}

export function syncWorldFromGame(draft: GameState) {
  const active = getActivePerson(draft.world);
  if (!active) return;
  active.stats = { ...draft.stats };
  active.traits = [...draft.traits];
  active.health = draft.stats.health;
  active.wealth = draft.stats.wealth;
  active.reputation = draft.stats.reputation;
}

// ===== State lifecycle =====
export function newGame(seed = 'yakubu', gender: Gender = 'female'): GameState {
  const world = newWorld(seed, gender);
  const active = getActivePerson(world);
  return {
    seed,
    gender,
    world,
    day: active ? ageInDays(active.birthDate, world.currentDate) : 0,
    dateISO: formatSimDate(world.currentDate),
    stats: active ? { ...active.stats } : { ...DEFAULT_STATS },
    star: 0,
    traits: active ? [...active.traits] : ['hardworking'],
    flags: {},
    cooldowns: {},
    seen: {},
    history: [],
    job: null,
  };
}

export type StepResult =
  | { event: GameEvent; choices: Choice[] }
  | { event: null; choices: [] };

export function nextStep(state: GameState, tags?: string[]): StepResult {
  const rand = seededRandom(state.seed + ':' + state.day);
  let pool = EVENTS.filter((e) => eligible(e, state));
  if (tags && tags.length) {
    const tagSet = new Set(tags.map((t) => t.toLowerCase()));
    pool = pool.filter((e) => (e.tags ?? []).some((t) => tagSet.has(t.toLowerCase())));
  }
  if (!pool.length) return { event: null, choices: [] };

  const event = pickWeighted(pool.map((e) => ({ item: e, weight: e.weight })), rand)!;
  const choices = (event.choices || []).filter((c) => (c.conditions ?? []).every((cc) => evalCondition(cc, state)));
  return { event, choices };
}

export function choose(state: GameState, event: GameEvent, choice: Choice): GameState {
  const after = produce(state, (draft) => {
    for (const eff of choice.effects || []) applyEffect(eff, draft);
    if (event.cooldownDays) draft.cooldowns[event.id] = draft.day + event.cooldownDays;
    if (event.once) draft.seen[event.id] = true;

    if (draft.day === state.day) {
      advanceWorldDays(draft.world, 1);
    }
    dailyTick(draft);
    syncWorldFromGame(draft);
    syncGameFromWorld(draft);
    draft.history.push({ day: draft.day, eventId: event.id, choiceId: choice.id, delta: {} });
  });
  return after;
}

export function advanceDay(state: GameState): GameState {
  return produce(state, (draft) => {
    advanceWorldDays(draft.world, 1);
    dailyTick(draft);
    syncWorldFromGame(draft);
    syncGameFromWorld(draft);
    draft.history.push({ day: draft.day, eventId: 'advance.day', choiceId: 'advance', delta: {} });
  });
}
