import { DEFAULT_STATS, type Gender, type StatBlock, type TraitId } from '../types';
import { recordLifeEvent } from '../lifeEvents/lifeEvents';
import { upsertRelationship } from '../relationships/relationships';
import { seededRandom } from '../rng';
import { createEmptyEducationState } from '../education/educationState';
import type {
  Family,
  Household,
  Person,
  PersonId,
  SimDate,
  WorldState,
} from './types';

const FIRST_NAMES: Record<Gender, string[]> = {
  female: ['Amina', 'Zara', 'Maya', 'Talia', 'Nora', 'Imani', 'Lina', 'Sofia'],
  male: ['Adam', 'Kamal', 'Noah', 'Malik', 'Yusuf', 'Leo', 'Omar', 'Daniel'],
};

const LAST_NAMES = ['Yakubu', 'Adeyemi', 'Okafor', 'Mensah', 'Khan', 'Lawal', 'Bello', 'Ibrahim'];

function clamp100(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function pick<T>(items: T[], rand: () => number) {
  return items[Math.floor(rand() * items.length)] ?? items[0];
}

function personId(name: string, suffix: string) {
  return `${name.toLowerCase().replace(/[^a-z0-9]+/g, '_')}_${suffix}`;
}

function makeStats(overrides: Partial<StatBlock> = {}): StatBlock {
  return { ...DEFAULT_STATS, ...overrides };
}

export function makePerson(input: {
  id: PersonId;
  firstName: string;
  lastName: string;
  gender: Gender;
  birthDate: SimDate;
  householdId: string;
  familyId: string;
  traits: TraitId[];
  stats?: Partial<StatBlock>;
  wealth?: number;
  income?: number;
}): Person {
  const stats = makeStats(input.stats);
  return {
    id: input.id,
    firstName: input.firstName,
    lastName: input.lastName,
    gender: input.gender,
    birthDate: input.birthDate,
    parentIds: [],
    childIds: [],
    siblingIds: [],
    partnerIds: [],
    householdId: input.householdId,
    familyId: input.familyId,
    educationHistory: [],
    employmentHistory: [],
    wealth: input.wealth ?? stats.wealth,
    income: input.income ?? 0,
    health: stats.health,
    traits: input.traits,
    stats,
    reputation: stats.reputation,
    memories: [],
    lifeEventIds: [],
    currentGoals: [],
    relationshipIds: [],
    status: 'living',
  };
}

export function newWorld(seed = 'yakubu', gender: Gender = 'female'): WorldState {
  const rand = seededRandom(`world:${seed}`);
  const lastName = pick(LAST_NAMES, rand);
  const familyId = `family_${lastName.toLowerCase()}`;
  const householdId = `household_${lastName.toLowerCase()}_1`;
  const birthDate = { year: 2007, month: 1, day: 1 };

  const playerFirstName = pick(FIRST_NAMES[gender], rand);
  const fatherFirstName = pick(FIRST_NAMES.male, rand);
  const motherFirstName = pick(FIRST_NAMES.female, rand);

  const playerId = personId(playerFirstName, 'player');
  const fatherId = personId(fatherFirstName, 'father');
  const motherId = personId(motherFirstName, 'mother');

  const world: WorldState = {
    seed,
    currentDate: birthDate,
    people: {},
    families: {},
    households: {},
    institutions: {},
    businesses: {},
    relationships: {},
    lifeEvents: {},
    education: createEmptyEducationState(),
    playerLineage: {
      founderId: playerId,
      activePersonId: playerId,
      generation: 1,
      previousPlayerIds: [],
    },
    society: {
      economy: 52 + Math.round(rand() * 18),
      politics: 48 + Math.round(rand() * 18),
      culture: 50 + Math.round(rand() * 18),
      crime: 22 + Math.round(rand() * 20),
      opportunity: 42 + Math.round(rand() * 30),
    },
    milestones: [],
  };

  const father = makePerson({
    id: fatherId,
    firstName: fatherFirstName,
    lastName,
    gender: 'male',
    birthDate: { year: 1974 + Math.floor(rand() * 5), month: 4, day: 12 },
    householdId,
    familyId,
    traits: ['hardworking', 'family_oriented'],
    stats: { wealth: 2600, workEthic: 64, discipline: 62, socialStatus: 45 },
    wealth: 2600,
    income: 70,
  });

  const mother = makePerson({
    id: motherId,
    firstName: motherFirstName,
    lastName,
    gender: 'female',
    birthDate: { year: 1976 + Math.floor(rand() * 5), month: 8, day: 22 },
    householdId,
    familyId,
    traits: ['kind', 'loyal'],
    stats: { wealth: 2400, empathy: 70, emotionalStability: 64, socialStatus: 44 },
    wealth: 2400,
    income: 60,
  });

  const player = makePerson({
    id: playerId,
    firstName: playerFirstName,
    lastName,
    gender,
    birthDate,
    householdId,
    familyId,
    traits: ['hardworking'],
    stats: { wealth: 0, academicAbility: 46, socialStatus: 38 },
    wealth: 0,
  });

  player.parentIds = [fatherId, motherId];
  father.childIds = [playerId];
  mother.childIds = [playerId];
  father.partnerIds = [motherId];
  mother.partnerIds = [fatherId];
  father.spouseId = motherId;
  mother.spouseId = fatherId;

  world.people[fatherId] = father;
  world.people[motherId] = mother;
  world.people[playerId] = player;

  const family: Family = {
    id: familyId,
    name: `${lastName} family`,
    memberIds: [fatherId, motherId, playerId],
    reputation: 45,
    wealth: father.wealth + mother.wealth,
    trauma: 0,
    memoryEventIds: [],
  };

  const household: Household = {
    id: householdId,
    name: `${lastName} household`,
    memberIds: [fatherId, motherId, playerId],
    familyId,
    wealth: family.wealth,
    addressLabel: 'a modest family home',
  };

  world.families[familyId] = family;
  world.households[householdId] = household;

  upsertRelationship(world, fatherId, motherId, {
    types: ['spouse'],
    origin: 'family',
    originLabel: 'married before your birth',
    date: birthDate,
    deltas: { closeness: 50, trust: 45, respect: 42, familiarity: 70 },
  });

  for (const parentId of [fatherId, motherId]) {
    upsertRelationship(world, parentId, playerId, {
      types: ['parent', 'child'],
      origin: 'birth',
      originLabel: 'parent and child',
      date: birthDate,
      deltas: { closeness: 60, trust: 60, respect: 35, familiarity: 80 },
    });
  }

  const birthEvent = recordLifeEvent(world, {
    type: 'born',
    personIds: [playerId, fatherId, motherId],
    description: `${player.firstName} ${lastName} was born into the ${lastName} family.`,
    consequences: ['A new player lineage begins.', 'The family household gains a child.'],
    tags: ['birth', 'family', 'lineage'],
    importantMemory: true,
    memoryTitle: 'Birth of the player lineage',
  });

  family.memoryEventIds.push(birthEvent.id);
  world.milestones.push(`World created: ${player.firstName} was born into the ${lastName} family.`);

  return world;
}

export function createChild(
  world: WorldState,
  parentAId: PersonId,
  parentBId: PersonId,
  options: { gender?: Gender; firstName?: string; lastName?: string; tags?: string[] } = {},
) {
  const parentA = world.people[parentAId];
  const parentB = world.people[parentBId];
  if (!parentA || !parentB) return null;

  const rand = seededRandom(`child:${world.seed}:${parentAId}:${parentBId}:${world.currentDate.year}:${parentA.childIds.length}`);
  const gender = options.gender ?? (rand() > 0.5 ? 'female' : 'male');
  const firstName = options.firstName ?? pick(FIRST_NAMES[gender], rand);
  const lastName = options.lastName ?? parentA.lastName;
  const id = personId(firstName, `child_${Object.keys(world.people).length + 1}`);
  const householdId = parentA.householdId;
  const familyId = parentA.familyId;
  const family = world.families[familyId];
  const household = world.households[householdId];

  const child = makePerson({
    id,
    firstName,
    lastName,
    gender,
    birthDate: { ...world.currentDate },
    householdId,
    familyId,
    traits: [rand() > 0.55 ? 'kind' : 'ambitious'],
    stats: {
      wealth: 0,
      health: clamp100((parentA.health + parentB.health) / 2 + (rand() - 0.5) * 18),
      academicAbility: clamp100((parentA.stats.intellect + parentB.stats.intellect) / 2 + (rand() - 0.5) * 20),
      emotionalStability: clamp100((parentA.stats.emotionalStability + parentB.stats.emotionalStability) / 2),
    },
    wealth: 0,
  });

  child.parentIds = [parentAId, parentBId];
  parentA.childIds.push(id);
  parentB.childIds.push(id);

  for (const siblingId of parentA.childIds.filter((existingId) => existingId !== id)) {
    child.siblingIds.push(siblingId);
    const sibling = world.people[siblingId];
    if (sibling && !sibling.siblingIds.includes(id)) sibling.siblingIds.push(id);
  }

  world.people[id] = child;
  family?.memberIds.push(id);
  if (household && !household.memberIds.includes(id)) household.memberIds.push(id);

  for (const parentId of [parentAId, parentBId]) {
    upsertRelationship(world, parentId, id, {
      types: ['parent', 'child'],
      origin: 'birth',
      originLabel: 'parent and child',
      date: world.currentDate,
      deltas: { closeness: 55, trust: 55, respect: 28, familiarity: 70 },
    });
  }

  for (const siblingId of child.siblingIds) {
    upsertRelationship(world, siblingId, id, {
      types: ['sibling'],
      origin: 'family',
      originLabel: 'siblings in the same family',
      date: world.currentDate,
      deltas: { closeness: 34, trust: 28, familiarity: 60 },
    });
  }

  recordLifeEvent(world, {
    type: 'had_child',
    personIds: [parentAId, parentBId, id],
    description: `${parentA.firstName} and ${parentB.firstName} had a child named ${firstName}.`,
    consequences: ['A new child was added to the family tree.'],
    tags: ['birth', 'family', ...(options.tags ?? [])],
    importantMemory: true,
    memoryTitle: `${firstName} was born`,
  });

  return child;
}
