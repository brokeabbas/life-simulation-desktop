import type { Category } from '../lifestyle/categories';
import { recordLifeEvent } from '../lifeEvents/lifeEvents';
import { getRelationshipsForPerson, upsertRelationship } from '../relationships/relationships';
import { seededRandom } from '../rng';
import { startPrimarySchool } from '../school/school';
import type { Gender, StatKey, TraitId } from '../types';
import { createChild, makePerson } from '../world/generation';
import { addYears, ageInYears } from '../world/date';
import type {
  LifeEventType,
  Person,
  RelationshipType,
  WorldState,
} from '../world/types';
import { getActiveLifeStage, type LifeStage } from './lifeStage';

export type LifeAction = {
  id: string;
  title: string;
  description: string;
  stages?: LifeStage[];
  minAge?: number;
  maxAge?: number;
  cost?: number;
  income?: number;
  statEffects: Partial<Record<StatKey, number>>;
  relationshipTarget?: 'parent' | 'friend' | 'partner' | 'child' | 'classmate';
  relationshipTypes?: RelationshipType[];
  relationshipEffects?: {
    closeness?: number;
    trust?: number;
    respect?: number;
    conflict?: number;
    familiarity?: number;
  };
  eventType: LifeEventType;
  memoryTitle: string;
  memoryDescription: string;
  tags: string[];
  special?: 'start_school' | 'make_friend' | 'date' | 'marry' | 'have_child' | 'retire' | 'die' | 'lottery' | 'crime';
};

export type LifeActionResult = {
  ok: boolean;
  message: string;
};

