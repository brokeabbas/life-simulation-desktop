// src/game/ui/jobs/coworkers.ts
import { seededRandom } from '../../rng';

export type Employee = {
  id: string;
  name: string;
  title: string;
  department: string;
  age: number;
  tenure: number;     // years
  influence: number;  // 0..100
  rank: number;       // sort weight; CEO = 100
  opinion0: number;   // 👈 baseline opinion of player (0..100)
};

const FIRST = [
  'Ada','Chinedu','Ibrahim','Yemi','Aisha','Ngozi','Hassan','Chioma','Tunde','Amaka',
  'Uche','Seyi','Femi','Hadiza','Ife','Bola','Kachi','Zainab','Emeka','Kehinde',
  'Kelechi','Umar','Salma','Gbenga','Tope','Seun','Halima','Tomiwa','Obi','Kola'
];
const LAST = [
  'Okafor','Balogun','Abdullahi','Adebayo','Mohammed','Eze','Adewale','Danladi','Ogunleye','Bassey',
  'Okeke','Fashola','Olaoye','Oyetola','Nwosu','Owolabi','Onwuka','Usman','Ogunbiyi','Ogundipe',
  'Ekanem','Bello','Chukwu','Okorie','Idowu','Hassan','Lawal','Ojo','Yusuf','Akintola'
];

const DEPTS = [
  'Engineering','Product','Data','Finance','Marketing','Sales',
  'HR','Operations','Design','Legal','Security','Support'
];

const TITLE_LADDER = [
  { title: 'Intern', rank: 20 },
  { title: 'Junior', rank: 30 },
  { title: 'Associate', rank: 40 },
  { title: 'Senior', rank: 50 },
  { title: 'Manager', rank: 60 },
  { title: 'Senior Manager', rank: 70 },
  { title: 'Head of', rank: 80 },
  { title: 'Director', rank: 85 },
  { title: 'VP', rank: 88 },
  { title: 'C-Level', rank: 90 },
];

export function generateCoworkers(seed: string, companyName: string): Employee[] {
  const rnd = seededRandom(`cw:${seed}:${companyName}`);
  const N = 22 + Math.floor(rnd() * 26); // 22..47 + CEO => 23..48 total
  const list: Employee[] = [];

  // CEO
  const ceo: Employee = {
    id: 'ceo',
    name: pickName(rnd),
    title: 'Chief Executive Officer',
    department: 'Executive',
    age: 45 + Math.floor(rnd() * 20),
    tenure: 3 + Math.floor(rnd() * 10),
    influence: 100,
    rank: 100,
    opinion0: 40 + Math.floor(rnd() * 21), // 40..60
  };
  list.push(ceo);

  for (let i = 0; i < N; i++) {
    const dept = pick(DEPTS, rnd);
    const ladder = pick(TITLE_LADDER, rnd);
    const isHead = ladder.rank >= 80 && rnd() > 0.5;
    const title = ladder.title === 'Head of'
      ? `Head of ${dept}`
      : ladder.title === 'C-Level'
        ? cTitleFor(dept, rnd)
        : ladder.title === 'Junior' || ladder.title === 'Senior'
          ? `${ladder.title} ${dept === 'Engineering' ? 'Engineer' : dept === 'Data' ? 'Analyst' : dept === 'Design' ? 'Designer' : dept === 'Security' ? 'Analyst' : dept.slice(0, -1)}`
          : ladder.title;

    const age = 21 + Math.floor(rnd() * 38);
    const tenure = Math.max(0, Math.min(age - 18, Math.floor(rnd() * 8)));
    const influenceBase = ladder.rank + (isHead ? 6 : 0) + Math.floor(rnd() * 10) - 5;
    const influence = clamp01(Math.round(influenceBase));
    // baseline opinion: influenced by your “seeded charm” vs their influence
    const opinion0 = clamp01(Math.round(35 + (rnd() * 30) + (influence - 50) * 0.08)); // ~20..80

    list.push({
      id: `e${i + 1}`,
      name: pickName(rnd),
      title,
      department: dept,
      age,
      tenure,
      influence,
      rank: ladder.rank,
      opinion0,
    });
  }

  list.sort((a, b) => (b.rank - a.rank) || (b.influence - a.influence) || a.name.localeCompare(b.name));
  return list;
}

/* helpers */
function pick<T>(arr: T[], rnd: () => number): T { return arr[Math.floor(rnd() * arr.length)]; }
function pickName(rnd: () => number) { return `${pick(FIRST, rnd)} ${pick(LAST, rnd)}`; }
function clamp01(n: number) { return Math.max(0, Math.min(100, n)); }
function cTitleFor(dept: string, rnd: () => number) {
  switch (dept) {
    case 'Engineering': return 'Chief Technology Officer';
    case 'Product': return 'Chief Product Officer';
    case 'Data': return 'Chief Data Officer';
    case 'Finance': return 'Chief Financial Officer';
    case 'Marketing': return 'Chief Marketing Officer';
    case 'Sales': return 'Chief Revenue Officer';
    case 'HR': return 'Chief People Officer';
    case 'Operations': return 'Chief Operating Officer';
    case 'Design': return 'Chief Design Officer';
    case 'Security': return 'Chief Security Officer';
    case 'Legal': return 'General Counsel';
    default: return rnd() > 0.5 ? 'Chief Strategy Officer' : 'Chief Growth Officer';
  }
}
