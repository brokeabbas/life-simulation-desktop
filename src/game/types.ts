// src/game/types.ts
import type { WorldState } from './world/types';

// ===== Stats =====
// Core 5 + 20 additional life-driving stats
export const STAT_KEYS = [
  'health',
  'happiness',
  'intellect',
  'wealth',
  'reputation',
  'charisma',
  'fitness',
  'sexAppeal',
  'luck',
  'discipline',
  'empathy',
  'creativity',
  'confidence',
  'hygiene',
  'social',
  'stress',
  'energy',
  'morality',
  'ambition',
  'wisdom',
  'cooking',
  'streetSmarts',
  'communication',
  'resilience',
  'financialLiteracy',
  'academicAbility',
  'workEthic',
  'emotionalStability',
  'physicalFitness',
  'socialStatus',
  'patience',
  'practicalSkill',
  'mentalHealth',
  'familyBond',
  'schoolGrades',
] as const;

export type StatKey = (typeof STAT_KEYS)[number];

export type StatBlock = Record<StatKey, number>;

export const DEFAULT_STATS: StatBlock = {
  // core
  health: 60,
  happiness: 60,
  intellect: 50,
  wealth: 1000,
  reputation: 50,

  // extra
  charisma: 50,
  fitness: 45,
  sexAppeal: 50,
  luck: 50,
  discipline: 50,
  empathy: 50,
  creativity: 50,
  confidence: 50,
  hygiene: 60,
  social: 50,
  stress: 20,
  energy: 70,
  morality: 60,
  ambition: 55,
  wisdom: 45,
  cooking: 40,
  streetSmarts: 45,
  communication: 50,
  resilience: 50,
  financialLiteracy: 40,
  academicAbility: 48,
  workEthic: 50,
  emotionalStability: 52,
  physicalFitness: 45,
  socialStatus: 40,
  patience: 50,
  practicalSkill: 40,
  mentalHealth: 55,
  familyBond: 50,
  schoolGrades: 45,
};

// ===== Grouping (for UI) =====
export type StatGroupId =
  | 'core'
  | 'professional'
  | 'relationship'
  | 'personal'
  | 'skills'
  | 'mind';

export const GROUP_CAPACITY: Record<StatGroupId, number> = {
  core: 30,
  professional: 30,
  relationship: 30,
  personal: 30,
  skills: 30,
  mind: 30,
};

// Implemented keys used by logic (effects/conditions). Keep these as real StatKeys.
export const CORE_STAT_KEYS: StatKey[] = [
  'health',
  'happiness',
  'intellect',
  'wealth',
  'reputation',
];

export const PROFESSIONAL_STAT_KEYS: StatKey[] = [
  'discipline',
  'workEthic',
  'ambition',
  'communication',
  'financialLiteracy',
  'confidence',
  'practicalSkill',
];

export const RELATIONSHIP_STAT_KEYS: StatKey[] = [
  'charisma',
  'empathy',
  'social',
  'socialStatus',
  'sexAppeal',
  'familyBond',
];

export const PERSONAL_STAT_KEYS: StatKey[] = [
  'hygiene',
  'fitness',
  'physicalFitness',
  'stress',
  'energy',
  'morality',
  'luck',
  'emotionalStability',
  'mentalHealth',
  'patience',
];

export const SKILLS_STAT_KEYS: StatKey[] = [
  'cooking',
  'streetSmarts',
  'creativity',
];

export const MIND_STAT_KEYS: StatKey[] = [
  'academicAbility',
  'schoolGrades',
  'wisdom',
  'resilience',
];

export const STAT_GROUPS: Record<StatGroupId, StatKey[]> = {
  core: CORE_STAT_KEYS,
  professional: PROFESSIONAL_STAT_KEYS,
  relationship: RELATIONSHIP_STAT_KEYS,
  personal: PERSONAL_STAT_KEYS,
  skills: SKILLS_STAT_KEYS,
  mind: MIND_STAT_KEYS,
};

/**
 * Display labels for UI: each group has 30 labels.
 * The first items correspond to implemented StatKeys above; the rest are labeled placeholders.
 * You can progressively convert any label into a real StatKey later.
 */