const ACTIONS: Record<Category, LifeAction[]> = {
  health_food: [
    action('exercise_routine', 'Build an exercise routine', 'Improve fitness and long-term health, but spend energy.', ['early_childhood', 'primary_school', 'secondary_school', 'post_school', 'young_adult', 'adult', 'middle_age', 'late_career', 'retired', 'old_age'], { health: 3, fitness: 4, physicalFitness: 4, stress: -2, energy: -2 }, 'health_changed', 'Committed to fitness', 'You made exercise a serious part of your life.', ['health', 'fitness']),
    action('doctor_visit', 'Visit a doctor', 'Spend money to protect health and catch problems early.', ['young_adult', 'adult', 'middle_age', 'late_career', 'retired', 'old_age'], { health: 5, mentalHealth: 1, stress: -1, wealth: -120 }, 'health_changed', 'Looked after your health', 'You paid for medical care instead of ignoring symptoms.', ['health', 'medical'], { cost: 120 }),
  ],
  job: [
    action('prepare_interview', 'Prepare for interviews', 'Practice answers and research employers before applying.', ['post_school', 'young_adult', 'adult', 'middle_age', 'late_career'], { communication: 3, confidence: 2, discipline: 1, stress: 1 }, 'got_job', 'Prepared for work', 'You prepared seriously for job interviews.', ['job', 'career']),
    action('accept_low_salary', 'Accept low salary for experience', 'Trade short-term money for work history and skill.', ['post_school', 'young_adult'], { practicalSkill: 4, workEthic: 3, reputation: 2, wealth: 250 }, 'got_job', 'Started from the bottom', 'You accepted modest pay to gain experience.', ['job', 'career'], { income: 250 }),
  ],
  business: [
    action('start_side_hustle', 'Start a side hustle', 'Use savings and spare time to test a small business idea.', ['secondary_school', 'post_school', 'young_adult', 'adult', 'middle_age'], { ambition: 4, financialLiteracy: 3, stress: 3, wealth: -250 }, 'started_business', 'Started a side hustle', 'You tried to build income outside a regular job.', ['business', 'money'], { cost: 250 }),
    action('partner_with_friend', 'Plan business with a friend', 'Turn social trust into a possible future venture.', ['young_adult', 'adult', 'middle_age'], { ambition: 2, communication: 2, financialLiteracy: 2 }, 'started_business', 'Discussed a partnership', 'You explored a business idea with someone you trust.', ['business', 'friend'], { relationshipTarget: 'friend', relationshipTypes: ['friend', 'business_partner'], relationshipEffects: { closeness: 8, trust: 5, respect: 5 } }),
  ],
  career: [
    action('work_hard_for_promotion', 'Work hard for promotion', 'Push performance and reputation at the cost of stress.', ['young_adult', 'adult', 'middle_age', 'late_career'], { workEthic: 4, reputation: 3, ambition: 2, stress: 4, familyBond: -1 }, 'got_job', 'Chased promotion', 'You worked harder to move up professionally.', ['career', 'promotion']),
    action('protect_family_time', 'Protect family time', 'Reduce career intensity to preserve home life.', ['adult', 'middle_age', 'late_career'], { familyBond: 5, happiness: 3, stress: -3, reputation: -1, wealth: -100 }, 'relationship_changed', 'Chose family time', 'You protected time for family instead of always chasing work.', ['career', 'family'], { cost: 100 }),
  ],
  education: [
    { ...action('start_primary_school', 'Start primary school', 'Enter formal education and meet teachers and classmates.', ['early_childhood', 'primary_school'], { academicAbility: 2, schoolGrades: 2, social: 1 }, 'started_school', 'Started school', 'You started primary school.', ['education', 'school']), special: 'start_school' },
    action('focus_subjects', 'Focus on strongest subjects', 'Build subject confidence that can unlock future education paths.', ['primary_school', 'secondary_school', 'post_school'], { academicAbility: 4, schoolGrades: 5, discipline: 2, stress: 2, social: -1 }, 'school_choice', 'Focused on schoolwork', 'You focused on the subjects that could shape your future.', ['education', 'subjects']),
    action('join_club', 'Join a club', 'Develop interests, friends, and confidence outside class.', ['primary_school', 'secondary_school', 'post_school'], { creativity: 3, confidence: 2, social: 3, schoolGrades: 1 }, 'school_choice', 'Joined a school club', 'You joined a club and started building an identity beyond grades.', ['education', 'club']),
    action('apply_scholarship', 'Apply for scholarship', 'Use grades and reputation to reduce education pressure.', ['secondary_school', 'post_school'], { discipline: 2, confidence: 2, financialLiteracy: 2, stress: 1, wealth: 300 }, 'exam_result', 'Applied for scholarship', 'You tried to turn good preparation into real opportunity.', ['education', 'scholarship'], { income: 300 }),
    action('choose_apprenticeship', 'Choose apprenticeship', 'Take a practical route instead of assuming university is the only path.', ['post_school', 'young_adult'], { practicalSkill: 6, workEthic: 3, academicAbility: -1, wealth: 200 }, 'graduated', 'Chose practical training', 'You chose training that could turn into work faster.', ['education', 'training'], { income: 200 }),
  ],
  government: [
    action('volunteer_civic', 'Volunteer locally', 'Build civic reputation and public trust.', ['secondary_school', 'post_school', 'young_adult', 'adult', 'middle_age'], { reputation: 4, morality: 3, socialStatus: 2, energy: -2 }, 'public_reputation', 'Served the community', 'You spent time helping your community.', ['government', 'civic']),
    action('civil_service_exam', 'Prepare for civil service exam', 'Study for stable government work.', ['post_school', 'young_adult', 'adult'], { discipline: 3, academicAbility: 2, stress: 2, reputation: 1 }, 'got_job', 'Prepared for civil service', 'You prepared for a stable public-sector career.', ['government', 'career']),
  ],
  assets: [
    action('buy_work_tools', 'Buy useful equipment', 'Invest in tools that improve practical opportunity.', ['post_school', 'young_adult', 'adult', 'middle_age'], { practicalSkill: 3, workEthic: 1, wealth: -200 }, 'bought_asset', 'Bought useful tools', 'You bought tools that could support work and side income.', ['assets', 'tools'], { cost: 200 }),
    action('small_investment', 'Make a small investment', 'Risk savings to build financial literacy and future wealth.', ['young_adult', 'adult', 'middle_age', 'late_career'], { financialLiteracy: 4, wealth: 150, stress: 1 }, 'bought_asset', 'Made an investment', 'You started learning how to make money work for you.', ['assets', 'investment'], { income: 150 }),
  ],
  bank: [
    action('save_aggressively', 'Save aggressively', 'Reduce spending and build security.', ['secondary_school', 'post_school', 'young_adult', 'adult', 'middle_age', 'late_career'], { financialLiteracy: 3, discipline: 2, wealth: 250, happiness: -1 }, 'managed_money', 'Saved money', 'You chose security over short-term comfort.', ['bank', 'savings'], { income: 250 }),
    action('take_loan', 'Take a loan', 'Use borrowed money to solve a pressure now, with stress later.', ['young_adult', 'adult', 'middle_age'], { wealth: 600, stress: 4, financialLiteracy: 1 }, 'managed_money', 'Took a loan', 'You borrowed money, gaining breathing room but adding pressure.', ['bank', 'debt'], { income: 600 }),
  ],
  lifestyle: [
    action('read_indoors', 'Stay indoors and read', 'Build intelligence and calm, with less social practice.', ['early_childhood', 'primary_school'], { intellect: 3, academicAbility: 2, mentalHealth: 1, social: -1 }, 'school_choice', 'Read quietly', 'You spent childhood time reading and thinking.', ['childhood', 'learning']),
    action('play_outside', 'Play outside with local kids', 'Build social confidence and fitness through play.', ['early_childhood', 'primary_school'], { social: 3, confidence: 2, physicalFitness: 2, academicAbility: -1 }, 'met_friend', 'Played outside', 'You learned about people by playing outside with local children.', ['childhood', 'social']),
    action('balanced_life', 'Set a balanced routine', 'Protect sleep, diet, work, and relationships.', ['secondary_school', 'post_school', 'young_adult', 'adult', 'middle_age', 'late_career'], { health: 2, mentalHealth: 3, stress: -3, discipline: 2, happiness: 2 }, 'health_changed', 'Built a balanced routine', 'You tried to live in a way that could last.', ['lifestyle', 'routine']),
  ],
  properties: [
    action('rent_better_home', 'Move to a better area', 'Spend more for comfort, safety, and opportunity.', ['young_adult', 'adult', 'middle_age'], { happiness: 4, socialStatus: 3, stress: -2, wealth: -500 }, 'moved_home', 'Moved to a better home', 'You moved somewhere that improved daily life.', ['property', 'home'], { cost: 500 }),
    action('buy_house', 'Buy a family house', 'Make a major wealth decision that shapes stability.', ['adult', 'middle_age', 'late_career'], { familyBond: 5, socialStatus: 4, stress: 2, wealth: -1500 }, 'moved_home', 'Bought a home', 'You bought property and changed your family stability.', ['property', 'asset'], { cost: 1500 }),
  ],
  media: [
    action('build_public_profile', 'Build a public profile', 'Use media to increase reputation and opportunity.', ['secondary_school', 'post_school', 'young_adult', 'adult', 'middle_age'], { reputation: 4, socialStatus: 3, communication: 2, stress: 1 }, 'public_reputation', 'Built a public profile', 'You became more visible to people outside your immediate circle.', ['media', 'reputation']),
    action('tell_your_story', 'Tell your story publicly', 'Share your life and risk judgment for attention.', ['young_adult', 'adult', 'middle_age', 'late_career'], { confidence: 3, reputation: 2, stress: 2 }, 'public_reputation', 'Shared your story', 'You made part of your life public.', ['media', 'identity']),
  ],
  relationship: [
    action('bond_parent', 'Spend time with family', 'Build family trust and emotional stability.', ['early_childhood', 'primary_school', 'secondary_school', 'post_school', 'young_adult', 'adult', 'middle_age', 'late_career', 'retired', 'old_age'], { familyBond: 4, happiness: 2, emotionalStability: 2, stress: -1 }, 'relationship_changed', 'Protected a family bond', 'You invested time into family relationships.', ['relationship', 'family'], { relationshipTarget: 'parent', relationshipTypes: ['parent'], relationshipEffects: { closeness: 8, trust: 5 } }),
    { ...action('make_close_friend', 'Make a close friend', 'Invest in a friendship that can matter later.', ['primary_school', 'secondary_school', 'post_school', 'young_adult', 'adult'], { social: 3, happiness: 3, confidence: 1 }, 'met_friend', 'Made a real friend', 'You chose to build a meaningful friendship.', ['relationship', 'friend']), special: 'make_friend' },
    { ...action('start_dating', 'Start dating', 'Open a romantic chapter with emotional risk and reward.', ['secondary_school', 'post_school', 'young_adult', 'adult', 'middle_age'], { happiness: 3, confidence: 2, stress: 1 }, 'started_dating', 'Started dating', 'You started a romantic relationship.', ['relationship', 'romance']), special: 'date' },
    { ...action('marry_partner', 'Marry or commit long-term', 'Build a stable partnership with money and family consequences.', ['young_adult', 'adult', 'middle_age'], { familyBond: 5, happiness: 4, stress: 1, wealth: -300 }, 'married', 'Committed to a partner', 'You chose a long-term partnership.', ['relationship', 'marriage'], { cost: 300 }), special: 'marry' },
    { ...action('have_child', 'Have a child', 'Start or grow your family inside this life.', ['young_adult', 'adult', 'middle_age'], { familyBond: 6, happiness: 4, stress: 5, wealth: -450, energy: -4 }, 'had_child', 'Became a parent', 'You had a child and your family life changed.', ['relationship', 'children'], { cost: 450 }), special: 'have_child' },
  ],
  pets: [
    action('adopt_pet', 'Adopt a pet', 'Gain companionship, responsibility, and extra costs.', ['primary_school', 'secondary_school', 'post_school', 'young_adult', 'adult', 'middle_age', 'retired'], { happiness: 4, empathy: 3, stress: -1, wealth: -120 }, 'relationship_changed', 'Adopted a pet', 'You brought a pet into your daily life.', ['pets', 'home'], { cost: 120 }),
    action('care_for_pet', 'Care for your pet', 'Build patience and emotional warmth.', ['primary_school', 'secondary_school', 'post_school', 'young_adult', 'adult', 'middle_age', 'retired'], { patience: 3, empathy: 2, mentalHealth: 2, energy: -1 }, 'relationship_changed', 'Cared for a pet', 'You made time for a dependent creature at home.', ['pets', 'care']),
  ],
  will: [
    { ...action('retire', 'Retire from work', 'Step away from career pressure and enter late-life reflection.', ['late_career', 'retired', 'old_age'], { stress: -5, happiness: 2, wealth: -200, familyBond: 2 }, 'retired', 'Retired', 'You retired or reduced work as old age approached.', ['will', 'retirement'], { cost: 200 }), special: 'retire' },
    action('repair_relationships', 'Repair broken relationships', 'Use late life to heal old conflict.', ['middle_age', 'late_career', 'retired', 'old_age'], { familyBond: 5, happiness: 3, patience: 3, stress: -2 }, 'relationship_changed', 'Tried to repair relationships', 'You tried to mend relationships before it was too late.', ['will', 'family'], { relationshipTarget: 'child', relationshipTypes: ['child'], relationshipEffects: { closeness: 10, trust: 8, conflict: -5 } }),
    { ...action('write_will', 'Write a will', 'Prepare your estate and reduce future family conflict.', ['middle_age', 'late_career', 'retired', 'old_age'], { financialLiteracy: 3, familyBond: 2, stress: -2, wealth: -80 }, 'wrote_will', 'Prepared a will', 'You put your wishes in writing.', ['will', 'estate'], { cost: 80 }), special: 'retire' },
    { ...action('complete_life', 'Face the end of life', 'End the current life and generate a summary from real memories.', ['old_age'], { stress: -10 }, 'died', 'Life ended', 'Your life came to an end.', ['will', 'death']), special: 'die' },
  ],
  lottery: [
    { ...action('buy_ticket', 'Buy a lottery ticket', 'Risk a little money for a rare windfall.', ['secondary_school', 'post_school', 'young_adult', 'adult', 'middle_age', 'late_career', 'retired'], { luck: 1, wealth: -20, stress: 1 }, 'managed_money', 'Tried your luck', 'You bought a lottery ticket.', ['lottery', 'luck'], { cost: 20 }), special: 'lottery' },
    action('avoid_gambling', 'Avoid gambling', 'Choose discipline over false hope.', ['secondary_school', 'post_school', 'young_adult', 'adult', 'middle_age', 'late_career', 'retired'], { discipline: 3, financialLiteracy: 2, stress: -1 }, 'managed_money', 'Avoided gambling', 'You resisted gambling and protected your money habits.', ['lottery', 'discipline']),
  ],
  shop: [
    action('buy_books', 'Buy books or courses', 'Spend money on learning instead of status.', ['primary_school', 'secondary_school', 'post_school', 'young_adult', 'adult'], { intellect: 2, academicAbility: 2, practicalSkill: 2, wealth: -100 }, 'bought_asset', 'Bought learning materials', 'You spent money on learning.', ['shop', 'education'], { cost: 100 }),
    action('buy_luxury', 'Buy luxury items', 'Increase status and happiness briefly, but hurt savings.', ['young_adult', 'adult', 'middle_age'], { happiness: 3, socialStatus: 3, wealth: -350, financialLiteracy: -1 }, 'bought_asset', 'Bought luxury', 'You spent money to feel and look successful.', ['shop', 'status'], { cost: 350 }),
  ],
  become_infamous: [
    { ...action('petty_crime', 'Commit petty crime', 'Try to get money quickly and risk reputation damage.', ['secondary_school', 'post_school', 'young_adult', 'adult'], { streetSmarts: 3, morality: -4, stress: 4, reputation: -3, wealth: 250 }, 'committed_crime', 'Committed a crime', 'You chose a risky illegal shortcut.', ['crime', 'infamy'], { income: 250 }), special: 'crime' },
    action('public_feud', 'Start a public feud', 'Gain attention through conflict.', ['secondary_school', 'post_school', 'young_adult', 'adult', 'middle_age'], { reputation: -2, socialStatus: 2, confidence: 2, stress: 3 }, 'public_reputation', 'Started a public feud', 'You became known through conflict.', ['infamy', 'media']),
  ],
};

