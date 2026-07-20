import { recordLifeEvent } from '../lifeEvents/lifeEvents';
import { getRelationshipsForPerson, upsertRelationship } from '../relationships/relationships';
import { applyPrimarySchoolChoice, startPrimarySchool } from '../school/school';
import { seededRandom } from '../rng';
import type { Gender, TraitId } from '../types';
import { createChild, makePerson } from '../world/generation';
import { addDays, addYears, ageInYears } from '../world/date';
import type { Institution, Person, PersonId, WorldState } from '../world/types';

const PARTNER_NAMES: Record<Gender, string[]> = {
  female: ['Rana', 'Elena', 'Nadia', 'Farah', 'Mariam'],
  male: ['Karim', 'Dami', 'Nabil', 'Isaac', 'Tarek'],
};

const CAREERS = [
  { role: 'Primary Teacher', type: 'school' as const, salary: 90 },
  { role: 'Small Business Owner', type: 'business' as const, salary: 130 },
  { role: 'Community Nurse', type: 'hospital' as const, salary: 105 },
  { role: 'Software Developer', type: 'company' as const, salary: 160 },
  { role: 'Local Senator', type: 'government' as const, salary: 220 },
];

function pick<T>(items: T[], rand: () => number) {
  return items[Math.floor(rand() * items.length)] ?? items[0];
}

function oppositeGender(gender: Gender): Gender {
  return gender === 'female' ? 'male' : 'female';
}

function activePerson(world: WorldState) {
  return world.people[world.playerLineage.activePersonId] ?? null;
}

function hasPrimarySchool(person: Person) {
  return person.educationHistory.some((record) => record.stage === 'primary');
}

function findChildhoodFriend(world: WorldState, personId: PersonId) {
  const relationships = getRelationshipsForPerson(world, personId);
  const friendship = relationships.find((relationship) =>
    relationship.types.includes('friend') &&
    relationship.originLabel.toLowerCase().includes('primary school')
  );
  if (!friendship) return null;
  const friendId = friendship.personAId === personId ? friendship.personBId : friendship.personAId;
  return world.people[friendId] ?? null;
}

export function advanceWorldDays(world: WorldState, days: number) {
  world.currentDate = addDays(world.currentDate, Math.max(0, Math.round(days)));
  return world;
}

export function advanceWorldYears(world: WorldState, years: number) {
  const safeYears = Math.max(0, Math.round(years));
  world.currentDate = addYears(world.currentDate, safeYears);
  progressNpcCareers(world);
  world.milestones.push(`World advanced ${safeYears} year${safeYears === 1 ? '' : 's'} to ${world.currentDate.year}.`);
  return world;
}

function ensureInstitution(world: WorldState, type: Institution['type'], name: string) {
  const existing = Object.values(world.institutions).find((institution) => institution.type === type && institution.name === name);
  if (existing) return existing;

  const institution: Institution = {
    id: `${type}_${name.toLowerCase().replace(/[^a-z0-9]+/g, '_')}`,
    type,
    name,
    foundedDate: { year: world.currentDate.year - 12, month: 1, day: 1 },
    ownerIds: [],
    staffIds: [],
    studentIds: [],
    employeeIds: [],
    reputation: 50,
    wealth: 100000,
    metadata: {},
  };
  world.institutions[institution.id] = institution;
  return institution;
}

function assignCareer(world: WorldState, person: Person) {
  if (person.employmentHistory.length || ageInYears(person.birthDate, world.currentDate) < 18) return;

  const rand = seededRandom(`career:${world.seed}:${person.id}`);
  const career = person.traits.includes('popular') || person.stats.socialStatus > 60
    ? CAREERS[4]
    : person.traits.includes('kind')
      ? CAREERS[0]
      : pick(CAREERS, rand);

  const institution = ensureInstitution(world, career.type, career.role === 'Local Senator' ? 'City Assembly' : `${career.role} Workplace`);
  person.income = career.salary;
  person.stats.wealth += career.salary * 20;
  person.wealth = person.stats.wealth;
  person.stats.reputation = Math.min(100, person.stats.reputation + (career.role === 'Local Senator' ? 22 : 8));
  person.reputation = person.stats.reputation;
  person.employmentHistory.push({
    institutionId: institution.id,
    role: career.role,
    started: { ...world.currentDate },
    salary: career.salary,
    reputation: person.reputation,
  });
  institution.employeeIds.push(person.id);
  institution.staffIds.push(person.id);

  recordLifeEvent(world, {
    type: 'got_job',
    personIds: [person.id],
    locationId: institution.id,
    description: `${person.firstName} became a ${career.role}.`,
    consequences: ['Career history updated.', 'Reputation and income changed.'],
    tags: ['career', 'npc'],
    importantMemory: career.role === 'Local Senator',
    memoryTitle: `${person.firstName}'s career changed`,
  });
}

function progressNpcCareers(world: WorldState) {
  for (const person of Object.values(world.people)) {
    if (person.status === 'living') assignCareer(world, person);
  }
}

