// src/game/ui/business/businessStore.ts
import { create } from 'zustand';

export type Stage = 'idea'|'mvp'|'launched'|'growing'|'profitable'|'ipo'|'acquired';
export type IndustryId = 'saas'|'fintech'|'ecommerce'|'logistics'|'healthcare'|'energy'|'agriculture'|'edtech'|'gaming'|'media';

export type Venture = {
  id: string;
  name: string;
  industry: IndustryId;
  stage: Stage;

  // ownership
  ownerEquity: number;  // 0..100 (player ownership)
  investorEquity: number; // 0..100 (raised)

  // finances
  cash: number;     // naira
  mrr: number;      // monthly recurring revenue (₦)
  burn: number;     // monthly operating expenses (₦)
  valuation: number;// post-money estimate (₦)
  growth: number;   // 0..100 -> progress to next stage

  // ops
  product: number;  // 0..100
  brand: number;    // 0..100
  ops: number;      // 0..100
  team: number;     // employee count (rounded)
  risk: number;     // 0..100 (higher = riskier)
  demand: number;   // 0..100 (market tailwind)
  createdAt: number;
  lastTickAt: number;
};

export type IndustryDef = {
  id: IndustryId;
  title: string;
  baseDemand: number;     // 0..100
  baseRisk: number;       // 0..100
  capexFactor: number;    // burn multiplier baseline
  revenueMultiple: number;// ARR valuation multiple
  regulation: number;     // 0..100 (slows stage progress, risk of events later)
};

export type BusinessState = {
  ventures: Venture[];
  month: number; // simple counter for local sim
  create: (v: Omit<Venture, 'id'|'createdAt'|'lastTickAt'|'investorEquity'>) => Venture;
  hydrateSample?: () => void; // optional helper
  investCash: (id: string, amount: number) => void;  // add venture cash
  spend: (id: string, amount: number) => boolean;    // spend venture cash
  hire: (id: string, count: number, salaryPerHead?: number) => void;
  market: (id: string, amount: number) => void;      // increase brand + demand
  improveProduct: (id: string, amount: number) => void; // increase product
  raiseRound: (id: string, equityPercent: number, preMoney: number) => void; // add cash, dilute owner
  payDividend: (id: string, amount: number) => boolean; // returns true if ok
  advanceMonth: () => void; // simulate month for all
  sellCompany: (id: string, price: number) => number; // returns payout to owner; removes venture
};

let _auto = 0;
function uid() { _auto = (_auto + 1) % 1e6; return `${Date.now().toString(36)}_${_auto.toString(36)}`; }
export const clamp01 = (n: number) => Math.max(0, Math.min(100, n));

export const STAGES: Stage[] = ['idea','mvp','launched','growing','profitable','ipo','acquired'];

export const INDUSTRIES: Record<IndustryId, IndustryDef> = {
  saas:       { id:'saas', title:'Tech — SaaS',        baseDemand: 62, baseRisk: 42, capexFactor: 0.9, revenueMultiple: 7.5, regulation: 20 },
  fintech:    { id:'fintech', title:'Fintech',         baseDemand: 66, baseRisk: 56, capexFactor: 1.0, revenueMultiple: 6.5, regulation: 55 },
  ecommerce:  { id:'ecommerce', title:'E-commerce',    baseDemand: 58, baseRisk: 48, capexFactor: 1.1, revenueMultiple: 3.2, regulation: 25 },
  logistics:  { id:'logistics', title:'Logistics',     baseDemand: 54, baseRisk: 46, capexFactor: 1.2, revenueMultiple: 3.8, regulation: 30 },
  healthcare: { id:'healthcare', title:'Healthcare',   baseDemand: 60, baseRisk: 40, capexFactor: 1.3, revenueMultiple: 4.5, regulation: 65 },
  energy:     { id:'energy', title:'Energy',           baseDemand: 52, baseRisk: 58, capexFactor: 1.4, revenueMultiple: 4.2, regulation: 70 },
  agriculture:{ id:'agriculture', title:'Agriculture', baseDemand: 55, baseRisk: 44, capexFactor: 1.1, revenueMultiple: 3.0, regulation: 35 },
  edtech:     { id:'edtech', title:'EdTech',           baseDemand: 48, baseRisk: 50, capexFactor: 0.8, revenueMultiple: 4.0, regulation: 20 },
  gaming:     { id:'gaming', title:'Gaming',           baseDemand: 64, baseRisk: 62, capexFactor: 0.9, revenueMultiple: 4.8, regulation: 10 },
  media:      { id:'media', title:'Media',             baseDemand: 50, baseRisk: 52, capexFactor: 0.8, revenueMultiple: 2.8, regulation: 25 },
};