function action(
  id: string,
  title: string,
  description: string,
  stages: LifeStage[],
  statEffects: Partial<Record<StatKey, number>>,
  eventType: LifeEventType,
  memoryTitle: string,
  memoryDescription: string,
  tags: string[],
  extra: Partial<LifeAction> = {},
): LifeAction {
  return { id, title, description, stages, statEffects, eventType, memoryTitle, memoryDescription, tags, ...extra };
}

function clampStat(stat: StatKey, value: number) {
  if (stat === 'wealth') return Math.max(0, Math.round(value));
  return Math.max(0, Math.min(100, Math.round(value)));
}

function active(world: WorldState) {
  return world.people[world.playerLineage.activePersonId] ?? null;
}

function available(action: LifeAction, world: WorldState) {
  const person = active(world);
  if (!person || person.status === 'dead') return false;
  const age = ageInYears(person.birthDate, world.currentDate);
  const stage = getActiveLifeStage(world);
  if (action.stages && !action.stages.includes(stage)) return false;
  if (typeof action.minAge === 'number' && age < action.minAge) return false;
  if (typeof action.maxAge === 'number' && age > action.maxAge) return false;
  if (action.cost && person.stats.wealth < action.cost) return false;
  if (action.special === 'die' && stage !== 'old_age') return false;
  return true;
}

