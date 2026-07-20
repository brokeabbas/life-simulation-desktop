import { applyWorldChoice } from '../choices/choiceEngine';
import { recordLifeEvent } from '../lifeEvents/lifeEvents';
import { upsertRelationship } from '../relationships/relationships';
import { seededRandom } from '../rng';
import type { Gender, TraitId } from '../types';
import { makePerson } from '../world/generation';
import type {
  Family,
  Household,
  Institution,
  Person,
  PersonId,
  SchoolSubject,
  WorldChoice,
  WorldState,
} from '../world/types';

const CLASSMATE_FIRST_NAMES: Record<Gender, string[]> = {
  female: ['Leila', 'Hana', 'Esi', 'Amara', 'Mina', 'Layla'],
  male: ['Samir', 'Tobi', 'Ike', 'Nadir', 'Jude', 'Rafi'],
};

const CLASSMATE_LAST_NAMES = ['Balogun', 'Okeke', 'Hassan', 'Mensah', 'Abubakar', 'Cole'];

const SUBJECTS: SchoolSubject[] = [
  'Mathematics',
  'English',
  'Science',
  'History',
  'Arts',
  'Physical Education',
  'Civic Education',
  'Computer Studies',
];

function pick<T>(items: T[], rand: () => number) {
  return items[Math.floor(rand() * items.length)] ?? items[0];
}

function addNpcHousehold(world: WorldState, lastName: string, memberId: PersonId) {
  const familyId = `family_${lastName.toLowerCase()}_${memberId}`;
  const householdId = `household_${lastName.toLowerCase()}_${memberId}`;

  const family: Family = {
    id: familyId,
    name: `${lastName} family`,
    memberIds: [memberId],
    reputation: 40,
    wealth: 1200,
    trauma: 0,
    memoryEventIds: [],
  };

  const household: Household = {
    id: householdId,
    name: `${lastName} household`,
    memberIds: [memberId],
    familyId,
    wealth: family.wealth,
    addressLabel: 'a nearby home',
  };

  world.families[familyId] = family;
  world.households[householdId] = household;
  return { familyId, householdId };
}

function addSchoolNpc(
  world: WorldState,
  input: {
    id: PersonId;
    firstName: string;
    lastName: string;
    gender: Gender;
    birthYear: number;
    traits: TraitId[];
    role: 'classmate' | 'teacher';
  },
) {
  const { familyId, householdId } = addNpcHousehold(world, input.lastName, input.id);
  const person = makePerson({
    id: input.id,
    firstName: input.firstName,
    lastName: input.lastName,
    gender: input.gender,
    birthDate: { year: input.birthYear, month: input.role === 'teacher' ? 3 : 1, day: input.role === 'teacher' ? 9 : 1 },
    householdId,
    familyId,
    traits: input.traits,
    stats: input.role === 'teacher'
      ? { intellect: 70, communication: 70, discipline: 68, reputation: 58, wealth: 4200 }
      : { academicAbility: 38 + input.firstName.length * 2, social: 42, wealth: 0 },
    wealth: input.role === 'teacher' ? 4200 : 0,
    income: input.role === 'teacher' ? 85 : 0,
  });

  world.people[person.id] = person;
  return person;
}

export function startPrimarySchool(world: WorldState) {
  const player = world.people[world.playerLineage.activePersonId];
  if (!player) return null;

  const existing = player.educationHistory.find((record) => record.stage === 'primary');
  if (existing) return world.institutions[existing.institutionId] ?? null;

  const rand = seededRandom(`school:${world.seed}:${player.id}`);
  const schoolId = `school_primary_${world.seed.replace(/[^a-z0-9]+/gi, '_').toLowerCase()}`;
  const teacherLastName = pick(CLASSMATE_LAST_NAMES, rand);
  const teacher = addSchoolNpc(world, {
    id: `teacher_${teacherLastName.toLowerCase()}_${Object.keys(world.people).length}`,
    firstName: pick(CLASSMATE_FIRST_NAMES.female, rand),
    lastName: teacherLastName,
    gender: 'female',
    birthYear: world.currentDate.year - 34,
    traits: ['kind', 'hardworking'],
    role: 'teacher',
  });

  const classmates: Person[] = [];
  for (let i = 0; i < 7; i += 1) {
    const gender: Gender = i % 2 === 0 ? 'female' : 'male';
    const lastName = pick(CLASSMATE_LAST_NAMES, rand);
    const firstName = pick(CLASSMATE_FIRST_NAMES[gender], rand);
    const traits: TraitId[] =
      i === 0 ? ['kind', 'anxious'] :
      i === 1 ? ['popular', 'charismatic'] :
      i === 2 ? ['rebellious', 'impulsive'] :
      rand() > 0.5 ? ['hardworking'] : ['loyal'];

    classmates.push(addSchoolNpc(world, {
      id: `classmate_${i}_${firstName.toLowerCase()}_${lastName.toLowerCase()}`,
      firstName,
      lastName,
      gender,
      birthYear: player.birthDate.year,
      traits,
      role: 'classmate',
    }));
  }

  const institution: Institution = {
    id: schoolId,
    type: 'school',
    name: 'Unity Primary School',
    foundedDate: { year: 1988, month: 9, day: 1 },
    ownerIds: [],
    staffIds: [teacher.id],
    studentIds: [player.id, ...classmates.map((person) => person.id)],
    employeeIds: [teacher.id],
    reputation: 52,
    wealth: 80000,
    metadata: {
      stage: 'primary',
      neighborhood: 'home district',
    },
  };

  world.institutions[schoolId] = institution;

  const classmateIds = classmates.map((person) => person.id);
  const educationRecord = {
    institutionId: schoolId,
    stage: 'primary' as const,
    started: { ...world.currentDate },
    subjects: SUBJECTS,
    teacherIds: [teacher.id],
    classmateIds,
    performance: player.stats.academicAbility,
  };

  player.educationHistory.push(educationRecord);
  for (const classmate of classmates) {
    classmate.educationHistory.push({
      ...educationRecord,
      classmateIds: [player.id, ...classmateIds.filter((id) => id !== classmate.id)],
      performance: classmate.stats.academicAbility,
    });
  }
  teacher.employmentHistory.push({
    institutionId: schoolId,
    role: 'Primary Teacher',
    started: { ...world.currentDate },
    salary: teacher.income,
    reputation: 55,
  });

  upsertRelationship(world, player.id, teacher.id, {
    types: ['teacher'],
    origin: 'primary_school',
    originLabel: 'primary school teacher',
    date: world.currentDate,
    deltas: { respect: 38, familiarity: 28 },
  });

  for (const classmate of classmates) {
    upsertRelationship(world, player.id, classmate.id, {
      types: ['classmate'],
      origin: 'primary_school',
      originLabel: 'met in primary school',
      date: world.currentDate,
      deltas: { familiarity: 35, respect: 10 },
    });
  }

  recordLifeEvent(world, {
    type: 'started_school',
    personIds: [player.id, teacher.id, ...classmateIds],
    locationId: schoolId,
    description: `${player.firstName} started primary school at ${institution.name} with ${classmates.length} persistent classmates.`,
    consequences: ['Primary education began.', 'Classmate relationships were created in the graph.'],
    tags: ['school', 'primary', 'classmates'],
    importantMemory: true,
    memoryTitle: 'First day of primary school',
  });

  world.milestones.push(`${player.firstName} started primary school and met ${classmates[0]?.firstName}.`);
  return institution;
}