function createPartnerFor(world: WorldState, personId: PersonId) {
  const person = world.people[personId];
  if (!person) return null;
  if (person.spouseId) return world.people[person.spouseId] ?? null;

  const rand = seededRandom(`partner:${world.seed}:${personId}`);
  const gender = oppositeGender(person.gender);
  const firstName = pick(PARTNER_NAMES[gender], rand);
  const id = `partner_${firstName.toLowerCase()}_${Object.keys(world.people).length + 1}`;
  const traits: TraitId[] = rand() > 0.5 ? ['loyal', 'family_oriented'] : ['ambitious', 'kind'];
  const partner = makePerson({
    id,
    firstName,
    lastName: person.lastName,
    gender,
    birthDate: { year: person.birthDate.year + Math.floor(rand() * 3) - 1, month: 6, day: 15 },
    householdId: person.householdId,
    familyId: person.familyId,
    traits,
    stats: { empathy: 58, workEthic: 56, wealth: 1800 },
    wealth: 1800,
    income: 75,
  });

  world.people[id] = partner;
  world.households[person.householdId]?.memberIds.push(id);
  world.families[person.familyId]?.memberIds.push(id);
  person.partnerIds.push(id);
  partner.partnerIds.push(person.id);
  person.spouseId = id;
  partner.spouseId = person.id;

  upsertRelationship(world, person.id, partner.id, {
    types: ['spouse', 'romantic_partner'],
    origin: 'simulation',
    originLabel: 'formed a long-term partnership',
    date: world.currentDate,
    deltas: { closeness: 50, trust: 42, respect: 35, familiarity: 55 },
  });

  recordLifeEvent(world, {
    type: 'married',
    personIds: [person.id, partner.id],
    description: `${person.firstName} formed a family with ${partner.firstName}.`,
    consequences: ['Partner added to household.', 'Future children can inherit both parents.'],
    tags: ['family', 'partner'],
    importantMemory: true,
    memoryTitle: `${person.firstName} formed a family`,
  });

  return partner;
}

function ensurePrimarySchoolSlice(world: WorldState) {
  const player = activePerson(world);
  if (!player) return null;

  const age = ageInYears(player.birthDate, world.currentDate);
  if (age < 5) advanceWorldYears(world, 5 - age);
  if (!hasPrimarySchool(player)) startPrimarySchool(world);
  if (!findChildhoodFriend(world, player.id)) applyPrimarySchoolChoice(world, 'sit_quiet_lunch');
  return activePerson(world);
}

function ensureChildFor(world: WorldState, personId: PersonId, firstName: string) {
  const person = world.people[personId];
  if (!person) return null;
  const existingChild = person.childIds
    .map((id) => world.people[id])
    .find((child): child is Person => Boolean(child));
  if (existingChild) return existingChild;

  const partner = createPartnerFor(world, personId);
  if (!partner) return null;
  return createChild(world, personId, partner.id, { firstName, tags: ['lineage_demo'] });
}

export function continueAsChild(world: WorldState, childId: PersonId, markPreviousDead = true) {
  const previous = activePerson(world);
  const child = world.people[childId];
  if (!previous || !child || !child.parentIds.includes(previous.id)) return false;

  if (markPreviousDead && previous.status === 'living') {
    previous.status = 'dead';
    previous.deathDate = { ...world.currentDate };
    recordLifeEvent(world, {
      type: 'died',
      personIds: [previous.id, ...previous.childIds],
      description: `${previous.firstName} died, leaving the world state and family tree behind.`,
      consequences: ['The player lineage can continue through an eligible child.'],
      tags: ['death', 'lineage'],
      importantMemory: true,
      memoryTitle: `${previous.firstName} died`,
    });
  }

  world.playerLineage.previousPlayerIds.push(previous.id);
  world.playerLineage.activePersonId = child.id;
  world.playerLineage.generation += 1;

  const childhoodFriend = findChildhoodFriend(world, previous.id);
  if (childhoodFriend) {
    for (const friendChildId of childhoodFriend.childIds) {
      if (friendChildId === child.id) continue;
      const friendChild = world.people[friendChildId];
      if (!friendChild) continue;
      const parentNoun = previous.gender === 'female' ? 'mother' : 'father';
      const friendParentNoun = childhoodFriend.gender === 'female' ? 'mother' : 'father';
      upsertRelationship(world, child.id, friendChild.id, {
        types: ['generational_link'],
        origin: 'through_parent',
        originLabel: `your ${parentNoun} knew their ${friendParentNoun} from primary school`,
        date: world.currentDate,
        deltas: { familiarity: 45, trust: 12, respect: 12 },
        history: `${child.firstName} knows that ${friendChild.firstName}'s ${friendParentNoun} was ${previous.firstName}'s childhood friend.`,
      });
    }
  }

  recordLifeEvent(world, {
    type: 'continued_lineage',
    personIds: [previous.id, child.id],
    description: `The player continued as ${child.firstName}, preserving ${previous.firstName}'s relationships and memories.`,
    consequences: ['Active player changed.', 'Previous generation remains in world history.'],
    tags: ['lineage', 'generation'],
    importantMemory: true,
    memoryTitle: 'Continued as the next generation',
  });
  world.milestones.push(`Lineage continued as ${child.firstName}.`);
  return true;
}

export function runGenerationalDemo(world: WorldState) {
  const player = ensurePrimarySchoolSlice(world);
  if (!player) return false;

  let friend = findChildhoodFriend(world, player.id);
  if (!friend) return false;

  const playerAge = ageInYears(player.birthDate, world.currentDate);
  if (playerAge < 30) advanceWorldYears(world, 30 - playerAge);

  progressNpcCareers(world);
  friend = findChildhoodFriend(world, player.id) ?? friend;

  const playerChild = ensureChildFor(world, player.id, player.gender === 'female' ? 'Nora' : 'Noah');
  const friendChild = ensureChildFor(world, friend.id, friend.gender === 'female' ? 'Mina' : 'Malik');
  if (!playerChild || !friendChild) return false;

  const childAge = ageInYears(playerChild.birthDate, world.currentDate);
  if (childAge < 52) advanceWorldYears(world, 52 - childAge);

  continueAsChild(world, playerChild.id, true);
  return true;
}