export function getCategoryLifeActions(category: Category, world: WorldState) {
  return (ACTIONS[category] ?? []).filter((item) => available(item, world));
}

export function getCategoryLifeSummary(category: Category, world: WorldState) {
  const person = active(world);
  const stage = getActiveLifeStage(world);
  if (!person) return 'No active character exists in this world.';
  const age = ageInYears(person.birthDate, world.currentDate);
  const school = person.educationHistory[person.educationHistory.length - 1];
  const job = person.employmentHistory[person.employmentHistory.length - 1];
  const children = person.childIds.length;

  switch (category) {
    case 'education':
      return school
        ? `${person.firstName} is shaped by ${school.stage} education, grades ${Math.round(person.stats.schoolGrades)}, and academic ability ${Math.round(person.stats.academicAbility)}.`
        : `${person.firstName} has not started formal school yet. Family background and early choices still matter.`;
    case 'relationship':
      return `${person.firstName} has ${person.relationshipIds.length} relationship links, family bond ${Math.round(person.stats.familyBond)}, and ${children} child${children === 1 ? '' : 'ren'}.`;
    case 'career':
    case 'job':
      return job ? `${person.firstName} works as ${job.role}. Stress, work ethic, reputation, and family time now compete.` : `${person.firstName} has no long-term career record yet.`;
    case 'bank':
    case 'assets':
    case 'properties':
      return `Current wealth is ${Math.round(person.stats.wealth)}. Financial literacy is ${Math.round(person.stats.financialLiteracy)}.`;
    case 'will':
      return stage === 'deceased' ? buildLifeSummary(world) : `${person.firstName} is ${age}. Late-life choices will shape retirement, family repair, and the final summary.`;
    default:
      return `${person.firstName} is in ${stage.replace(/_/g, ' ')}. Choices here should feed the whole life, not just this screen.`;
  }
}