// --- core monthly sim helpers ---
function stageProgressCoef(v: Venture, ind: IndustryDef) {
  // demand & quality drive progress; regulation slows it down a bit
  const quality = (v.product * 0.6 + v.ops * 0.2 + v.brand * 0.2);
  const regDrag = 1 - ind.regulation / 300; // 0.67..1
  return (quality / 100) * (v.demand / 100) * regDrag;
}
function arrFromMRR(mrr: number) { return mrr * 12; }

function nextStage(s: Stage): Stage {
  const i = STAGES.indexOf(s);
  return STAGES[Math.min(i + 1, STAGES.length - 1)];
}

function recomputeValuation(v: Venture, ind: IndustryDef): number {
  const arr = arrFromMRR(v.mrr);
  // crude: multiple on ARR, plus some premium for growth & brand
  const growthPremium = 1 + (v.growth / 200);
  const brandPremium = 1 + (v.brand / 250);
  const multiple = ind.revenueMultiple * growthPremium * brandPremium;
  return Math.max(0, Math.round(arr * multiple));
}

export const useBusiness = create<BusinessState>((set, get) => ({
  ventures: [],
  month: 0,

  create: (v) => {
    const now = Date.now();
    const ind = INDUSTRIES[v.industry];
    const m: Venture = {
      id: uid(),
      name: v.name,
      industry: v.industry,
      stage: v.stage,
      ownerEquity: Math.max(0, Math.min(100, v.ownerEquity)),
      investorEquity: 100 - Math.max(0, Math.min(100, v.ownerEquity)),
      cash: v.cash,
      mrr: v.mrr,
      burn: Math.max(0, v.burn * ind.capexFactor),
      valuation: v.valuation,
      growth: v.growth,
      product: v.product,
      brand: v.brand,
      ops: v.ops,
      team: Math.round(v.team),
      risk: v.risk,
      demand: v.demand,
      createdAt: now,
      lastTickAt: now,
    };
    set(s => ({ ventures: [m, ...s.ventures] }));
    return m;
  },

  hydrateSample: () => {
    const s = get();
    if (s.ventures.length) return;
    s.create({
      name: 'Bluewave Cloud',
      industry: 'saas',
      stage: 'mvp',
      ownerEquity: 100,
      cash: 2_500_000,
      mrr: 120_000,
      burn: 300_000,
      valuation: 0,
      growth: 22,
      product: 48,
      brand: 30,
      ops: 40,
      team: 6,
      risk: 38,
      demand: INDUSTRIES['saas'].baseDemand,
    });
  },

  investCash: (id, amount) => {
    set(s => ({
      ventures: s.ventures.map(v => v.id === id ? { ...v, cash: Math.max(0, v.cash + amount) } : v)
    }));
  },

  spend: (id, amount) => {
    let ok = false;
    set(s => {
      const ventures = s.ventures.map(v => {
        if (v.id !== id) return v;
        if (v.cash < amount) return v;
        ok = true;
        return { ...v, cash: Math.round(v.cash - amount) };
      });
      return { ...s, ventures };
    });
    return ok;
  },

  hire: (id, count, salaryPerHead = 250000) => {
    set(s => ({
      ventures: s.ventures.map(v => v.id === id ? {
        ...v,
        team: Math.max(0, Math.round(v.team + count)),
        burn: Math.max(0, Math.round(v.burn + count * salaryPerHead)),
        ops: clamp01(v.ops + count * 0.8),
      } : v)
    }));
  },

  market: (id, amount) => {
    set(s => ({
      ventures: s.ventures.map(v => v.id === id ? {
        ...v,
        brand: clamp01(v.brand + Math.sqrt(amount) * 0.6),
        demand: clamp01(v.demand + Math.sqrt(amount) * 0.4),
      } : v)
    }));
  },

  improveProduct: (id, amount) => {
    set(s => ({
      ventures: s.ventures.map(v => v.id === id ? {
        ...v,
        product: clamp01(v.product + Math.sqrt(amount) * 0.8),
        ops: clamp01(v.ops + Math.sqrt(amount) * 0.3),
      } : v)
    }));
  },

  raiseRound: (id, equityPercent, preMoney) => {
    set(s => ({
      ventures: s.ventures.map(v => {
        if (v.id !== id) return v;
        const sold = Math.max(0, Math.min(100 - v.investorEquity, equityPercent));
        const post = preMoney / (1 - sold / 100); // post-money
        const cashIn = Math.round(post - preMoney);
        const newOwner = Math.max(0, v.ownerEquity - sold);
        const newInvestor = Math.min(100, v.investorEquity + sold);
        return {
          ...v,
          ownerEquity: newOwner,
          investorEquity: newInvestor,
          cash: v.cash + cashIn,
          valuation: Math.round(post),
        };
      })
    }));
  },

  payDividend: (id, amount) => {
    let ok = false;
    set(s => {
      const ventures = s.ventures.map(v => {
        if (v.id !== id) return v;
        if (v.cash < amount) return v;
        ok = true;
        return { ...v, cash: Math.round(v.cash - amount) };
      });
      return { ...s, ventures };
    });
    return ok;
  },

  advanceMonth: () => {
    set(s => {
      const ventures = s.ventures.map(v => {
        const ind = INDUSTRIES[v.industry];
        // revenue growth driven by brand/product/demand
        const growthRate = (v.product * 0.40 + v.brand * 0.30 + v.ops * 0.10 + v.demand * 0.20) / 1000; // ~0..1
        const riskDrag = 1 - v.risk / 200; // 0.5..1
        const mrrGain = Math.max(0, Math.round(v.mrr * (growthRate * riskDrag))) + Math.round(v.brand * 100);
        const newMRR = Math.max(0, v.mrr + mrrGain);

        // cash delta: revenue – burn – small randomness by risk
        const revenue = newMRR;
        const riskNoise = Math.round((Math.random() - 0.5) * v.risk * 1000 * 0.02);
        const cashDelta = revenue - v.burn + riskNoise;
        const newCash = Math.max(0, v.cash + cashDelta);

        // progress & potential stage up
        const prog = v.growth + stageProgressCoef(v, ind) * 18; // month has bigger step
        let newStage = v.stage;
        let newGrowth = prog;
        if (prog >= 100 && v.stage !== 'ipo' && v.stage !== 'acquired') {
          newStage = nextStage(v.stage);
          newGrowth = Math.max(0, prog - 100);
        }

        const newVal = recomputeValuation({ ...v, mrr: newMRR, growth: newGrowth, cash: newCash, stage: newStage }, ind);

        return {
          ...v,
          mrr: newMRR,
          cash: newCash,
          growth: Math.min(100, Math.round(newGrowth)),
          stage: newStage,
          valuation: newVal,
          lastTickAt: Date.now(),
        };
      });
      return { month: s.month + 1, ventures };
    });
  },

  sellCompany: (id, price) => {
    let payout = 0;
    set(s => {
      const v = s.ventures.find(x => x.id === id);
      if (!v) return s;
      payout = Math.max(0, Math.round(price * (v.ownerEquity / 100)));
      return { ventures: s.ventures.filter(x => x.id !== id) };
    });
    return payout;
  },
}));