export const GROUP_LABELS: Record<StatGroupId, string[]> = {
  core: [
    'Health',
    'Happiness',
    'Intellect',
    'Wealth',
    'Reputation',
    'Vitality',
    'Wellbeing',
    'Stability',
    'Security',
    'Comfort',
    'Lifestyle',
    'Opportunity',
    'Freedom',
    'Social Status',
    'Influence',
    'Legacy',
    'Fulfillment',
    'Balance',
    'Growth',
    'Risk',
    'Safety Net',
    'Leisure',
    'Productivity',
    'Autonomy',
    'Purpose',
    'Recreation',
    'Environment',
    'Housing',
    'Nutrition',
    'Transportation',
  ],
  professional: [
    'Discipline',
    'Ambition',
    'Communication',
    'Financial Literacy',
    'Confidence',
    'Leadership',
    'Focus',
    'Work Ethic',
    'Time Management',
    'Networking',
    'Negotiation',
    'Technical Skill',
    'Problem Solving',
    'Adaptability',
    'Strategic Thinking',
    'Project Management',
    'Quality',
    'Reliability',
    'Initiative',
    'Learning Agility',
    'Mentorship',
    'Public Speaking',
    'Writing',
    'Organization',
    'Decision Making',
    'Risk Management',
    'Analytical Skill',
    'Attention to Detail',
    'Customer Service',
    'Entrepreneurship',
  ],
  relationship: [
    'Charisma',
    'Empathy',
    'Social',
    'Sex Appeal',
    'Trust',
    'Loyalty',
    'Kindness',
    'Listening',
    'Boundaries',
    'Conflict Resolution',
    'Romance',
    'Family Bond',
    'Friendship',
    'Humor',
    'Patience',
    'Supportiveness',
    'Respect',
    'Honesty',
    'Forgiveness',
    'Love Language',
    'Intimacy',
    'Dating Skill',
    'Parenting',
    'Community',
    'Generosity',
    'Gratitude',
    'Hospitality',
    'Reliability',
    'Conflict Management',
    'Social Awareness',
  ],
  personal: [
    'Hygiene',
    'Fitness',
    'Stress',
    'Energy',
    'Morality',
    'Luck',
    'Sleep',
    'Diet',
    'Routine',
    'Mindfulness',
    'Self-Control',
    'Courage',
    'Optimism',
    'Punctuality',
    'Tidiness',
    'Appearance',
    'Fashion Sense',
    'Frugality',
    'Adventurousness',
    'Risk Appetite',
    'Spirituality',
    'Hobbies',
    'Curiosity',
    'Screen Time',
    'Addiction Resistance',
    'Pain Tolerance',
    'Immune Strength',
    'Endurance',
    'Flexibility',
    'Coordination',
  ],
  skills: [
    'Cooking',
    'Street Smarts',
    'Creativity',
    'Driving',
    'Swimming',
    'First Aid',
    'Coding',
    'Mathematics',
    'Creative Writing',
    'Drawing',
    'Music',
    'Photography',
    'Design',
    'Mechanics',
    'Carpentry',
    'Gardening',
    'Languages',
    'Marketing',
    'Accounting',
    'Investing',
    'Housekeeping',
    'Sewing',
    'Baking',
    'Presentation',
    'Research',
    'Chess',
    'Navigation',
    'Survival',
    'Fishing',
    'Data Analysis',
  ],
  mind: [
    'Wisdom',
    'Resilience',
    'Memory',
    'Focus',
    'Learning',
    'Reasoning',
    'Intuition',
    'Emotional Regulation',
    'Meditation',
    'Stoicism',
    'Pattern Recognition',
    'Spatial Awareness',
    'Numeracy',
    'Verbal Aptitude',
    'Critical Thinking',
    'Growth Mindset',
    'Metacognition',
    'Open-Mindedness',
    'Conscientiousness',
    'Self-Esteem',
    'Impulse Control',
    'Delayed Gratification',
    'Self-Awareness',
    'Visualization',
    'Imagination',
    'Calmness',
    'Patience',
    'Tolerance',
    'Perspective Taking',
    'Problem Decomposition',
  ],
};

// ===== Core domain types =====
export type Gender = 'male' | 'female';

export const TRAIT_IDS = [
  'lucky',
  'introvert',
  'extrovert',
  'hardworking',
  'impulsive',
  'street_smart',
  'ambitious',
  'lazy',
  'loyal',
  'manipulative',
  'kind',
  'violent',
  'anxious',
  'popular',
  'intelligent',
  'rebellious',
  'family_oriented',
  'greedy',
  'charismatic',
  'romantic',
] as const;

export type TraitId = (typeof TRAIT_IDS)[number];

export type FlagId = string; // e.g., 'has_insurance', 'criminal_record'
export type LifePhase = 'child' | 'teen' | 'adult' | 'retired';

// ===== Event system =====
export type Condition =
  | { kind: 'ageAtLeast'; days: number }
  | { kind: 'ageAtMost'; days: number }
  | { kind: 'statAtLeast'; stat: StatKey; value: number }
  | { kind: 'statAtMost'; stat: StatKey; value: number }
  | { kind: 'hasTrait'; trait: TraitId }
  | { kind: 'notTrait'; trait: TraitId }
  | { kind: 'hasFlag'; flag: FlagId }
  | { kind: 'notFlag'; flag: FlagId }
  | { kind: 'phaseIs'; phase: LifePhase }
  | { kind: 'hasJob' }
  | { kind: 'notJob' }
  | { kind: 'jobLevelAtLeast'; level: number }
  | { kind: 'daysWorkedAtLeast'; days: number };

export type Effect =
  | { kind: 'deltaStat'; stat: StatKey; delta: number }
  | { kind: 'setStat'; stat: StatKey; value: number }
  | { kind: 'addTrait'; trait: TraitId }
  | { kind: 'removeTrait'; trait: TraitId }
  | { kind: 'setFlag'; flag: FlagId; value: boolean }
  | { kind: 'advanceDays'; days: number }
  | { kind: 'giveMoney'; amount: number }
  | { kind: 'setJob'; jobId: string; level?: number }
  | { kind: 'promoteJob'; levels?: number }
  | { kind: 'fireJob' };

export type Choice = {
  id: string;
  text: string;
  conditions?: Condition[];
  effects?: Effect[];
  weight?: number;
};

export type GameEvent = {
  id: string;
  title: string;
  text: string;
  tags?: string[];
  weight: number;
  once?: boolean;
  cooldownDays?: number;
  when?: Condition[];
  choices: Choice[];
};

export type HistoryEntry = {
  day: number;
  eventId: string;
  choiceId: string;
  delta: Partial<StatBlock>;
};

export type JobState = {
  id: string;
  level: number;
  daysWorked: number;
  progress?: number;
  company?: string | null;
  demand?: number;
  payMultiplier?: number;
} | null;

// STAR (Fame / Infamy): -100 .. +100 (center = 0 => "Normal")
export type GameState = {
  seed: string;
  gender: Gender;
  world: WorldState;
  day: number;
  dateISO: string;
  stats: StatBlock;
  star: number;
  traits: TraitId[];
  flags: Record<FlagId, boolean>;
  cooldowns: Record<string, number>;
  seen: Record<string, boolean>;
  history: HistoryEntry[];
  // ⬇️ extended job details (backward-compatible defaults)
  job: JobState;
};