export function buildLifeSummary(world: WorldState) {
  const person = active(world);
  if (!person) return 'No life summary is available.';
  const important = person.memories.slice(-8);
  const traits = person.traits.join(', ') || 'unmarked by strong traits';
  const age = person.deathDate ? ageInYears(person.birthDate, person.deathDate) : ageInYears(person.birthDate, world.currentDate);
  const children = person.childIds.length;
  const work = person.employmentHistory[person.employmentHistory.length - 1]?.role ?? 'no lasting career title';
  const memoryText = important.length
    ? important.map((memory) => memory.title).join(', ')
    : 'few major memories were recorded';
  return `${person.firstName} ${person.lastName} lived to ${age}. They were ${traits}, worked as ${work}, had ${children} child${children === 1 ? '' : 'ren'}, and were shaped by: ${memoryText}.`;
}

export function applyLifeAction(world: WorldState, category: Category, actionId: string): LifeActionResult {
  const person = active(world);
  if (!person) return { ok: false, message: 'No active character.' };

  const action = (ACTIONS[category] ?? []).find((item) => item.id === actionId);
  if (!action) return { ok: false, message: 'Action not found.' };
  if (!available(action, world)) return { ok: false, message: 'That action is not currently available.' };

  if (action.special === 'start_school') {
    startPrimarySchool(world);
  }

  let relatedPerson = resolveTarget(world, action);
  if (action.special === 'make_friend') relatedPerson = ensureFriend(world);
  if (action.special === 'date') relatedPerson = ensureRomanticPartner(world, false);
  if (action.special === 'marry') relatedPerson = ensureRomanticPartner(world, true);
  if (action.special === 'have_child') relatedPerson = ensureChild(world);

  const lotteryMessage = action.special === 'lottery' ? applyLottery(world, person) : null;
  const crimeMessage = action.special === 'crime' ? applyCrimeRisk(world, person) : null;

  for (const [key, delta] of Object.entries(action.statEffects)) {
    const stat = key as StatKey;
    person.stats[stat] = clampStat(stat, (person.stats[stat] ?? 0) + Number(delta ?? 0));
  }
  person.health = person.stats.health;
  person.wealth = person.stats.wealth;
  person.reputation = person.stats.reputation;

  if (relatedPerson) {
    upsertRelationship(world, person.id, relatedPerson.id, {
      types: action.relationshipTypes ?? ['friend'],
      origin: 'choice',
      originLabel: action.memoryTitle,
      date: world.currentDate,
      deltas: action.relationshipEffects ?? { closeness: 6, familiarity: 5 },
      history: action.memoryDescription,
    });
  }

  if (action.special === 'retire') {
    person.currentGoals = person.currentGoals.filter((goal) => goal !== 'career_growth');
    person.currentGoals.push('late_life_reflection');
  }

  if (action.special === 'die') {
    person.status = 'dead';
    person.deathDate = { ...world.currentDate };
  }

  recordLifeEvent(world, {
    type: action.eventType,
    personIds: relatedPerson ? [person.id, relatedPerson.id] : [person.id],
    description: action.memoryDescription,
    consequences: [
      ...Object.entries(action.statEffects).map(([stat, delta]) => `${stat} ${Number(delta) >= 0 ? '+' : ''}${delta}`),
      lotteryMessage,
      crimeMessage,
    ].filter((item): item is string => Boolean(item)),
    tags: action.tags,
    importantMemory: true,
    memoryTitle: action.memoryTitle,
  });

  if (action.special !== 'die' && person.status === 'living') {
    world.currentDate = addYears(world.currentDate, ageInYears(person.birthDate, world.currentDate) < 18 ? 1 : 0);
  }

  return { ok: true, message: lotteryMessage ?? crimeMessage ?? action.memoryDescription };
}

