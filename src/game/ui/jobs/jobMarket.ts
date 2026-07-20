import type { GameState } from '../../types';
import { JOBS } from '../../engine';
import { seededRandom } from '../../rng';

export type Company = { id: string; name: string };
export type JobListing = {
  companyId: string;
  companyName: string;
  jobId: string;
  demand: number;        // 0..100 (drives pay & reqs)
  payMultiplier: number; // ~0.8..1.4 based on demand
  iqDelta: number;       // adjusts min intellect (+ harder when low demand)
  statDelta: number;     // adjusts per-level stat mins
};

export type JobMarket = {
  day: number;
  companies: Company[];
  listings: JobListing[];
  byJob: Record<string, JobListing[]>;
};

const COMPANY_NAMES = [
  'Interswitch', 'Flutterwave', 'Palmpay', 'NaijaTel', 'Zenith Bank', 'GTBank',
  'Konga', 'Jumia', 'Andela', 'PiggyVest', 'Cowrywise', 'Sterling Bank',
  'Carbon', 'Opay', 'Ikeja Electric', 'MTN Nigeria', 'Airtel NG', 'Globacom',
  'BUA Group', 'Dangote Group', 'Nigerian Breweries', 'Seplat Energy',
  'Ardova', 'FarmCrowdy'
];

const LEGACY = new Set(['junior_dev', 'barista']);

export function generateJobMarket(state: GameState): JobMarket {
  const rand = seededRandom(`${state.seed}:market:${state.day}`);
  // companies 1..18
  const nCompanies = clampInt(1 + Math.floor(rand() * 18), 1, 18);
  const names = pickMany(COMPANY_NAMES, nCompanies, rand).map((name, i) => ({
    id: `co${i + 1}`,
    name,
  }));

  // modern jobs only
  const modernJobs = Object.values(JOBS).filter(j => !LEGACY.has(j.id));

  const listings: JobListing[] = [];
  for (const co of names) {
    // each company hires 1..5 roles today
    const rolesCount = 1 + Math.floor(rand() * 5);
    const roles = pickMany(modernJobs, rolesCount, rand);
    for (const role of roles) {
      const demand = Math.round(rand() * 100);           // 0..100
      const payMultiplier = round2(0.8 + demand * 0.006); // 0.8..1.4
      // demand effect on requirements: low demand => harder; high demand => easier
      const iqDelta = Math.round((50 - demand) * 0.2);   // -10..+10 typical
      const statDelta = Math.round((50 - demand) * 0.1); // -5..+5 typical
      listings.push({
        companyId: co.id,
        companyName: co.name,
        jobId: role.id,
        demand,
        payMultiplier,
        iqDelta,
        statDelta,
      });
    }
  }

  const byJob: Record<string, JobListing[]> = {};
  for (const l of listings) {
    (byJob[l.jobId] ||= []).push(l);
  }

  // Sort companies by name and listings by demand desc (nicer UX)
  names.sort((a, b) => a.name.localeCompare(b.name));
  for (const k of Object.keys(byJob)) {
    byJob[k].sort((a, b) => b.demand - a.demand);
  }

  return { day: state.day, companies: names, listings, byJob };
}

function pickMany<T>(arr: T[], n: number, rand: () => number): T[] {
  const copy = arr.slice();
  const out: T[] = [];
  while (copy.length && out.length < n) {
    const i = Math.floor(rand() * copy.length);
    out.push(copy.splice(i, 1)[0]);
  }
  return out;
}

function clampInt(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, Math.round(n)));
}
function round2(n: number) { return Math.round(n * 100) / 100; }