function currentPrimaryClassmates(world: WorldState) {
  const player = world.people[world.playerLineage.activePersonId];
  const primary = player?.educationHistory.find((record) => record.stage === 'primary');
  if (!primary) return [];
  return primary.classmateIds
    .map((id) => world.people[id])
    .filter((person): person is Person => Boolean(person));
}

export function getPrimarySchoolChoices(world: WorldState): WorldChoice[] {
  const player = world.people[world.playerLineage.activePersonId];
  if (!player?.educationHistory.some((record) => record.stage === 'primary')) return [];

  const classmates = currentPrimaryClassmates(world);
  const quietStudent = classmates.find((person) => person.traits.includes('anxious')) ?? classmates[0];
  const popularStudent = classmates.find((person) => person.traits.includes('popular')) ?? classmates[1];
  const rebelliousStudent = classmates.find((person) => person.traits.includes('rebellious')) ?? classmates[2];

  return [
    {
      id: 'study_maths',
      title: 'Study mathematics after class',
      description: 'Build academic ability and discipline, with less social time.',
      statEffects: { academicAbility: 6, intellect: 3, discipline: 2, social: -1, energy: -2 },
      relationshipEffects: {},
      memoryTitle: 'Studied hard in primary school',
      memoryDescription: `${player.firstName} stayed after class to study mathematics.`,
      tags: ['school', 'study', 'academic'],
    },
    {
      id: 'sit_quiet_lunch',
      title: `Sit with ${quietStudent?.firstName ?? 'the quiet student'} at lunch`,
      description: 'Turn a classmate into a real childhood friend.',
      eventType: 'met_friend',
      targetPersonId: quietStudent?.id,
      relationshipTypes: ['classmate', 'friend'],
      statEffects: { empathy: 3, social: 2, happiness: 2 },
      relationshipEffects: { closeness: 42, trust: 36, respect: 18, familiarity: 28 },
      memoryTitle: 'A childhood friendship began',
      memoryDescription: `${player.firstName} became friends with ${quietStudent?.firstName ?? 'a classmate'} during primary school lunch.`,
      tags: ['school', 'friend', 'memory'],
    },
    {
      id: 'play_sports',
      title: `Play sports with ${popularStudent?.firstName ?? 'the popular group'}`,
      description: 'Gain fitness and popularity while sacrificing study time.',
      targetPersonId: popularStudent?.id,
      relationshipTypes: ['classmate'],
      statEffects: { physicalFitness: 6, fitness: 4, social: 4, socialStatus: 3, academicAbility: -1 },
      relationshipEffects: { closeness: 10, respect: 8, familiarity: 12 },
      memoryTitle: 'Joined the school games',
      memoryDescription: `${player.firstName} played sports with ${popularStudent?.firstName ?? 'classmates'} after lessons.`,
      tags: ['school', 'sports', 'popularity'],
    },
    {
      id: 'stand_up_bully',
      title: `Stand up to ${rebelliousStudent?.firstName ?? 'a bully'}`,
      description: 'Build confidence but create conflict.',
      targetPersonId: rebelliousStudent?.id,
      relationshipTypes: ['classmate', 'rival'],
      statEffects: { confidence: 4, morality: 2, stress: 2, reputation: 1 },
      relationshipEffects: { conflict: 22, respect: 10, familiarity: 10 },
      memoryTitle: 'Stood up for yourself',
      memoryDescription: `${player.firstName} stood up to ${rebelliousStudent?.firstName ?? 'a difficult classmate'} in primary school.`,
      tags: ['school', 'conflict', 'reputation'],
    },
  ];
}

export function applyPrimarySchoolChoice(world: WorldState, choiceId: string) {
  const choice = getPrimarySchoolChoices(world).find((candidate) => candidate.id === choiceId);
  if (!choice) return false;
  return applyWorldChoice(world, choice);
}