function resolveTarget(world: WorldState, action: LifeAction): Person | null {
  const person = active(world);
  if (!person || !action.relationshipTarget) return null;
  if (action.relationshipTarget === 'parent') return person.parentIds.map((id) => world.people[id]).find(Boolean) ?? null;
  if (action.relationshipTarget === 'child') return person.childIds.map((id) => world.people[id]).find(Boolean) ?? null;
  if (action.relationshipTarget === 'partner') return person.spouseId ? world.people[person.spouseId] ?? null : null;
  if (action.relationshipTarget === 'classmate') {
    const latestSchool = person.educationHistory[person.educationHistory.length - 1];
    return latestSchool?.classmateIds.map((id) => world.people[id]).find(Boolean) ?? null;
  }
  if (action.relationshipTarget === 'friend') {
    return getRelationshipsForPerson(world, person.id)
      .map((relationship) => world.people[relationship.personAId === person.id ? relationship.personBId : relationship.personAId])
      .find((other) => Boolean(other)) ?? null;
  }
  return null;
}

function ensureFriend(world: WorldState) {
  const person = active(world);
  if (!person) return null;
  const existing = resolveTarget(world, { relationshipTarget: 'friend' } as LifeAction);
  if (existing) return existing;

  const school = person.educationHistory[person.educationHistory.length - 1];
  const classmate = school?.classmateIds.map((id) => world.people[id]).find(Boolean);
  if (classmate) return classmate;

  return createNpc(world, 'friend', oppositeGender(person.gender), person.birthDate.year, ['loyal', 'kind']);
}

function ensureRomanticPartner(world: WorldState, commit: boolean) {
  const person = active(world);
  if (!person) return null;
  if (person.spouseId) return world.people[person.spouseId] ?? null;

  const existing = getRelationshipsForPerson(world, person.id)
    .map((relationship) => world.people[relationship.personAId === person.id ? relationship.personBId : relationship.personAId])
    .find((other) => other && getRelationshipsForPerson(world, person.id).some((relationship) => relationship.types.includes('romantic_partner')));
  const partner = existing ?? createNpc(world, 'partner', oppositeGender(person.gender), person.birthDate.year + 1, ['loyal', 'romantic' as TraitId]);
  if (!partner) return null;

  upsertRelationship(world, person.id, partner.id, {
    types: commit ? ['romantic_partner', 'spouse'] : ['romantic_partner'],
    origin: 'choice',
    originLabel: commit ? 'committed as long-term partners' : 'started dating',
    date: world.currentDate,
    deltas: { closeness: commit ? 35 : 20, trust: commit ? 28 : 12, attraction: 35, familiarity: 18 },
    history: commit ? 'They chose long-term commitment.' : 'They started dating.',
  });

  if (commit) {
    person.spouseId = partner.id;
    partner.spouseId = person.id;
    if (!person.partnerIds.includes(partner.id)) person.partnerIds.push(partner.id);
    if (!partner.partnerIds.includes(person.id)) partner.partnerIds.push(person.id);
  }
  return partner;
}

function ensureChild(world: WorldState) {
  const person = active(world);
  if (!person) return null;
  const partner = ensureRomanticPartner(world, true);
  if (!partner) return null;
  return createChild(world, person.id, partner.id, {});
}

function createNpc(world: WorldState, role: string, gender: Gender, birthYear: number, traits: TraitId[]) {
  const names: Record<Gender, string[]> = {
    female: ['Ada', 'Mina', 'Rana', 'Lina', 'Nora'],
    male: ['Tobi', 'Karim', 'Ike', 'Samir', 'Noah'],
  };
  const rand = seededRandom(`${world.seed}:${role}:${Object.keys(world.people).length}`);
  const firstName = names[gender][Math.floor(rand() * names[gender].length)] ?? names[gender][0];
  const lastName = ['Cole', 'Hassan', 'Bello', 'Okeke'][Math.floor(rand() * 4)] ?? 'Cole';
  const id = `${role}_${firstName.toLowerCase()}_${Object.keys(world.people).length}`;
  const familyId = `family_${id}`;
  const householdId = `household_${id}`;

  world.families[familyId] = {
    id: familyId,
    name: `${lastName} family`,
    memberIds: [id],
    reputation: 45,
    wealth: 1000,
    trauma: 0,
    memoryEventIds: [],
  };
  world.households[householdId] = {
    id: householdId,
    name: `${lastName} household`,
    memberIds: [id],
    familyId,
    wealth: 1000,
    addressLabel: 'nearby',
  };

  const npc = makePerson({
    id,
    firstName,
    lastName,
    gender,
    birthDate: { year: birthYear, month: 6, day: 12 },
    householdId,
    familyId,
    traits,
    stats: { social: 55, empathy: 55, wealth: 400 },
    wealth: 400,
  });
  world.people[id] = npc;
  return npc;
}

function oppositeGender(gender: Gender): Gender {
  return gender === 'female' ? 'male' : 'female';
}

function applyLottery(world: WorldState, person: Person) {
  const rand = seededRandom(`lottery:${world.seed}:${person.id}:${world.currentDate.year}:${world.currentDate.month}`);
  const chance = (person.stats.luck + person.stats.financialLiteracy * 0.2) / 140;
  if (rand() < chance * 0.08) {
    const win = 2500 + Math.round(rand() * 5000);
    person.stats.wealth += win;
    person.stats.happiness = clampStat('happiness', person.stats.happiness + 8);
    return `Lottery win +${win}`;
  }
  person.stats.happiness = clampStat('happiness', person.stats.happiness - 1);
  return 'No lottery win this time.';
}

function applyCrimeRisk(world: WorldState, person: Person) {
  const rand = seededRandom(`crime:${world.seed}:${person.id}:${world.currentDate.year}:${world.currentDate.month}`);
  const caughtRisk = Math.max(0.1, (100 - person.stats.streetSmarts + world.society.crime * 0.2) / 140);
  if (rand() < caughtRisk) {
    person.stats.reputation = clampStat('reputation', person.stats.reputation - 8);
    person.stats.stress = clampStat('stress', person.stats.stress + 8);
    return 'You were caught and your reputation suffered.';
  }
  person.stats.wealth += 400;
  person.stats.streetSmarts = clampStat('streetSmarts', person.stats.streetSmarts + 2);
  return 'You got away with it, but the risk changed you.';
}
