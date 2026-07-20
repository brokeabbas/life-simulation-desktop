import { recordLifeEvent } from '../lifeEvents/lifeEvents';
import { upsertRelationship } from '../relationships/relationships';
import { seededRandom } from '../rng';
import type { Gender, StatBlock, StatKey, TraitId } from '../types';
import { addDays, ageInYears, formatSimDate } from '../world/date';
import { makePerson } from '../world/generation';
import { getActivePerson, fullName } from '../world/selectors';
import type {
  Family,
  Household,
  Institution,
  Person,
  RelationshipType,
  SchoolSubject,
  WorldState,
} from '../world/types';
import type {
  ClassmateArchetype,
  EducationChoice,
  EducationClassmate,
  EducationClubId,
  EducationEventCategory,
  EducationLevel,
  EducationOutcome,
  EducationOutcomeId,
  EducationSchool,
  EducationState,
  EducationSubjectId,
  ExamResult,
  FriendGroup,
  SchoolEvent,
  StudentEducationProfile,
  SubjectPerformance,
} from './types';
import { createDefaultClubs, createEmptyEducationState } from './educationState';
import { SUBJECT_CATALOG } from './types';

const TEACHER_FIRST_NAMES: Record<Gender, string[]> = {
  female: ['Aisha', 'Nadia', 'Grace', 'Mariam', 'Elena', 'Fatima'],
  male: ['Ibrahim', 'Samuel', 'Daniel', 'Kelechi', 'Omar', 'Joseph'],
};

const CLASSMATE_FIRST_NAMES: Record<Gender, string[]> = {
  female: ['Leila', 'Hana', 'Esi', 'Amara', 'Mina', 'Layla', 'Zainab', 'Tara'],
  male: ['Samir', 'Tobi', 'Ike', 'Nadir', 'Jude', 'Rafi', 'Malik', 'Noah'],
};

const LAST_NAMES = ['Balogun', 'Okeke', 'Hassan', 'Mensah', 'Abubakar', 'Cole', 'Lawal', 'Bello', 'Adeyemi', 'Khan'];

const SUBJECT_TO_WORLD: Record<EducationSubjectId, SchoolSubject> = {
  mathematics: 'Mathematics',
  english: 'English',
  science: 'Science',
  computer_studies: 'Computer Studies',
  business_studies: 'Business Studies',
  government_civic: 'Government / Civic Education',
  art: 'Art',
  physical_education: 'Physical Education',
};

const LEVEL_LABEL: Record<EducationLevel, string> = {
  preschool: 'Preschool',
  primary: 'Primary School',
  junior_secondary: 'Junior Secondary School',
  senior_secondary: 'Senior Secondary School',
  graduated: 'Graduated',
};

const EDUCATION_OUTCOMES: Record<EducationOutcomeId, Omit<EducationOutcome, 'score'>> = {
  university_scholarship: {
    id: 'university_scholarship',
    title: 'University and scholarship track',
    description: 'Strong grades and a clean behavior record unlocked university, scholarships, and high-trust recommendations.',
    unlockedOptions: ['University admission', 'Scholarship applications', 'Teacher recommendations', 'High-skill career paths'],
  },
  university_reputation_issues: {
    id: 'university_reputation_issues',
    title: 'University track with reputation issues',
    description: 'Strong grades opened academic doors, but poor behavior created recommendation and trust problems.',
    unlockedOptions: ['University admission', 'Conditional scholarship interviews', 'Reputation repair choices'],
  },
  average_flexible_paths: {
    id: 'average_flexible_paths',
    title: 'Flexible average-grades track',
    description: 'Average results left several routes open: lower-tier university, polytechnic, vocational training, direct work, or retakes.',
    unlockedOptions: ['Polytechnic', 'Vocational training', 'Lower-tier university', 'Entry-level work'],
  },
  poor_grades_alternative_path: {
    id: 'poor_grades_alternative_path',
    title: 'Alternative path after poor grades',
    description: 'Poor school results pushed the character toward repeat exams, apprenticeship, informal work, or self-learning.',
    unlockedOptions: ['Repeat final exams', 'Apprenticeship', 'Informal work', 'Self-learning route'],
  },
  special_talent_path: {
    id: 'special_talent_path',
    title: 'Special talent opportunity track',
    description: 'A standout talent created a non-traditional opportunity through sports, art, music, tech, or business.',
    unlockedOptions: ['Talent scholarship', 'Competition route', 'Portfolio path', 'Early specialist training'],
  },
};

type SchoolEventTemplate = {
  id: string;
  title: string;
  category: EducationEventCategory;
  important: boolean;
  tags: string[];
  condition: (world: WorldState, profile: StudentEducationProfile) => boolean;
  description: (world: WorldState, profile: StudentEducationProfile) => string;
  consequence: (world: WorldState, profile: StudentEducationProfile) => string;
  apply?: (world: WorldState, profile: StudentEducationProfile) => void;
};

const CLASSMATE_ARCHETYPES: {
  archetype: ClassmateArchetype;
  familyBackground: string;
  friendGroup: FriendGroup;
  interests: string[];
  traits: TraitId[];
  futurePotential: string;
  academicAbility: number;
  popularity: number;
  confidence: number;
  behaviorRecord: number;
  relationship: number;
  rivalry: number;
  bullyingTendency: number;
  loyalty: number;
  jealousy: number;
  influence: number;
}[] = [
  {
    archetype: 'best_friend_potential',
    familyBackground: 'steady home, emotionally loyal',
    friendGroup: 'quiet_kids',
    interests: ['books', 'games', 'helping friends'],
    traits: ['kind', 'loyal'],
    futurePotential: 'reliable adult friend or family contact',
    academicAbility: 58,
    popularity: 42,
    confidence: 48,
    behaviorRecord: 76,
    relationship: 42,
    rivalry: 4,
    bullyingTendency: 0,
    loyalty: 82,
    jealousy: 14,
    influence: 42,
  },
  {
    archetype: 'academic_rival',
    familyBackground: 'ambitious home with heavy expectations',
    friendGroup: 'studious',
    interests: ['science fairs', 'rankings', 'debate'],
    traits: ['ambitious', 'intelligent'],
    futurePotential: 'future professional rival or high-status contact',
    academicAbility: 76,
    popularity: 48,
    confidence: 66,
    behaviorRecord: 72,
    relationship: 24,
    rivalry: 50,
    bullyingTendency: 4,
    loyalty: 24,
    jealousy: 56,
    influence: 52,
  },
  {
    archetype: 'bully',
    familyBackground: 'unstable home, uses fear for status',
    friendGroup: 'troublemaker',
    interests: ['control', 'showing off', 'street jokes'],
    traits: ['rebellious', 'violent'],
    futurePotential: 'could become an enemy, rival, or redeemed contact',
    academicAbility: 38,
    popularity: 58,
    confidence: 70,
    behaviorRecord: 24,
    relationship: 12,
    rivalry: 62,
    bullyingTendency: 82,
    loyalty: 16,
    jealousy: 44,
    influence: 64,
  },
  {
    archetype: 'popular_student',
    familyBackground: 'socially connected family',
    friendGroup: 'popular',
    interests: ['parties', 'leadership', 'fashion'],
    traits: ['popular', 'charismatic'],
    futurePotential: 'future media, politics, sales, or social contact',
    academicAbility: 54,
    popularity: 86,
    confidence: 78,
    behaviorRecord: 58,
    relationship: 22,
    rivalry: 16,
    bullyingTendency: 18,
    loyalty: 34,
    jealousy: 48,
    influence: 78,
  },
  {
    archetype: 'quiet_smart_student',
    familyBackground: 'calm home, spends time alone',
    friendGroup: 'quiet_kids',
    interests: ['mathematics', 'programming', 'library'],
    traits: ['introvert', 'intelligent'],
    futurePotential: 'future tech, research, or academic contact',
    academicAbility: 82,
    popularity: 28,
    confidence: 38,
    behaviorRecord: 82,
    relationship: 30,
    rivalry: 12,
    bullyingTendency: 0,
    loyalty: 68,
    jealousy: 18,
    influence: 42,
  },
  {
    archetype: 'troublemaker',
    familyBackground: 'chaotic home, attention-seeking',
    friendGroup: 'troublemaker',
    interests: ['pranks', 'skipping class', 'rumors'],
    traits: ['impulsive', 'rebellious'],
    futurePotential: 'could become a risky friend or street-smart contact',
    academicAbility: 42,
    popularity: 64,
    confidence: 72,
    behaviorRecord: 20,
    relationship: 18,
    rivalry: 20,
    bullyingTendency: 28,
    loyalty: 28,
    jealousy: 36,
    influence: 74,
  },
  {
    archetype: 'rich_student',
    familyBackground: 'wealthy family with private tutors',
    friendGroup: 'rich_kids',
    interests: ['gadgets', 'travel', 'status'],
    traits: ['popular', 'greedy'],
    futurePotential: 'future business or elite network contact',
    academicAbility: 60,
    popularity: 72,
    confidence: 76,
    behaviorRecord: 56,
    relationship: 18,
    rivalry: 24,
    bullyingTendency: 14,
    loyalty: 24,
    jealousy: 50,
    influence: 70,
  },
  {
    archetype: 'poor_hardworking_student',
    familyBackground: 'low-income family, highly determined',
    friendGroup: 'studious',
    interests: ['scholarships', 'homework', 'helping family'],
    traits: ['hardworking', 'kind'],
    futurePotential: 'future scholarship peer or dependable ally',
    academicAbility: 68,
    popularity: 34,
    confidence: 48,
    behaviorRecord: 86,
    relationship: 34,
    rivalry: 8,
    bullyingTendency: 0,
    loyalty: 74,
    jealousy: 12,
    influence: 46,
  },
  {
    archetype: 'athlete',
    familyBackground: 'sports-focused home',
    friendGroup: 'sports',
    interests: ['football', 'fitness', 'competition'],
    traits: ['hardworking', 'popular'],
    futurePotential: 'future sports, security, or fitness contact',
    academicAbility: 48,
    popularity: 76,
    confidence: 78,
    behaviorRecord: 62,
    relationship: 24,
    rivalry: 18,
    bullyingTendency: 10,
    loyalty: 46,
    jealousy: 22,
    influence: 72,
  },
  {
    archetype: 'class_clown',
    familyBackground: 'warm home, hides insecurity with jokes',
    friendGroup: 'creative',
    interests: ['jokes', 'drama', 'music'],
    traits: ['charismatic', 'impulsive'],
    futurePotential: 'future entertainer, media friend, or distracting peer',
    academicAbility: 44,
    popularity: 70,
    confidence: 62,
    behaviorRecord: 38,
    relationship: 28,
    rivalry: 10,
    bullyingTendency: 6,
    loyalty: 42,
    jealousy: 24,
    influence: 64,
  },
];

const EVENT_TEMPLATES: SchoolEventTemplate[] = [
  {
    id: 'teacher_notices_math_talent',
    title: 'A teacher notices your talent in Mathematics',
    category: 'academic',
    important: true,
    tags: ['teacher', 'mathematics', 'talent'],
    condition: (_world, profile) => profile.subjects.mathematics.understanding >= 62,
    description: (_world, profile) => `Your Mathematics teacher asks you to solve a hard problem in front of ${profile.className}.`,
    consequence: () => 'Academic confidence and teacher reputation rose.',
    apply: (_world, profile) => {
      profile.academicConfidence = clamp100(profile.academicConfidence + 4);
      profile.teacherReputation = clamp100(profile.teacherReputation + 4);
      profile.subjects.mathematics.interest = clamp100(profile.subjects.mathematics.interest + 5);
    },
  },
  {
    id: 'friend_asks_skip_class',
    title: 'Your friend asks you to skip class',
    category: 'friend',
    important: false,
    tags: ['friend', 'discipline', 'peer_pressure'],
    condition: (world, profile) => Boolean(findClassmate(world.education, profile, 'best_friend_potential')) && profile.attendance > 70,
    description: (world, profile) => {
      const friend = findClassmate(world.education, profile, 'best_friend_potential');
      return `${friend?.name ?? 'A friend'} wants you to miss the next lesson and hang around outside school.`;
    },
    consequence: () => 'A peer-pressure choice is now part of this term story.',
  },
  {
    id: 'bully_mocks_background',
    title: 'A bully mocks your family background',
    category: 'bullying',
    important: true,
    tags: ['bullying', 'confidence', 'conflict'],
    condition: (_world, profile) => profile.bullyingRisk >= 45,
    description: (world, profile) => {
      const bully = findClassmate(world.education, profile, 'bully');
      return `${bully?.name ?? 'A bully'} makes a loud joke about your family during break.`;
    },
    consequence: () => 'Stress rose and confidence was tested.',
    apply: (_world, profile) => {
      profile.bullyingRisk = clamp100(profile.bullyingRisk + 5);
      profile.academicConfidence = clamp100(profile.academicConfidence - 3);
    },
  },
  {
    id: 'school_fees_pressure',
    title: 'Your parents cannot afford school fees this term',
    category: 'finance',
    important: true,
    tags: ['fees', 'family', 'stress'],
    condition: (world, profile) => {
      const school = profile.currentSchoolId ? world.education.schools[profile.currentSchoolId] : null;
      const active = getActivePerson(world);
      const family = active ? world.families[active.familyId] : null;
      return Boolean(school && school.tuition > 0 && (family?.wealth ?? 0) < school.tuition * 2);
    },
    description: () => 'School fees become a tense topic at home before the new term begins.',
    consequence: () => 'Stress increased, but scholarship motivation improved.',
    apply: (_world, profile) => {
      profile.examReadiness = clamp100(profile.examReadiness + 2);
      profile.academicConfidence = clamp100(profile.academicConfidence - 2);
    },
  },
  {
    id: 'debate_competition',
    title: 'A debate competition is announced',
    category: 'competition',
    important: false,
    tags: ['debate', 'competition', 'confidence'],
    condition: (_world, profile) => profile.clubMembershipIds.includes('debate_club') || profile.subjects.english.interest >= 60,
    description: () => 'The English department announces a debate competition with a small award for finalists.',
    consequence: () => 'Debate and leadership choices became more valuable.',
  },
  {
    id: 'copy_homework_request',
    title: 'A classmate asks to copy your homework',
    category: 'social',
    important: false,
    tags: ['homework', 'friendship', 'discipline'],
    condition: (_world, profile) => profile.homeworkCompletion >= 60,
    description: (world, profile) => {
      const classmate = findAnyClassmate(world.education, profile);
      return `${classmate?.name ?? 'A classmate'} asks to copy your homework before assembly.`;
    },
    consequence: () => 'This can build friendship or hurt discipline if you choose badly.',
  },
  {
    id: 'popular_group_invite',
    title: 'A popular group invites you to sit with them',
    category: 'social',
    important: false,
    tags: ['popular', 'status', 'peer_pressure'],
    condition: (_world, profile) => profile.popularity >= 50,
    description: (world, profile) => {
      const popular = findClassmate(world.education, profile, 'popular_student');
      return `${popular?.name ?? 'A popular student'} waves you over during lunch.`;
    },
    consequence: () => 'Popularity can rise, but peer pressure follows.',
  },
  {
    id: 'accused_of_cheating',
    title: 'You are accused of cheating',
    category: 'discipline',
    important: true,
    tags: ['cheating', 'discipline', 'teacher'],
    condition: (_world, profile) => profile.behaviorRecord < 45 || profile.teacherReputation < 35,
    description: () => 'A teacher questions whether your recent work is really yours.',
    consequence: () => 'Teacher trust became fragile.',
    apply: (_world, profile) => {
      profile.teacherReputation = clamp100(profile.teacherReputation - 4);
    },
  },
  {
    id: 'favorite_teacher_leaves',
    title: 'Your favorite teacher leaves the school',
    category: 'teacher',
    important: true,
    tags: ['teacher', 'memory', 'change'],
    condition: (world, profile) => profile.teacherIds.some((id) => (world.education.teachers[id]?.relationship ?? 0) >= 70),
    description: () => 'A teacher who believed in you announces they are leaving after the term.',
    consequence: () => 'The moment became a lasting school memory.',
  },
  {
    id: 'friend_jealous_success',
    title: 'Your best friend becomes jealous of your success',
    category: 'friend',
    important: true,
    tags: ['friendship', 'jealousy', 'grades'],
    condition: (world, profile) => {
      const friend = findClassmate(world.education, profile, 'best_friend_potential');
      return Boolean(friend && profile.academicPerformance >= 72 && friend.jealousy >= 14);
    },
    description: (world, profile) => {
      const friend = findClassmate(world.education, profile, 'best_friend_potential');
      return `${friend?.name ?? 'Your friend'} becomes quiet after your name appears near the top of the class list.`;
    },
    consequence: () => 'Friendship now needs attention, not just grades.',
  },
  {
    id: 'fail_subject_response',
    title: 'You fail a subject and must decide how to respond',
    category: 'exam',
    important: true,
    tags: ['failure', 'exam', 'resilience'],
    condition: (_world, profile) => Object.values(profile.subjects).some((subject) => subject.currentGrade < 45),
    description: (_world, profile) => {
      const weak = weakestSubject(profile);
      return `${weak.label} is dragging your report card down.`;
    },
    consequence: () => 'Weak-subject choices matter more now.',
  },
  {
    id: 'win_school_award',
    title: 'You win an award and gain confidence',
    category: 'opportunity',
    important: true,
    tags: ['award', 'confidence', 'reputation'],
    condition: (world, profile) => profile.academicPerformance >= 78 || Object.values(world.education.clubs).some((club) => club.joined && club.participation >= 72),
    description: () => 'Your name is called during assembly for a school award.',
    consequence: () => 'Confidence, reputation, and future recommendations improved.',
    apply: (_world, profile) => {
      profile.awards.push(uniqueLabel(profile.awards, 'School award'));
      profile.academicConfidence = clamp100(profile.academicConfidence + 5);
      profile.teacherReputation = clamp100(profile.teacherReputation + 3);
    },
  },
  {
    id: 'parent_pressure_science',
    title: 'Your parent pressures you to choose science subjects',
    category: 'parent',
    important: false,
    tags: ['parent', 'science', 'career'],
    condition: (_world, profile) => profile.level !== 'primary' && (profile.subjects.science.currentGrade >= 58 || profile.subjects.mathematics.currentGrade >= 58),
    description: () => 'At home, a parent talks about medicine, engineering, and the respect of science careers.',
    consequence: () => 'Career pressure entered your school story.',
  },
  {
    id: 'scholarship_interview',
    title: 'You are offered a scholarship interview',
    category: 'opportunity',
    important: true,
    tags: ['scholarship', 'opportunity', 'grades'],
    condition: (world, profile) => {
      const school = profile.currentSchoolId ? world.education.schools[profile.currentSchoolId] : null;
      return Boolean(school && checkScholarshipEligibility(profile, school));
    },
    description: () => 'A teacher tells you to prepare for a scholarship interview.',
    consequence: () => 'Scholarship options became visible.',
    apply: (_world, profile) => {
      if (!profile.scholarships.includes('Scholarship interview')) profile.scholarships.push('Scholarship interview');
    },
  },
  {
    id: 'teen_crush',
    title: 'You develop a crush on a classmate',
    category: 'romance',
    important: false,
    tags: ['teen', 'romance', 'social'],
    condition: (_world, profile) => profile.level === 'senior_secondary' && profile.popularity >= 45,
    description: (world, profile) => {
      const classmate = findAnyClassmate(world.education, profile);
      return `You start noticing ${classmate?.name ?? 'a classmate'} in a way that makes school feel more complicated.`;
    },
    consequence: () => 'Social choices may affect happiness and focus.',
  },
  {
    id: 'selected_prefect',
    title: 'You are selected as class prefect',
    category: 'opportunity',
    important: true,
    tags: ['leadership', 'teacher', 'reputation'],
    condition: (_world, profile) => profile.behaviorRecord >= 75 && profile.teacherReputation >= 68,
    description: () => 'Teachers discuss your behavior and select you for a class leadership role.',
    consequence: () => 'Leadership improved future politics, business, and scholarship paths.',
    apply: (_world, profile) => {
      if (!profile.leadershipRoles.includes('Class Prefect')) profile.leadershipRoles.push('Class Prefect');
      profile.popularity = clamp100(profile.popularity + 3);
    },
  },
  {
    id: 'unfair_punishment',
    title: 'You are punished for something you did not do',
    category: 'discipline',
    important: true,
    tags: ['unfair', 'discipline', 'teacher'],
    condition: (world, profile) => {
      const school = profile.currentSchoolId ? world.education.schools[profile.currentSchoolId] : null;
      return Boolean(school && school.corruptionLevel >= 28 && profile.behaviorRecord >= 45);
    },
    description: () => 'A teacher blames you for noise made by another student.',
    consequence: () => 'Trust in authority was tested.',
    apply: (_world, profile) => {
      profile.teacherReputation = clamp100(profile.teacherReputation - 2);
      profile.academicConfidence = clamp100(profile.academicConfidence - 2);
    },
  },
  {
    id: 'friend_being_bullied',
    title: 'A friend is being bullied and asks for help',
    category: 'bullying',
    important: true,
    tags: ['friend', 'bullying', 'morality'],
    condition: (world, profile) => Boolean(findClassmate(world.education, profile, 'best_friend_potential')) && profile.bullyingRisk >= 28,
    description: (world, profile) => {
      const friend = findClassmate(world.education, profile, 'best_friend_potential');
      return `${friend?.name ?? 'Your friend'} quietly asks you what to do about a bully.`;
    },
    consequence: () => 'Friendship and courage choices became more meaningful.',
  },
  {
    id: 'football_team_invite',
    title: 'You are invited to join the school football team',
    category: 'club',
    important: false,
    tags: ['sports', 'fitness', 'popularity'],
    condition: (world, profile) => {
      const active = getActivePerson(world);
      return Boolean(active && (active.stats.fitness >= 54 || active.stats.physicalFitness >= 54 || profile.popularity >= 55));
    },
    description: () => 'The sports captain asks whether you want to train with the team.',
    consequence: () => 'Sports participation can become a serious path.',
  },
  {
    id: 'discover_programming',
    title: 'You discover you enjoy programming',
    category: 'academic',
    important: true,
    tags: ['computer', 'tech', 'career_interest'],
    condition: (_world, profile) => profile.subjects.computer_studies.interest >= 60 || profile.subjects.computer_studies.understanding >= 60,
    description: () => 'A simple computer exercise suddenly makes logic feel exciting instead of abstract.',
    consequence: () => 'Tech career interest unlocked.',
    apply: (_world, profile) => addCareerInterest(profile, 'technology'),
  },
];

export function ensureEducationState(world: WorldState) {
  const target = world as WorldState & { education?: EducationState | null };
  if (!target.education) {
    target.education = createEmptyEducationState();
  }

  if (!target.education.clubs) {
    target.education.clubs = createDefaultClubs();
  } else {
    const fresh = createDefaultClubs();
    for (const [id, club] of Object.entries(fresh)) {
      const clubId = id as EducationClubId;
      const existing = target.education.clubs[clubId];
      if (!existing) {
        target.education.clubs[clubId] = club;
      } else if (!existing.skillBenefits || !existing.subjectBoosts || !existing.statBoosts) {
        target.education.clubs[clubId] = { ...club, ...existing };
      }
    }
  }

  target.education.schools ??= {};
  target.education.teachers ??= {};
  target.education.classmates ??= {};
  target.education.eventLog ??= [];
  target.education.generatedEventIds ??= [];
  target.education.examHistory ??= [];
  target.education.outcomes ??= [];
  return target.education;
}

export function enrollActiveStudent(world: WorldState) {
  const education = ensureEducationState(world);
  const active = getActivePerson(world);
  if (!active) return false;

  if (education.activeProfile && education.activeProfile.studentPersonId === active.id) return true;

  const level: EducationLevel = ageInYears(active.birthDate, world.currentDate) < 5 ? 'preschool' : 'primary';
  const school = generateSchoolForCharacter(world, active, level);
  const teacherIds = generateTeachers(world, education, school, level);
  const classmateIds = generateClassmates(world, education, school, active, level);
  const subjects = createInitialSubjects(world, active, teacherIds);
  const profile = createInitialProfile(active, school, level, teacherIds, classmateIds, subjects);

  education.activeProfile = profile;
  syncSchoolRelationships(world, profile);
  syncEducationHistory(world, profile);
  recalculateProfile(world, profile);

  recordLifeEvent(world, {
    type: 'started_school',
    personIds: [
      active.id,
      ...profile.classmateIds
        .map((id) => education.classmates[id]?.personId)
        .filter((id): id is string => Boolean(id)),
    ],
    locationId: school.id,
    description: `${fullName(active)} started ${LEVEL_LABEL[level].toLowerCase()} at ${school.name}.`,
    consequences: [
      `${profile.classmateIds.length} classmates and ${profile.teacherIds.length} teachers now exist as persistent NPCs.`,
      'Subjects, clubs, school reputation, behavior, popularity, bullying risk, and exam readiness are now tracked.',
    ],
    tags: ['education', 'school', school.type, level],
    importantMemory: true,
    memoryTitle: `First day at ${school.name}`,
  });

  profile.schoolMemories.push(`Started ${LEVEL_LABEL[level].toLowerCase()} at ${school.name}.`);
  world.milestones.push(`${active.firstName} started ${LEVEL_LABEL[level].toLowerCase()} at ${school.name}.`);
  generateNextSchoolEvent(world, profile);
  return true;
}

export function getEducationChoices(world: WorldState): EducationChoice[] {
  const education = (world as WorldState & { education?: EducationState | null }).education;
  if (!education) return [];
  const profile = education.activeProfile;
  if (!profile || profile.level === 'graduated') return [];

  const weak = weakestSubject(profile);
  const favorite = favoriteSubject(profile);
  const bestFriend = findClassmate(education, profile, 'best_friend_potential');
  const bully = findClassmate(education, profile, 'bully');
  const rival = findClassmate(education, profile, 'academic_rival');
  const popular = findClassmate(education, profile, 'popular_student');
  const quiet = findClassmate(education, profile, 'quiet_smart_student');
  const poorHardworking = findClassmate(education, profile, 'poor_hardworking_student');
  const teacher = teacherForSubject(education, profile, weak.id) ?? firstTeacher(education, profile);

  return [
    choice('study_hard', 'Study hard after school', `Push your understanding in ${weak.label}, but accept more stress.`, 'academic', {
      targetSubjectId: weak.id,
      profileEffects: { examReadiness: 6, studyHabits: 4, homeworkCompletion: 3, popularity: -1 },
      statEffects: { intellect: 2, discipline: 3, stress: 3, energy: -3, schoolGrades: 3 },
      subjectEffects: { [weak.id]: { understanding: 7, effort: 6, stress: 3 } },
      memory: `You stayed behind to study ${weak.label}.`,
      consequence: `${weak.label} understanding improved, but stress increased and free time shrank.`,
      tags: ['study', 'weak_subject', 'exam'],
    }),
    choice('study_lightly', 'Study lightly', 'Revise without exhausting yourself.', 'academic', {
      targetSubjectId: favorite.id,
      profileEffects: { examReadiness: 3, studyHabits: 1 },
      statEffects: { stress: -1, energy: -1, schoolGrades: 1 },
      subjectEffects: { [favorite.id]: { understanding: 3, effort: 2 } },
      memory: `You revised ${favorite.label} at a calmer pace.`,
      consequence: 'Exam readiness rose a little without much stress.',
      tags: ['study', 'balance'],
    }),
    choice('focus_weak_subject', `Focus on ${weak.label}`, 'Put serious time into your weakest subject.', 'academic', {
      targetSubjectId: weak.id,
      profileEffects: { examReadiness: 5, academicConfidence: 2, studyHabits: 3 },
      statEffects: { discipline: 2, resilience: 2, stress: 2, schoolGrades: 4 },
      subjectEffects: { [weak.id]: { understanding: 8, effort: 4, assignmentScore: 4, stress: 2 } },
      memory: `You decided not to run away from ${weak.label}.`,
      consequence: `${weak.label} improved and your confidence against weak areas rose.`,
      tags: ['weak_subject', 'resilience'],
    }),
    choice('focus_favorite_subject', `Focus on ${favorite.label}`, 'Lean into the subject that already feels alive to you.', 'academic', {
      targetSubjectId: favorite.id,
      profileEffects: { academicConfidence: 4, examReadiness: 3 },
      statEffects: { confidence: 2, ambition: 2, stress: 1 },
      subjectEffects: { [favorite.id]: { understanding: 5, interest: 6, effort: 3 } },
      memory: `You gave extra attention to ${favorite.label}.`,
      consequence: `${favorite.label} became more tied to your future interests.`,
      tags: ['favorite_subject', 'career_interest'],
    }),
    choice('ask_teacher_help', `Ask ${teacher?.name ?? 'a teacher'} for help`, 'Stay after class and ask for patient explanation.', 'academic', {
      targetTeacherId: teacher?.id,
      targetSubjectId: weak.id,
      profileEffects: { teacherReputation: 4, academicConfidence: 3, examReadiness: 4 },
      statEffects: { communication: 2, confidence: 1, stress: -1 },
      subjectEffects: { [weak.id]: { understanding: 6, teacherRelationship: 7, interest: 2 } },
      teacherRelationshipEffect: 8,
      memory: `You asked ${teacher?.name ?? 'a teacher'} for help with ${weak.label}.`,
      consequence: 'Teacher reputation rose and the confusing topic became clearer.',
      tags: ['teacher', 'help', 'mentor'],
    }),
    choice('ask_friend_help', `Ask ${bestFriend?.name ?? quiet?.name ?? 'a classmate'} for help`, 'Turn study into a friendship moment.', 'academic', {
      targetClassmateId: bestFriend?.id ?? quiet?.id,
      targetSubjectId: weak.id,
      profileEffects: { examReadiness: 3, classmateReputation: 3, academicConfidence: 2 },
      statEffects: { social: 2, empathy: 1, schoolGrades: 2 },
      subjectEffects: { [weak.id]: { understanding: 4, effort: 2 } },
      classmateRelationshipEffect: 8,
      memory: `You studied with ${bestFriend?.name ?? quiet?.name ?? 'a helpful classmate'}.`,
      consequence: 'Friendship and understanding improved together.',
      tags: ['friend', 'study_group'],
    }),
    choice('do_homework_properly', 'Do homework properly', 'Spend the time to finish assignments carefully.', 'academic', {
      profileEffects: { homeworkCompletion: 9, teacherReputation: 3, studyHabits: 3, examReadiness: 3 },
      statEffects: { discipline: 3, workEthic: 2, energy: -2 },
      subjectEffects: allSubjectDeltas({ assignmentScore: 3, effort: 2 }),
      memory: 'You completed your homework properly.',
      consequence: 'Homework, assignment quality, and teacher trust improved.',
      tags: ['homework', 'discipline'],
    }),
    choice('rush_homework', 'Rush homework', 'Finish quickly so you can do something else.', 'academic', {
      profileEffects: { homeworkCompletion: 3, teacherReputation: -1, studyHabits: -1 },
      statEffects: { energy: 1, discipline: -1 },
      subjectEffects: allSubjectDeltas({ assignmentScore: -1, effort: -1 }),
      memory: 'You rushed through homework at the last minute.',
      consequence: 'You avoided immediate trouble, but the work was weaker.',
      tags: ['homework', 'shortcut'],
    }),
    choice('copy_homework', 'Copy homework', 'Use someone else’s work and hope nobody notices.', 'discipline', {
      targetClassmateId: poorHardworking?.id ?? bestFriend?.id,
      profileEffects: { homeworkCompletion: 4, behaviorRecord: -5, teacherReputation: -4, disciplinePoints: 4 },
      statEffects: { morality: -4, stress: 3, streetSmarts: 2 },
      subjectEffects: allSubjectDeltas({ assignmentScore: -2, effort: -2 }),
      classmateRelationshipEffect: -2,
      memory: 'You copied homework instead of learning it.',
      consequence: 'Homework looked finished, but discipline risk and teacher suspicion increased.',
      tags: ['homework', 'cheating', 'risk'],
    }),
    choice('skip_homework', 'Skip homework', 'Do nothing and accept the consequences later.', 'discipline', {
      profileEffects: { homeworkCompletion: -10, behaviorRecord: -4, teacherReputation: -5, studyHabits: -3 },
      statEffects: { discipline: -3, stress: 2, energy: 2 },
      subjectEffects: allSubjectDeltas({ assignmentScore: -5, effort: -3 }),
      memory: 'You skipped your homework.',
      consequence: 'Free time rose today, but grades and teacher trust took a hit.',
      tags: ['homework', 'discipline'],
    }),
    choice('tutor_classmate', `Tutor ${poorHardworking?.name ?? 'a classmate'}`, 'Help someone else understand schoolwork.', 'social', {
      targetClassmateId: poorHardworking?.id ?? quiet?.id,
      targetSubjectId: favorite.id,
      profileEffects: { classmateReputation: 5, academicConfidence: 3, teacherReputation: 2 },
      statEffects: { empathy: 3, communication: 2, happiness: 1, stress: 1 },
      subjectEffects: { [favorite.id]: { understanding: 3, effort: 2 } },
      classmateRelationshipEffect: 10,
      memory: `You tutored ${poorHardworking?.name ?? 'a classmate'} in ${favorite.label}.`,
      consequence: 'Helping someone strengthened friendship, communication, and subject mastery.',
      tags: ['friend', 'tutoring', 'empathy'],
    }),
    choice('visit_library', 'Visit the library', 'Use quiet time to revise and explore books.', 'academic', {
      profileEffects: { examReadiness: 4, studyHabits: 4, popularity: -1 },
      statEffects: { intellect: 2, wisdom: 2, stress: -1 },
      subjectEffects: { [weak.id]: { understanding: 4 }, [favorite.id]: { interest: 3 } },
      memory: 'You spent break time in the library.',
      consequence: 'A quieter routine improved learning and reduced pressure.',
      tags: ['library', 'study_habits'],
    }),
    choice('prepare_exam', 'Prepare for exams', 'Make a proper exam plan across all subjects.', 'exam', {
      profileEffects: { examReadiness: 12, studyHabits: 4, academicConfidence: 2 },
      statEffects: { discipline: 3, stress: 4, schoolGrades: 4 },
      subjectEffects: allSubjectDeltas({ effort: 3, understanding: 2 }),
      memory: 'You made a serious exam preparation plan.',
      consequence: 'Exam readiness rose sharply, but pressure also increased.',
      tags: ['exam', 'preparation'],
    }),
    choice('cram_exam', 'Cram last minute', 'Study intensely right before exams.', 'exam', {
      profileEffects: { examReadiness: 7, studyHabits: -1 },
      statEffects: { stress: 7, energy: -5, discipline: 1 },
      subjectEffects: allSubjectDeltas({ understanding: 1, stress: 4 }),
      memory: 'You crammed at the last minute.',
      consequence: 'Readiness rose quickly, but stress and fatigue climbed.',
      tags: ['exam', 'cram', 'stress'],
    }),
    choice('sleep_before_exam', 'Sleep properly before exams', 'Protect your mind instead of over-studying.', 'exam', {
      profileEffects: { examReadiness: 3, academicConfidence: 2 },
      statEffects: { energy: 6, mentalHealth: 3, stress: -6, health: 1 },
      subjectEffects: allSubjectDeltas({ stress: -3 }),
      memory: 'You slept properly before exams.',
      consequence: 'Stress dropped and exam performance became more stable.',
      tags: ['exam', 'rest', 'mental_health'],
    }),
    choice('panic_overstudy', 'Panic and over-study', 'Keep studying even after your brain is tired.', 'exam', {
      profileEffects: { examReadiness: 5, academicConfidence: -3 },
      statEffects: { stress: 9, energy: -7, mentalHealth: -4 },
      subjectEffects: allSubjectDeltas({ stress: 5, effort: 2 }),
      memory: 'You panicked and over-studied.',
      consequence: 'Readiness improved, but burnout risk rose.',
      tags: ['exam', 'burnout'],
    }),
    choice('cheat_on_test', 'Cheat on a test', 'Risk reputation for a short-term score boost.', 'discipline', {
      profileEffects: { examReadiness: 3, behaviorRecord: -12, teacherReputation: -10, disciplinePoints: 12 },
      statEffects: { morality: -8, stress: 8, streetSmarts: 3, reputation: -3 },
      subjectEffects: { [weak.id]: { examScore: 6, effort: -3 } },
      memory: 'You cheated on a test.',
      consequence: 'The test may look better, but a cheating scandal can haunt scholarships.',
      tags: ['cheating', 'discipline', 'risk'],
    }),
    choice('refuse_cheating', 'Refuse to cheat', 'Protect your record even if friends pressure you.', 'discipline', {
      profileEffects: { behaviorRecord: 5, teacherReputation: 3, academicConfidence: 2 },
      statEffects: { morality: 5, confidence: 2, stress: -1 },
      memory: 'You refused to cheat.',
      consequence: 'Behavior and self-respect improved.',
      tags: ['morality', 'discipline'],
    }),
    choice('make_new_friend', `Make friends with ${quiet?.name ?? 'a classmate'}`, 'Start a real friendship instead of just sharing a classroom.', 'social', {
      targetClassmateId: quiet?.id ?? bestFriend?.id,
      profileEffects: { classmateReputation: 5, popularity: 2, bullyingRisk: -2 },
      statEffects: { social: 3, happiness: 3, confidence: 1 },
      classmateRelationshipEffect: 14,
      memory: `You made time for ${quiet?.name ?? 'a classmate'}.`,
      consequence: 'A classmate relationship moved toward friendship.',
      tags: ['friendship', 'social'],
    }),
    choice('spend_time_best_friend', `Spend time with ${bestFriend?.name ?? 'your best friend'}`, 'Strengthen a loyal school friendship.', 'social', {
      targetClassmateId: bestFriend?.id,
      profileEffects: { classmateReputation: 3, bullyingRisk: -3, examReadiness: -1 },
      statEffects: { happiness: 4, social: 2, stress: -3 },
      classmateRelationshipEffect: 12,
      memory: `You spent time with ${bestFriend?.name ?? 'your best friend'} after school.`,
      consequence: 'Friendship and happiness improved, with a little less study time.',
      tags: ['best_friend', 'memory'],
    }),
    choice('join_popular_group', `Join ${popular?.name ?? 'the popular group'} at lunch`, 'Trade quiet stability for status and peer pressure.', 'social', {
      targetClassmateId: popular?.id,
      profileEffects: { popularity: 8, classmateReputation: 4, bullyingRisk: -2, studyHabits: -2 },
      statEffects: { socialStatus: 4, confidence: 2, stress: 2, discipline: -1 },
      classmateRelationshipEffect: 8,
      memory: 'You sat with the popular group.',
      consequence: 'Popularity rose, but social pressure and distraction increased.',
      tags: ['popular', 'status', 'peer_pressure'],
    }),
    choice('avoid_classmates', 'Avoid classmates', 'Stay out of social drama and keep to yourself.', 'social', {
      profileEffects: { popularity: -5, bullyingRisk: 2, examReadiness: 2 },
      statEffects: { stress: -2, social: -3, happiness: -2 },
      memory: 'You avoided classmates and kept to yourself.',
      consequence: 'Drama reduced, but loneliness and low visibility grew.',
      tags: ['loneliness', 'quiet'],
    }),
    choice('defend_bullied_student', 'Defend a bullied student', 'Risk conflict to protect someone vulnerable.', 'conflict', {
      targetClassmateId: bully?.id,
      profileEffects: { popularity: 2, classmateReputation: 6, bullyingRisk: -4, behaviorRecord: 2 },
      statEffects: { morality: 4, confidence: 3, stress: 2, empathy: 3 },
      classmateRelationshipEffect: -8,
      memory: 'You defended another student from bullying.',
      consequence: 'People respected you more, though conflict with the bully sharpened.',
      tags: ['bullying', 'courage', 'morality'],
    }),
    choice('spread_rumor', 'Spread a rumor', 'Use gossip to gain attention.', 'social', {
      targetClassmateId: rival?.id ?? popular?.id,
      profileEffects: { popularity: 2, behaviorRecord: -7, classmateReputation: -6, bullyingRisk: 3 },
      statEffects: { morality: -6, social: 2, stress: 3 },
      classmateRelationshipEffect: -10,
      memory: 'You spread a rumor at school.',
      consequence: 'Short-term attention came with trust damage.',
      tags: ['rumor', 'morality', 'conflict'],
    }),
    choice('apologize_conflict', 'Apologize after conflict', 'Repair damage before it becomes a long-term rivalry.', 'conflict', {
      targetClassmateId: rival?.id ?? bully?.id,
      profileEffects: { behaviorRecord: 4, classmateReputation: 3, bullyingRisk: -2 },
      statEffects: { empathy: 3, emotionalStability: 2, stress: -2 },
      classmateRelationshipEffect: 8,
      memory: 'You apologized after school conflict.',
      consequence: 'Conflict cooled and your behavior record improved.',
      tags: ['conflict', 'repair'],
    }),
    choice('confront_rival', `Confront ${rival?.name ?? 'your academic rival'}`, 'Challenge a rival directly.', 'conflict', {
      targetClassmateId: rival?.id,
      profileEffects: { academicConfidence: 3, popularity: 1, bullyingRisk: 1 },
      statEffects: { confidence: 3, stress: 3 },
      classmateRelationshipEffect: -6,
      memory: `You confronted ${rival?.name ?? 'your academic rival'}.`,
      consequence: 'Confidence rose, but rivalry became more intense.',
      tags: ['rival', 'confidence'],
    }),
    choice('help_lonely_student', 'Help a lonely student', 'Notice someone who usually gets ignored.', 'social', {
      targetClassmateId: quiet?.id ?? poorHardworking?.id,
      profileEffects: { classmateReputation: 5, bullyingRisk: -2 },
      statEffects: { empathy: 4, happiness: 2 },
      classmateRelationshipEffect: 10,
      memory: 'You helped a lonely student feel included.',
      consequence: 'Empathy and a quiet friendship grew.',
      tags: ['friendship', 'empathy'],
    }),
    choice('obey_rules', 'Obey school rules', 'Build a clean record through consistency.', 'discipline', {
      profileEffects: { behaviorRecord: 6, disciplinePoints: -4, teacherReputation: 3, punctuality: 3 },
      statEffects: { discipline: 3, reputation: 1, stress: -1 },
      memory: 'You followed school rules consistently.',
      consequence: 'Behavior and teacher reputation improved.',
      tags: ['discipline', 'rules'],
    }),
    choice('skip_class', 'Skip class', 'Miss lessons for freedom or peer approval.', 'discipline', {
      targetClassmateId: bestFriend?.id,
      profileEffects: { attendance: -10, behaviorRecord: -8, teacherReputation: -6, popularity: 2, disciplinePoints: 8 },
      statEffects: { discipline: -5, streetSmarts: 2, stress: 1, energy: 2 },
      subjectEffects: allSubjectDeltas({ understanding: -2, effort: -2 }),
      classmateRelationshipEffect: 4,
      memory: 'You skipped class.',
      consequence: 'Freedom felt good briefly, but attendance and teacher trust dropped.',
      tags: ['skip_class', 'risk'],
    }),
    choice('talk_back_teacher', `Talk back to ${teacher?.name ?? 'a teacher'}`, 'Push against authority in front of the class.', 'discipline', {
      targetTeacherId: teacher?.id,
      profileEffects: { behaviorRecord: -9, teacherReputation: -8, popularity: 2, disciplinePoints: 8 },
      statEffects: { confidence: 1, morality: -2, stress: 4 },
      teacherRelationshipEffect: -10,
      memory: `You talked back to ${teacher?.name ?? 'a teacher'}.`,
      consequence: 'Some classmates noticed, but teacher trust and behavior suffered.',
      tags: ['teacher', 'discipline', 'authority'],
    }),
    choice('fight_bully', `Fight ${bully?.name ?? 'the bully'}`, 'Try to stop bullying through force.', 'conflict', {
      targetClassmateId: bully?.id,
      profileEffects: { bullyingRisk: -7, behaviorRecord: -10, disciplinePoints: 10, popularity: 3 },
      statEffects: { confidence: 4, physicalFitness: 1, stress: 5, morality: -2 },
      classmateRelationshipEffect: -12,
      memory: `You fought ${bully?.name ?? 'a bully'}.`,
      consequence: 'Bullying pressure dropped, but punishment risk rose.',
      tags: ['bullying', 'fight', 'discipline'],
    }),
    choice('report_unfair_treatment', 'Report unfair treatment', 'Tell an adult instead of carrying it alone.', 'conflict', {
      targetTeacherId: teacher?.id,
      profileEffects: { teacherReputation: 2, bullyingRisk: -5, behaviorRecord: 2 },
      statEffects: { confidence: 2, stress: -3, communication: 2 },
      teacherRelationshipEffect: 3,
      memory: 'You reported unfair treatment.',
      consequence: 'Bullying risk fell if adults listened; communication improved.',
      tags: ['bullying', 'teacher', 'support'],
    }),
    choice('ask_parent_support', 'Ask parents for school support', 'Tell home what is happening and ask for help.', 'family', {
      profileEffects: { examReadiness: 3, academicConfidence: 3 },
      statEffects: { familyBond: 4, stress: -3, confidence: 1 },
      memory: 'You asked your parents for school support.',
      consequence: 'Family bond and confidence improved.',
      tags: ['family', 'support'],
    }),
    choice('ask_better_school', 'Ask for a better school', 'Push your family to consider a different school environment.', 'family', {
      profileEffects: { academicConfidence: 2 },
      statEffects: { familyBond: -1, ambition: 3, stress: 2 },
      memory: 'You asked about changing to a better school.',
      consequence: 'Ambition rose, but school fees and family pressure became part of the conversation.',
      tags: ['family', 'school_transfer'],
    }),
    choice('hide_bad_report', 'Hide a bad report card', 'Avoid trouble at home for now.', 'family', {
      profileEffects: { behaviorRecord: -5, teacherReputation: -2 },
      statEffects: { stress: 5, morality: -4, familyBond: -3 },
      memory: 'You hid a report card from home.',
      consequence: 'Immediate conflict was delayed, but trust and stress worsened.',
      tags: ['family', 'report_card', 'lie'],
    }),
    choice('accept_parent_pressure', 'Accept parent career pressure', 'Let family expectations shape your study direction.', 'family', {
      targetSubjectId: profile.subjects.science.currentGrade > profile.subjects.government_civic.currentGrade ? 'science' : 'government_civic',
      profileEffects: { studyHabits: 2, academicConfidence: -1, examReadiness: 3 },
      statEffects: { familyBond: 2, stress: 3, ambition: 2 },
      subjectEffects: { science: { effort: 3, interest: -1 }, government_civic: { effort: 2 } },
      memory: 'You accepted parent pressure about your future career.',
      consequence: 'Family approval improved, but your own confidence became more complicated.',
      tags: ['family', 'career_pressure'],
    }),
    clubChoice('join_sports_team', 'Join Sports Team', 'Train, compete, and gain visibility through physical skill.', 'sports_team'),
    clubChoice('join_debate_club', 'Join Debate Club', 'Practice arguments, public speaking, confidence, and civic thinking.', 'debate_club'),
    clubChoice('join_science_club', 'Join Science Club', 'Build experiments and strengthen science confidence.', 'science_club'),
    clubChoice('join_computer_club', 'Join Computer Club', 'Build small projects and discover tech interests.', 'computer_club'),
    clubChoice('join_music_drama_club', 'Join Music/Drama Club', 'Practice performance, creativity, and expression.', 'music_drama_club'),
    choice('attend_club', 'Attend club activity', 'Show up consistently for your current activity.', 'activity', {
      targetClubId: profile.clubMembershipIds[0],
      profileEffects: { popularity: 2, academicConfidence: 1 },
      statEffects: { happiness: 2, stress: 2, confidence: 1 },
      clubParticipationEffect: 8,
      memory: 'You attended a club activity after school.',
      consequence: 'Club participation rose and your school identity became more defined.',
      tags: ['club', 'activity'],
    }),
    choice('prepare_competition', 'Prepare for competition', 'Use club skill for a public opportunity.', 'activity', {
      targetClubId: profile.clubMembershipIds[0],
      profileEffects: { academicConfidence: 4, teacherReputation: 3, examReadiness: -1 },
      statEffects: { ambition: 3, confidence: 3, stress: 4 },
      clubParticipationEffect: 10,
      memory: 'You prepared for a school competition.',
      consequence: 'Competition readiness and teacher visibility improved, with more pressure.',
      tags: ['competition', 'club', 'award'],
    }),
    choice('run_for_leadership', 'Run for student leadership', 'Try to turn reputation into responsibility.', 'activity', {
      profileEffects: { popularity: 4, teacherReputation: 3, classmateReputation: 4, behaviorRecord: 2 },
      statEffects: { confidence: 3, communication: 3, reputation: 2, stress: 3 },
      memory: 'You ran for a student leadership role.',
      consequence: 'Leadership potential rose and future politics/business options improved.',
      tags: ['leadership', 'reputation'],
    }),
    choice('manage_stress', 'Manage stress', 'Take care of your mind before school pressure turns into burnout.', 'stress', {
      profileEffects: { academicConfidence: 2, examReadiness: -1 },
      statEffects: { stress: -8, mentalHealth: 5, emotionalStability: 3, energy: 3 },
      subjectEffects: allSubjectDeltas({ stress: -4 }),
      memory: 'You managed school stress deliberately.',
      consequence: 'Stress dropped and mental health improved, at the cost of some study time.',
      tags: ['stress', 'mental_health'],
    }),
    choice('rest_after_school', 'Rest after school', 'Choose recovery over another obligation.', 'stress', {
      profileEffects: { examReadiness: -2, homeworkCompletion: -1 },
      statEffects: { energy: 7, stress: -6, happiness: 2, health: 1 },
      subjectEffects: allSubjectDeltas({ stress: -2 }),
      memory: 'You rested after school.',
      consequence: 'Energy recovered, but schoolwork did not move forward much.',
      tags: ['rest', 'balance'],
    }),
  ].filter((item) => item.id !== 'attend_club' || profile.clubMembershipIds.length > 0);
}

export function applyEducationChoice(world: WorldState, choiceId: string) {
  const education = ensureEducationState(world);
  const profile = education.activeProfile;
  const active = getActivePerson(world);
  if (!profile || !active || profile.level === 'graduated') return false;

  const selected = getEducationChoices(world).find((candidate) => candidate.id === choiceId);
  if (!selected) return false;

  applyChoiceEffects(world, selected, profile, active);
  recalculateProfile(world, profile);
  syncEducationHistory(world, profile);

  const important = selected.tags.some((tag) => ['best_friend', 'bullying', 'cheating', 'club', 'competition', 'career_interest'].includes(tag));
  recordEducationLifeEvent(world, profile, {
    type: 'school_choice',
    description: selected.memory,
    consequences: [selected.consequence],
    tags: ['education', ...selected.tags],
    important,
    memoryTitle: selected.title,
  });

  profile.lastConsequence = selected.consequence;
  profile.schoolMemories.push(selected.memory);
  if (profile.schoolMemories.length > 20) profile.schoolMemories.shift();
  generateNextSchoolEvent(world, profile);
  return true;
}

export function advanceEducationTerm(world: WorldState) {
  const education = ensureEducationState(world);
  const profile = education.activeProfile;
  const active = getActivePerson(world);
  if (!profile || !active || profile.level === 'graduated') return false;

  const school = profile.currentSchoolId ? education.schools[profile.currentSchoolId] : null;
  profile.term.week = Math.min(10, profile.term.week + 4);
  profile.examReadiness = clamp100(profile.examReadiness + profile.studyHabits * 0.08 + profile.homeworkCompletion * 0.05 - active.stats.stress * 0.03);
  profile.homeworkCompletion = clamp100(profile.homeworkCompletion - 3 + active.stats.discipline * 0.03);
  profile.attendance = clamp100(profile.attendance - (profile.behaviorRecord < 45 ? 3 : 1));
  profile.punctuality = clamp100(profile.punctuality - (profile.disciplinePoints > 30 ? 2 : 0));

  for (const subject of Object.values(profile.subjects)) {
    subject.understanding = clamp100(subject.understanding + subject.effort * 0.03 + (school?.teacherQuality ?? 50) * 0.02);
    subject.stress = clamp100(subject.stress + (school?.academicDifficulty ?? 50) * 0.03 - active.stats.mentalHealth * 0.02);
  }

  applyStatDeltas(active.stats, {
    stress: Math.round((school?.academicDifficulty ?? 50) / 18),
    schoolGrades: profile.academicPerformance > 60 ? 1 : 0,
    discipline: profile.studyHabits > 60 ? 1 : 0,
  });

  world.currentDate = addDays(world.currentDate, 28);
  recalculateProfile(world, profile);
  generateNextSchoolEvent(world, profile);
  profile.lastConsequence = `${profile.term.label} advanced to week ${profile.term.week}. Routine classes changed readiness, homework, attendance, and stress.`;
  return true;
}

export function runEducationExam(world: WorldState) {
  const education = ensureEducationState(world);
  const profile = education.activeProfile;
  const active = getActivePerson(world);
  if (!profile || !active || profile.level === 'graduated') return false;

  const school = profile.currentSchoolId ? education.schools[profile.currentSchoolId] : null;
  const rand = seededRandom(`exam:${world.seed}:${active.id}:${profile.level}:${profile.schoolYear}:${profile.term.period}:${education.examHistory.length}`);
  const subjectScores: Partial<Record<EducationSubjectId, number>> = {};
  let total = 0;

  for (const subject of Object.values(profile.subjects)) {
    const teacher = subject.teacherId ? education.teachers[subject.teacherId] : null;
    const score = clamp100(
      subject.understanding * 0.31 +
      profile.examReadiness * 0.21 +
      subject.assignmentScore * 0.13 +
      subject.naturalAptitude * 0.12 +
      active.stats.intellect * 0.08 +
      active.stats.discipline * 0.08 +
      (teacher?.teachingSkill ?? school?.teacherQuality ?? 50) * 0.07 -
      active.stats.stress * 0.08 -
      subject.stress * 0.05 +
      (rand() - 0.5) * 10
    );
    subject.examScore = score;
    subject.currentGrade = clamp100(score * 0.7 + subject.assignmentScore * 0.2 + subject.effort * 0.1);
    subject.understanding = clamp100(subject.understanding + (score - 50) * 0.05);
    subjectScores[subject.id] = score;
    total += score;
  }

  const overallScore = clamp100(total / SUBJECT_CATALOG.length);
  const scholarshipEligible = Boolean(school && checkScholarshipEligibility(profile, school, overallScore));
  const promoted = overallScore >= 40 || profile.term.period !== 3;
  const classRank = Math.max(1, Math.min(40, 1 + Math.floor((100 - overallScore) / 3 + rand() * 5)));
  const parentReaction = parentReactionFor(overallScore, profile.behaviorRecord);
  const teacherReaction = teacherReactionFor(overallScore, profile.teacherReputation, profile.behaviorRecord);

  profile.academicPerformance = overallScore;
  profile.examReadiness = clamp100(profile.examReadiness - 35);
  profile.academicConfidence = clamp100(profile.academicConfidence + (overallScore >= 70 ? 5 : overallScore >= 50 ? 1 : -5));
  profile.teacherReputation = clamp100(profile.teacherReputation + (overallScore >= 70 ? 3 : overallScore < 40 ? -3 : 0));
  profile.totalExamPeriods += 1;
  profile.term.examHeld = true;
  if (scholarshipEligible && !profile.scholarships.includes('Academic scholarship lead')) {
    profile.scholarships.push('Academic scholarship lead');
  }

  applyStatDeltas(active.stats, {
    schoolGrades: Math.round((overallScore - active.stats.schoolGrades) * 0.45),
    academicAbility: overallScore >= 70 ? 3 : overallScore < 40 ? -2 : 1,
    confidence: overallScore >= 70 ? 2 : overallScore < 40 ? -3 : 0,
    happiness: overallScore >= 60 ? 2 : -2,
    stress: overallScore >= 55 ? -2 : 4,
  });
  syncPersonCoreStats(active);

  const result: ExamResult = {
    id: `exam_${education.examHistory.length + 1}`,
    schoolYear: profile.schoolYear,
    level: profile.level,
    termPeriod: profile.term.period,
    overallScore,
    classRank,
    subjectScores,
    parentReaction,
    teacherReaction,
    scholarshipEligible,
    promoted,
    dateLabel: formatSimDate(world.currentDate),
  };
  education.examHistory.push(result);

  recordEducationLifeEvent(world, profile, {
    type: 'exam_result',
    description: `${active.firstName} finished ${profile.term.label} exams with an overall score of ${overallScore}.`,
    consequences: [
      parentReaction,
      teacherReaction,
      scholarshipEligible ? 'Scholarship eligibility improved.' : 'No scholarship was unlocked from this exam.',
    ],
    tags: ['education', 'exam', profile.level, promoted ? 'promoted' : 'repeat_risk'],
    important: true,
    memoryTitle: `${profile.term.label} exam results`,
  });

  progressAfterExam(world, profile, promoted);
  recalculateProfile(world, profile);
  profile.lastConsequence = `Exam results: ${overallScore}/100, rank ${classRank}. ${parentReaction} ${teacherReaction}`;
  world.currentDate = addDays(world.currentDate, 7);
  return true;
}

export function graduateEducation(world: WorldState) {
  const education = ensureEducationState(world);
  const profile = education.activeProfile;
  const active = getActivePerson(world);
  if (!profile || !active) return false;

  profile.level = 'graduated';
  profile.className = 'Post-school path selection';
  const outcome = determineOutcome(world, profile);
  education.outcomes = [outcome];
  profile.futureOptions = outcome.unlockedOptions;
  profile.lastConsequence = outcome.description;

  recordEducationLifeEvent(world, profile, {
    type: 'graduated',
    description: `${active.firstName} completed secondary school. ${outcome.description}`,
    consequences: outcome.unlockedOptions,
    tags: ['education', 'graduation', outcome.id],
    important: true,
    memoryTitle: outcome.title,
  });

  return true;
}

export function checkScholarshipEligibility(profile: StudentEducationProfile, school: EducationSchool, score = profile.academicPerformance) {
  return (
    score >= 76 &&
    profile.behaviorRecord >= 60 &&
    profile.teacherReputation >= 56 &&
    school.scholarshipAvailability >= 35 &&
    profile.disciplinePoints <= 35
  );
}

export function educationLevelLabel(level: EducationLevel) {
  return LEVEL_LABEL[level];
}

export function possibleEducationOutcomes() {
  return Object.values(EDUCATION_OUTCOMES);
}

function generateSchoolForCharacter(world: WorldState, active: Person, level: EducationLevel): EducationSchool {
  const education = ensureEducationState(world);
  const family = world.families[active.familyId];
  const household = world.households[active.householdId];
  const familyWealth = Math.max(family?.wealth ?? 0, household?.wealth ?? 0, active.stats.wealth);
  const type = familyWealth >= 9000 ? 'private' : 'public';
  const id = `school_${level}_${type}_${world.seed.replace(/[^a-z0-9]+/gi, '_').toLowerCase()}`;
  const existing = education.schools[id];
  if (existing) return existing;

  const rand = seededRandom(`school:${world.seed}:${active.id}:${level}:${type}`);
  const privateBoost = type === 'private' ? 18 : 0;
  const publicVolatility = type === 'public' ? Math.round((rand() - 0.5) * 18) : 0;
  const quality = clamp100(48 + privateBoost + publicVolatility + rand() * 12);
  const school: EducationSchool = {
    id,
    name: schoolName(type, level),
    type,
    level,
    quality,
    tuition: type === 'private' ? 1800 + Math.round(rand() * 1400) : 0,
    location: 'home district',
    reputation: clamp100(quality + (type === 'private' ? 8 : -2)),
    disciplineStrictness: clamp100(45 + privateBoost * 0.6 + rand() * 24),
    academicDifficulty: clamp100(42 + privateBoost * 0.8 + rand() * 28),
    teacherQuality: clamp100(44 + privateBoost + rand() * 20),
    facilitiesQuality: clamp100(38 + privateBoost + rand() * 28),
    safetyLevel: clamp100(48 + privateBoost + rand() * 20),
    bullyingLevel: clamp100(42 - privateBoost * 0.35 + rand() * 28),
    socialStatusLevel: clamp100(38 + privateBoost * 1.4 + rand() * 18),
    clubAvailability: clamp100(42 + privateBoost + rand() * 22),
    sportsQuality: clamp100(40 + privateBoost * 0.5 + rand() * 30),
    scholarshipAvailability: clamp100(type === 'private' ? 36 + rand() * 18 : 42 + rand() * 26),
    corruptionLevel: clamp100(type === 'private' ? 16 + rand() * 18 : 22 + rand() * 28),
    parentSatisfaction: clamp100(quality + (type === 'private' ? 4 : -4)),
    examPerformanceAverage: clamp100(quality + rand() * 10 - 4),
  };
  education.schools[id] = school;

  const institution: Institution = {
    id,
    type: 'school',
    name: school.name,
    foundedDate: { year: world.currentDate.year - 24, month: 9, day: 1 },
    ownerIds: [],
    staffIds: [],
    studentIds: [active.id],
    employeeIds: [],
    reputation: school.reputation,
    wealth: type === 'private' ? 250000 : 90000,
    metadata: {
      educationLevel: level,
      schoolType: type,
      quality: school.quality,
      tuition: school.tuition,
    },
  };
  world.institutions[id] = institution;
  return school;
}

function generateTeachers(world: WorldState, education: EducationState, school: EducationSchool, level: EducationLevel) {
  const active = getActivePerson(world);
  if (!active) return [];

  const existing = Object.values(education.teachers)
    .filter((teacher) => teacher.id.startsWith(`${school.id}_teacher_`))
    .map((teacher) => teacher.id);
  if (existing.length >= 5) return existing.slice(0, 5);

  const rand = seededRandom(`teachers:${world.seed}:${school.id}:${level}`);
  const plans: { primary: EducationSubjectId; subjects: EducationSubjectId[]; personality: string; style: string; encouragement: string; traits: TraitId[] }[] = [
    { primary: 'mathematics', subjects: ['mathematics', 'computer_studies'], personality: 'precise and demanding', style: 'strict corrections', encouragement: 'praises visible effort', traits: ['hardworking', 'intelligent'] },
    { primary: 'english', subjects: ['english', 'government_civic'], personality: 'expressive and observant', style: 'public questioning', encouragement: 'builds confidence through speaking', traits: ['charismatic', 'kind'] },
    { primary: 'science', subjects: ['science', 'mathematics'], personality: 'curious and practical', style: 'lab-based accountability', encouragement: 'rewards curiosity', traits: ['intelligent', 'hardworking'] },
    { primary: 'business_studies', subjects: ['business_studies', 'government_civic'], personality: 'firm and worldly', style: 'case-study discipline', encouragement: 'connects lessons to real life', traits: ['ambitious', 'hardworking'] },
    { primary: 'art', subjects: ['art', 'physical_education'], personality: 'creative but blunt', style: 'participation marks', encouragement: 'notices self-expression', traits: ['charismatic', 'popular'] },
  ];

  const teacherIds = plans.map((plan, index) => {
    const gender: Gender = index % 2 === 0 ? 'female' : 'male';
    const firstName = pick(TEACHER_FIRST_NAMES[gender], rand);
    const lastName = pick(LAST_NAMES, rand);
    const personId = `${school.id}_teacher_person_${index}_${slug(firstName)}_${slug(lastName)}`;
    const id = `${school.id}_teacher_${index}`;
    const { familyId, householdId } = addNpcHousehold(world, lastName, personId, 'a teacher residence', 4200);
    const person = makePerson({
      id: personId,
      firstName,
      lastName,
      gender,
      birthDate: { year: world.currentDate.year - 28 - Math.floor(rand() * 18), month: 3, day: 10 },
      householdId,
      familyId,
      traits: plan.traits,
      stats: {
        intellect: clamp100(62 + school.teacherQuality * 0.25 + rand() * 18),
        communication: clamp100(58 + rand() * 24),
        discipline: clamp100(55 + rand() * 28),
        reputation: clamp100(48 + school.reputation * 0.35),
        wealth: 4200,
      },
      wealth: 4200,
      income: 85 + Math.round(school.quality * 0.6),
    });
    world.people[person.id] = person;
    education.teachers[id] = {
      id,
      personId,
      name: `${firstName} ${lastName}`,
      primarySubjectId: plan.primary,
      subjectIds: plan.subjects,
      teachingSkill: clamp100(school.teacherQuality + (rand() - 0.5) * 20),
      strictness: clamp100(school.disciplineStrictness + (rand() - 0.5) * 20),
      fairness: clamp100(50 + rand() * 35 - school.corruptionLevel * 0.25),
      patience: clamp100(42 + rand() * 38),
      personality: plan.personality,
      biasRisk: clamp100(school.corruptionLevel * 0.7 + rand() * 18),
      relationship: 30,
      favoriteStudentIds: [],
      disciplineStyle: plan.style,
      encouragementStyle: plan.encouragement,
      memoryOfPlayer: [],
    };
    const institution = world.institutions[school.id];
    if (institution) {
      if (!institution.staffIds.includes(personId)) institution.staffIds.push(personId);
      if (!institution.employeeIds.includes(personId)) institution.employeeIds.push(personId);
    }
    person.employmentHistory.push({
      institutionId: school.id,
      role: `${SUBJECT_CATALOG.find((subject) => subject.id === plan.primary)?.label ?? 'Subject'} Teacher`,
      started: { ...world.currentDate },
      salary: person.income,
      reputation: person.reputation,
    });
    return id;
  });

  return teacherIds;
}

function generateClassmates(world: WorldState, education: EducationState, school: EducationSchool, active: Person, level: EducationLevel) {
  const existing = Object.values(education.classmates)
    .filter((classmate) => classmate.id.startsWith(`${school.id}_${level}_classmate_`))
    .map((classmate) => classmate.id);
  if (existing.length >= 10) return existing.slice(0, 10);

  const rand = seededRandom(`classmates:${world.seed}:${active.id}:${school.id}:${level}`);
  const classmateIds = CLASSMATE_ARCHETYPES.map((template, index) => {
    const gender: Gender = index % 2 === 0 ? 'female' : 'male';
    const firstName = pick(CLASSMATE_FIRST_NAMES[gender], rand);
    const lastName = pick(LAST_NAMES, rand);
    const personId = `${school.id}_classmate_person_${index}_${slug(firstName)}_${slug(lastName)}`;
    const id = `${school.id}_${level}_classmate_${index}_${template.archetype}`;
    const wealth = template.archetype === 'rich_student' ? 9000 : template.archetype === 'poor_hardworking_student' ? 600 : 1400;
    const { familyId, householdId } = addNpcHousehold(world, lastName, personId, 'a nearby family home', wealth);
    const person = makePerson({
      id: personId,
      firstName,
      lastName,
      gender,
      birthDate: { year: active.birthDate.year + Math.round((rand() - 0.5) * 2), month: 1, day: 1 },
      householdId,
      familyId,
      traits: template.traits,
      stats: {
        wealth,
        academicAbility: clamp100(template.academicAbility + (rand() - 0.5) * 10),
        social: clamp100(template.popularity + (rand() - 0.5) * 8),
        confidence: clamp100(template.confidence + (rand() - 0.5) * 8),
        discipline: template.behaviorRecord,
        physicalFitness: template.archetype === 'athlete' ? 72 : 42 + Math.round(rand() * 22),
      },
      wealth,
    });
    world.people[person.id] = person;

    education.classmates[id] = {
      id,
      personId,
      name: `${firstName} ${lastName}`,
      age: ageInYears(person.birthDate, world.currentDate),
      gender,
      archetype: template.archetype,
      familyBackground: template.familyBackground,
      academicAbility: clamp100(template.academicAbility + (rand() - 0.5) * 10),
      popularity: clamp100(template.popularity + (rand() - 0.5) * 10),
      confidence: clamp100(template.confidence + (rand() - 0.5) * 10),
      personalityTraits: template.traits,
      friendGroup: template.friendGroup,
      interests: template.interests,
      behaviorRecord: template.behaviorRecord,
      relationship: template.relationship,
      rivalry: template.rivalry,
      bullyingTendency: template.bullyingTendency,
      loyalty: template.loyalty,
      jealousy: template.jealousy,
      influence: template.influence,
      futurePotential: template.futurePotential,
    };

    const institution = world.institutions[school.id];
    if (institution && !institution.studentIds.includes(personId)) institution.studentIds.push(personId);
    return id;
  });

  return classmateIds;
}

function createInitialSubjects(world: WorldState, active: Person, teacherIds: string[]) {
  const education = ensureEducationState(world);
  const rand = seededRandom(`subjects:${world.seed}:${active.id}:${world.currentDate.year}`);
  const subjects = {} as Record<EducationSubjectId, SubjectPerformance>;

  for (const definition of SUBJECT_CATALOG) {
    const teacher = teacherIds
      .map((id) => education.teachers[id])
      .find((candidate) => candidate?.subjectIds.includes(definition.id));
    const aptitude = clamp100(38 + active.stats.intellect * 0.22 + active.stats.academicAbility * 0.26 + rand() * 22);
    const interest = clamp100(38 + rand() * 28 + subjectStatAffinity(definition.id, active.stats));
    const understanding = clamp100(36 + aptitude * 0.38 + (teacher?.teachingSkill ?? 50) * 0.12 + rand() * 14);
    subjects[definition.id] = {
      id: definition.id,
      label: definition.label,
      currentGrade: clamp100(understanding * 0.72 + active.stats.discipline * 0.16 + rand() * 12),
      understanding,
      interest,
      effort: clamp100(42 + active.stats.discipline * 0.28 + rand() * 20),
      teacherRelationship: 30,
      assignmentScore: clamp100(40 + active.stats.discipline * 0.22 + rand() * 24),
      examScore: 0,
      naturalAptitude: aptitude,
      stress: clamp100(20 + rand() * 22),
      careerRelevance: definition.careerRelevance,
      teacherId: teacher?.id,
    };
  }

  return subjects;
}

function createInitialProfile(
  active: Person,
  school: EducationSchool,
  level: EducationLevel,
  teacherIds: string[],
  classmateIds: string[],
  subjects: Record<EducationSubjectId, SubjectPerformance>,
): StudentEducationProfile {
  const academicPerformance = average(Object.values(subjects).map((subject) => subject.currentGrade));
  return {
    studentPersonId: active.id,
    currentSchoolId: school.id,
    level,
    schoolYear: 1,
    className: classNameFor(level, 1),
    term: makeTerm(1, level, 1),
    totalExamPeriods: 0,
    teacherIds,
    classmateIds,
    subjects,
    attendance: 88,
    punctuality: 78,
    homeworkCompletion: 52,
    examReadiness: 35,
    academicPerformance,
    academicConfidence: clamp100(42 + active.stats.confidence * 0.2 + active.stats.academicAbility * 0.25),
    behaviorRecord: clamp100(58 + active.stats.discipline * 0.28),
    disciplinePoints: 0,
    teacherReputation: 38,
    classmateReputation: 35,
    popularity: clamp100(32 + active.stats.social * 0.28 + school.socialStatusLevel * 0.08),
    bullyingRisk: 35,
    socialGroup: 'none',
    clubMembershipIds: [],
    leadershipRoles: [],
    awards: [],
    punishments: [],
    scholarships: [],
    favoriteSubjectIds: [],
    weakSubjectIds: [],
    careerInterests: [],
    studyHabits: clamp100(40 + active.stats.discipline * 0.2 + active.stats.workEthic * 0.18),
    schoolMemories: [],
    importantMemoryEventIds: [],
    futureOptions: [],
  };
}

function syncSchoolRelationships(world: WorldState, profile: StudentEducationProfile) {
  const education = ensureEducationState(world);
  const active = world.people[profile.studentPersonId];
  if (!active) return;
  const origin = profile.level === 'primary' || profile.level === 'preschool' ? 'primary_school' : 'secondary_school';

  for (const teacherId of profile.teacherIds) {
    const teacher = education.teachers[teacherId];
    if (!teacher) continue;
    upsertRelationship(world, active.id, teacher.personId, {
      types: ['teacher'],
      origin,
      originLabel: `${LEVEL_LABEL[profile.level].toLowerCase()} teacher`,
      date: world.currentDate,
      deltas: { respect: 18, familiarity: 18, trust: 4 },
    });
  }

  for (const classmateId of profile.classmateIds) {
    const classmate = education.classmates[classmateId];
    if (!classmate) continue;
    const types: RelationshipType[] = ['classmate'];
    if (classmate.archetype === 'academic_rival') types.push('rival');
    if (classmate.archetype === 'bully') types.push('enemy');
    const relationship = upsertRelationship(world, active.id, classmate.personId, {
      types,
      origin,
      originLabel: `${LEVEL_LABEL[profile.level].toLowerCase()} classmate`,
      date: world.currentDate,
      deltas: {
        closeness: classmate.relationship * 0.2,
        familiarity: 18,
        respect: classmate.rivalry > 30 ? 8 : 4,
        conflict: classmate.rivalry * 0.18 + classmate.bullyingTendency * 0.2,
      },
    });
    if (relationship && classmate.relationship >= 60 && !relationship.types.includes('friend')) relationship.types.push('friend');
  }
}

function syncEducationHistory(world: WorldState, profile: StudentEducationProfile) {
  const active = world.people[profile.studentPersonId];
  if (!active || !profile.currentSchoolId) return;

  const stage = profile.level === 'primary' || profile.level === 'preschool' ? 'primary' : 'secondary';
  const existing = active.educationHistory.find((record) => record.institutionId === profile.currentSchoolId && record.stage === stage);
  const subjects = SUBJECT_CATALOG.map((subject) => SUBJECT_TO_WORLD[subject.id]);
  const teacherPersonIds = profile.teacherIds
    .map((id) => world.education.teachers[id]?.personId)
    .filter((id): id is string => Boolean(id));
  const classmatePersonIds = profile.classmateIds
    .map((id) => world.education.classmates[id]?.personId)
    .filter((id): id is string => Boolean(id));

  if (existing) {
    existing.subjects = subjects;
    existing.teacherIds = teacherPersonIds;
    existing.classmateIds = classmatePersonIds;
    existing.performance = profile.academicPerformance;
    if (profile.level === 'graduated') existing.ended = { ...world.currentDate };
    return;
  }

  active.educationHistory.push({
    institutionId: profile.currentSchoolId,
    stage,
    started: { ...world.currentDate },
    subjects,
    teacherIds: teacherPersonIds,
    classmateIds: classmatePersonIds,
    performance: profile.academicPerformance,
  });
}

function progressAfterExam(world: WorldState, profile: StudentEducationProfile, promoted: boolean) {
  if (profile.term.period < 3) {
    profile.term = makeTerm((profile.term.period + 1) as 1 | 2 | 3, profile.level, profile.schoolYear);
    return;
  }

  if (!promoted) {
    profile.punishments.push(uniqueLabel(profile.punishments, `Repeat risk in ${profile.className}`));
    profile.term = makeTerm(1, profile.level, profile.schoolYear);
    profile.examReadiness = clamp100(profile.examReadiness + 8);
    return;
  }

  profile.schoolYear += 1;
  if (profile.level === 'primary' && profile.schoolYear > 6) {
    transitionLevel(world, profile, 'junior_secondary');
  } else if (profile.level === 'junior_secondary' && profile.schoolYear > 3) {
    transitionLevel(world, profile, 'senior_secondary');
  } else if (profile.level === 'senior_secondary' && profile.schoolYear > 3) {
    graduateEducation(world);
  } else {
    profile.className = classNameFor(profile.level, profile.schoolYear);
    profile.term = makeTerm(1, profile.level, profile.schoolYear);
  }
}

function transitionLevel(world: WorldState, profile: StudentEducationProfile, nextLevel: EducationLevel) {
  const education = ensureEducationState(world);
  const active = world.people[profile.studentPersonId];
  if (!active) return;

  if (profile.currentSchoolId) {
    const currentRecord = active.educationHistory.find((record) => record.institutionId === profile.currentSchoolId && !record.ended);
    if (currentRecord) currentRecord.ended = { ...world.currentDate };
  }

  profile.level = nextLevel;
  profile.schoolYear = 1;
  const school = generateSchoolForCharacter(world, active, nextLevel);
  profile.currentSchoolId = school.id;
  profile.teacherIds = generateTeachers(world, education, school, nextLevel);
  profile.classmateIds = generateClassmates(world, education, school, active, nextLevel);
  profile.subjects = createInitialSubjects(world, active, profile.teacherIds);
  profile.className = classNameFor(nextLevel, 1);
  profile.term = makeTerm(1, nextLevel, 1);
  profile.examReadiness = clamp100(profile.examReadiness + 10);
  profile.teacherReputation = clamp100((profile.teacherReputation + 38) / 2);
  profile.classmateReputation = clamp100((profile.classmateReputation + 35) / 2);
  profile.popularity = clamp100((profile.popularity + 35) / 2);
  profile.schoolMemories.push(`Moved into ${LEVEL_LABEL[nextLevel].toLowerCase()} at ${school.name}.`);

  syncSchoolRelationships(world, profile);
  syncEducationHistory(world, profile);
  recordEducationLifeEvent(world, profile, {
    type: 'started_school',
    description: `${active.firstName} moved into ${LEVEL_LABEL[nextLevel].toLowerCase()} at ${school.name}.`,
    consequences: ['New teachers and classmates entered the school story.', 'Secondary choices now affect future paths more directly.'],
    tags: ['education', nextLevel, 'transition'],
    important: true,
    memoryTitle: `Started ${LEVEL_LABEL[nextLevel]}`,
  });
}

function determineOutcome(world: WorldState, profile: StudentEducationProfile): EducationOutcome {
  const bestSubject = favoriteSubject(profile);
  const bestClub = Object.values(world.education.clubs).sort((a, b) => b.participation - a.participation)[0];
  const hasSpecialTalent = bestSubject.currentGrade >= 82 || (bestClub?.joined && bestClub.participation >= 76);
  const outcomeId: EducationOutcomeId =
    hasSpecialTalent && profile.academicPerformance >= 50 ? 'special_talent_path' :
    profile.academicPerformance >= 76 && profile.behaviorRecord >= 62 ? 'university_scholarship' :
    profile.academicPerformance >= 76 ? 'university_reputation_issues' :
    profile.academicPerformance >= 48 ? 'average_flexible_paths' :
    'poor_grades_alternative_path';
  return { ...EDUCATION_OUTCOMES[outcomeId], score: profile.academicPerformance };
}

function generateNextSchoolEvent(world: WorldState, profile: StudentEducationProfile) {
  const education = ensureEducationState(world);
  const template = EVENT_TEMPLATES.find((candidate) => !education.generatedEventIds.includes(candidate.id) && candidate.condition(world, profile));
  if (!template) return null;

  template.apply?.(world, profile);
  const event: SchoolEvent = {
    id: `school_event_${education.eventLog.length + 1}`,
    templateId: template.id,
    title: template.title,
    description: template.description(world, profile),
    category: template.category,
    dateLabel: formatSimDate(world.currentDate),
    resolved: false,
    important: template.important,
    consequenceSummary: template.consequence(world, profile),
    tags: template.tags,
  };
  education.eventLog.unshift(event);
  education.generatedEventIds.push(template.id);
  profile.lastConsequence = event.consequenceSummary;
  if (template.important) {
    profile.schoolMemories.push(`${event.title}: ${event.consequenceSummary}`);
    recordEducationLifeEvent(world, profile, {
      type: template.category === 'exam' ? 'exam_result' : 'school_choice',
      description: event.description,
      consequences: [event.consequenceSummary],
      tags: ['education_event', ...template.tags],
      important: true,
      memoryTitle: event.title,
    });
  }
  return event;
}

function applyChoiceEffects(world: WorldState, selected: EducationChoice, profile: StudentEducationProfile, active: Person) {
  applyProfileDeltas(profile, selected.profileEffects);
  applyStatDeltas(active.stats, selected.statEffects);
  syncPersonCoreStats(active);

  for (const [subjectId, deltas] of Object.entries(selected.subjectEffects)) {
    const subject = profile.subjects[subjectId as EducationSubjectId];
    if (!subject || !deltas) continue;
    for (const [field, delta] of Object.entries(deltas)) {
      const key = field as keyof Pick<SubjectPerformance, 'currentGrade' | 'understanding' | 'interest' | 'effort' | 'teacherRelationship' | 'assignmentScore' | 'examScore' | 'stress'>;
      subject[key] = clamp100(subject[key] + Number(delta ?? 0));
    }
  }

  if (selected.targetTeacherId) {
    const teacher = world.education.teachers[selected.targetTeacherId];
    if (teacher) {
      teacher.relationship = clamp100(teacher.relationship + (selected.teacherRelationshipEffect ?? 0));
      teacher.memoryOfPlayer.push(selected.memory);
      if (teacher.relationship >= 70 && !teacher.favoriteStudentIds.includes(active.id)) teacher.favoriteStudentIds.push(active.id);
      upsertRelationship(world, active.id, teacher.personId, {
        types: ['teacher'],
        origin: profile.level === 'primary' || profile.level === 'preschool' ? 'primary_school' : 'secondary_school',
        originLabel: 'school interaction with teacher',
        date: world.currentDate,
        deltas: { respect: selected.teacherRelationshipEffect ?? 0, trust: Math.max(-5, (selected.teacherRelationshipEffect ?? 0) * 0.5), familiarity: 4 },
        history: selected.memory,
      });
    }
  }

  if (selected.targetClassmateId) {
    const classmate = world.education.classmates[selected.targetClassmateId];
    if (classmate) {
      classmate.relationship = clamp100(classmate.relationship + (selected.classmateRelationshipEffect ?? 0));
      classmate.rivalry = clamp100(classmate.rivalry - Math.max(0, selected.classmateRelationshipEffect ?? 0) * 0.2 + Math.max(0, -(selected.classmateRelationshipEffect ?? 0)) * 0.4);
      const relationshipTypes: RelationshipType[] = ['classmate'];
      if (classmate.relationship >= 62) relationshipTypes.push('friend');
      if (classmate.rivalry >= 45) relationshipTypes.push('rival');
      if (classmate.bullyingTendency >= 70 || classmate.rivalry >= 70) relationshipTypes.push('enemy');
      const relationship = upsertRelationship(world, active.id, classmate.personId, {
        types: relationshipTypes,
        origin: profile.level === 'primary' || profile.level === 'preschool' ? 'primary_school' : 'secondary_school',
        originLabel: classmate.relationship >= 62 ? 'school friendship' : 'school classmate interaction',
        date: world.currentDate,
        deltas: {
          closeness: selected.classmateRelationshipEffect ?? 0,
          trust: (selected.classmateRelationshipEffect ?? 0) * 0.7,
          respect: Math.abs(selected.classmateRelationshipEffect ?? 0) * 0.25,
          conflict: Math.max(0, -(selected.classmateRelationshipEffect ?? 0)),
          familiarity: 6,
        },
        history: selected.memory,
      });
      if (relationship?.types.includes('friend') && classmate.archetype === 'best_friend_potential') {
        relationship.originLabel = 'best friend from school';
      }
    }
  }

  if (selected.targetClubId) {
    const club = world.education.clubs[selected.targetClubId];
    if (club) {
      club.joined = true;
      club.participation = clamp100(club.participation + (selected.clubParticipationEffect ?? 12));
      if (!profile.clubMembershipIds.includes(club.id)) profile.clubMembershipIds.push(club.id);
      for (const [subjectId, delta] of Object.entries(club.subjectBoosts)) {
        const subject = profile.subjects[subjectId as EducationSubjectId];
        if (subject) {
          subject.interest = clamp100(subject.interest + Number(delta) * 0.6);
          subject.effort = clamp100(subject.effort + Number(delta) * 0.4);
        }
      }
      applyStatDeltas(active.stats, {
        ...club.statBoosts,
        happiness: (club.statBoosts.happiness ?? 0) + club.happinessBenefit,
        stress: club.stressCost,
      });
      for (const interest of club.careerRelevance.slice(0, 2)) addCareerInterest(profile, interest);
    }
  }

  if (selected.id === 'join_popular_group') profile.socialGroup = 'popular';
  if (selected.id === 'avoid_classmates') profile.socialGroup = 'quiet_kids';
  if (selected.id === 'visit_library') profile.socialGroup = profile.socialGroup === 'none' ? 'studious' : profile.socialGroup;
  if (selected.id === 'join_computer_club') profile.socialGroup = 'tech';
  if (selected.id === 'join_debate_club') profile.socialGroup = 'debate';
  if (selected.id === 'join_sports_team') profile.socialGroup = 'sports';
  if (selected.targetSubjectId) {
    const subject = profile.subjects[selected.targetSubjectId];
    if (subject && (subject.interest >= 64 || subject.currentGrade >= 72)) {
      for (const interest of subject.careerRelevance.slice(0, 2)) addCareerInterest(profile, interest);
    }
  }
}

function recalculateProfile(world: WorldState, profile: StudentEducationProfile) {
  const active = world.people[profile.studentPersonId];
  const school = profile.currentSchoolId ? world.education.schools[profile.currentSchoolId] : null;
  profile.academicPerformance = clamp100(average(Object.values(profile.subjects).map((subject) => subject.currentGrade)));
  profile.favoriteSubjectIds = Object.values(profile.subjects)
    .sort((a, b) => b.currentGrade + b.interest - (a.currentGrade + a.interest))
    .slice(0, 2)
    .map((subject) => subject.id);
  profile.weakSubjectIds = Object.values(profile.subjects)
    .sort((a, b) => a.currentGrade + a.understanding - (b.currentGrade + b.understanding))
    .slice(0, 2)
    .map((subject) => subject.id);

  const friendSupport = profile.classmateIds
    .map((id) => world.education.classmates[id])
    .filter((classmate): classmate is EducationClassmate => Boolean(classmate))
    .reduce((sum, classmate) => sum + (classmate.relationship >= 55 ? 1 : 0), 0);
  const bullyPressure = profile.classmateIds
    .map((id) => world.education.classmates[id])
    .filter((classmate): classmate is EducationClassmate => Boolean(classmate))
    .reduce((sum, classmate) => sum + classmate.bullyingTendency * (classmate.rivalry > 35 ? 1.2 : 0.6), 0) / 10;

  profile.bullyingRisk = clamp100(
    (school?.bullyingLevel ?? 40) * 0.4 +
    bullyPressure -
    profile.popularity * 0.18 -
    (active?.stats.confidence ?? 50) * 0.12 -
    (active?.stats.physicalFitness ?? 45) * 0.08 -
    friendSupport * 5
  );
  profile.futureOptions = deriveFutureOptions(profile);
}

function recordEducationLifeEvent(
  world: WorldState,
  profile: StudentEducationProfile,
  input: {
    type: 'started_school' | 'school_choice' | 'exam_result' | 'graduated';
    description: string;
    consequences: string[];
    tags: string[];
    important: boolean;
    memoryTitle: string;
  },
) {
  const personIds = [profile.studentPersonId];
  const event = recordLifeEvent(world, {
    type: input.type,
    personIds,
    locationId: profile.currentSchoolId,
    description: input.description,
    consequences: input.consequences,
    tags: input.tags,
    importantMemory: input.important,
    memoryTitle: input.memoryTitle,
  });
  if (input.important) profile.importantMemoryEventIds.push(event.id);
  return event;
}

type EducationChoiceInput = Omit<EducationChoice, 'id' | 'title' | 'description' | 'category' | 'subjectEffects'> & {
  subjectEffects?: EducationChoice['subjectEffects'];
};

function choice(
  id: string,
  title: string,
  description: string,
  category: EducationChoice['category'],
  input: EducationChoiceInput,
): EducationChoice {
  return { id, title, description, category, ...input, subjectEffects: input.subjectEffects ?? {} };
}

function clubChoice(id: string, title: string, description: string, clubId: EducationClubId): EducationChoice {
  return choice(id, title, description, 'activity', {
    targetClubId: clubId,
    profileEffects: { popularity: 3, classmateReputation: 3, studyHabits: -1 },
    statEffects: {},
    subjectEffects: {},
    clubParticipationEffect: 18,
    memory: `You joined ${title.replace('Join ', '')}.`,
    consequence: `${title.replace('Join ', '')} became part of your weekly school life, adding skills, friends, pressure, and future interests.`,
    tags: ['club', clubId],
  });
}

function allSubjectDeltas(delta: Partial<Pick<SubjectPerformance, 'currentGrade' | 'understanding' | 'interest' | 'effort' | 'teacherRelationship' | 'assignmentScore' | 'examScore' | 'stress'>>) {
  return SUBJECT_CATALOG.reduce((acc, subject) => {
    acc[subject.id] = delta;
    return acc;
  }, {} as EducationChoice['subjectEffects']);
}

function applyProfileDeltas(profile: StudentEducationProfile, deltas: EducationChoice['profileEffects']) {
  type ProfileEffectKey = keyof EducationChoice['profileEffects'];
  const numericProfile = profile as unknown as Record<ProfileEffectKey, number>;
  for (const [key, delta] of Object.entries(deltas)) {
    const field = key as ProfileEffectKey;
    const next = Number(numericProfile[field] ?? 0) + Number(delta ?? 0);
    if (field === 'disciplinePoints') {
      profile.disciplinePoints = Math.max(0, Math.round(next));
    } else {
      numericProfile[field] = clamp100(next);
    }
  }
}

function applyStatDeltas(stats: StatBlock, deltas: Partial<Record<StatKey, number>>) {
  for (const [key, delta] of Object.entries(deltas)) {
    const stat = key as StatKey;
    if (stat === 'wealth') {
      stats.wealth = Math.max(0, Math.round(stats.wealth + Number(delta ?? 0)));
    } else {
      stats[stat] = clamp100(stats[stat] + Number(delta ?? 0));
    }
  }
}

function syncPersonCoreStats(person: Person) {
  person.health = person.stats.health;
  person.wealth = person.stats.wealth;
  person.reputation = person.stats.reputation;
}

function addNpcHousehold(world: WorldState, lastName: string, memberId: string, addressLabel: string, wealth: number) {
  const familyId = `family_${slug(lastName)}_${memberId}`;
  const householdId = `household_${slug(lastName)}_${memberId}`;
  if (!world.families[familyId]) {
    const family: Family = {
      id: familyId,
      name: `${lastName} family`,
      memberIds: [memberId],
      reputation: 40,
      wealth,
      trauma: 0,
      memoryEventIds: [],
    };
    world.families[familyId] = family;
  }
  if (!world.households[householdId]) {
    const household: Household = {
      id: householdId,
      name: `${lastName} household`,
      memberIds: [memberId],
      familyId,
      wealth,
      addressLabel,
    };
    world.households[householdId] = household;
  }
  return { familyId, householdId };
}

function makeTerm(period: 1 | 2 | 3, level: EducationLevel, schoolYear: number) {
  const names: Record<1 | 2 | 3, string> = { 1: 'First Term', 2: 'Second Term', 3: 'Third Term' };
  return {
    id: `${level}_${schoolYear}_term_${period}`,
    label: `${names[period]} - ${classNameFor(level, schoolYear)}`,
    period,
    week: 1,
    examHeld: false,
    focus: period === 1 ? 'settling in and foundations' : period === 2 ? 'deeper learning and activities' : 'promotion exams and reflection',
  };
}

function classNameFor(level: EducationLevel, year: number) {
  if (level === 'preschool') return 'Preschool';
  if (level === 'primary') return `Primary ${year}`;
  if (level === 'junior_secondary') return `Junior Secondary ${year}`;
  if (level === 'senior_secondary') return `Senior Secondary ${year}`;
  return 'Graduated';
}

function schoolName(type: 'public' | 'private', level: EducationLevel) {
  const levelName = level === 'primary' || level === 'preschool' ? 'Primary School' : 'Secondary School';
  return type === 'private' ? `Crestview Private ${levelName}` : `Unity Community ${levelName}`;
}

function subjectStatAffinity(subject: EducationSubjectId, stats: StatBlock) {
  switch (subject) {
    case 'mathematics':
      return stats.intellect * 0.08 + stats.discipline * 0.04;
    case 'english':
      return stats.communication * 0.09 + stats.creativity * 0.04;
    case 'science':
      return stats.intellect * 0.06 + stats.academicAbility * 0.05;
    case 'computer_studies':
      return stats.intellect * 0.06 + stats.practicalSkill * 0.06;
    case 'business_studies':
      return stats.financialLiteracy * 0.08 + stats.ambition * 0.05;
    case 'government_civic':
      return stats.communication * 0.06 + stats.morality * 0.04;
    case 'art':
      return stats.creativity * 0.12;
    case 'physical_education':
      return stats.physicalFitness * 0.1 + stats.fitness * 0.07;
    default:
      return 0;
  }
}

function teacherForSubject(education: EducationState, profile: StudentEducationProfile, subjectId: EducationSubjectId) {
  return profile.teacherIds
    .map((id) => education.teachers[id])
    .find((teacher) => teacher?.subjectIds.includes(subjectId));
}

function firstTeacher(education: EducationState, profile: StudentEducationProfile) {
  return profile.teacherIds.map((id) => education.teachers[id]).find(Boolean);
}

function findClassmate(education: EducationState, profile: StudentEducationProfile, archetype: ClassmateArchetype) {
  return profile.classmateIds
    .map((id) => education.classmates[id])
    .find((classmate) => classmate?.archetype === archetype);
}

function findAnyClassmate(education: EducationState, profile: StudentEducationProfile) {
  return profile.classmateIds.map((id) => education.classmates[id]).find(Boolean);
}

function weakestSubject(profile: StudentEducationProfile) {
  return Object.values(profile.subjects).sort((a, b) => a.currentGrade + a.understanding - (b.currentGrade + b.understanding))[0] ?? profile.subjects.mathematics;
}

function favoriteSubject(profile: StudentEducationProfile) {
  return Object.values(profile.subjects).sort((a, b) => b.currentGrade + b.interest - (a.currentGrade + a.interest))[0] ?? profile.subjects.english;
}

function addCareerInterest(profile: StudentEducationProfile, interest: string) {
  if (!profile.careerInterests.includes(interest)) profile.careerInterests.push(interest);
}

function deriveFutureOptions(profile: StudentEducationProfile) {
  const options = new Set<string>();
  if (profile.academicPerformance >= 70) options.add('university prep');
  if (profile.academicPerformance >= 76 && profile.behaviorRecord >= 60) options.add('scholarship path');
  if (profile.subjects.computer_studies.currentGrade >= 68 || profile.careerInterests.includes('software')) options.add('tech path');
  if (profile.subjects.business_studies.currentGrade >= 66 || profile.careerInterests.includes('entrepreneurship')) options.add('business path');
  if (profile.subjects.government_civic.currentGrade >= 66 || profile.careerInterests.includes('politics')) options.add('law/politics path');
  if (profile.subjects.physical_education.currentGrade >= 70 || profile.clubMembershipIds.includes('sports_team')) options.add('sports/fitness path');
  if (profile.subjects.art.currentGrade >= 70 || profile.clubMembershipIds.includes('music_drama_club')) options.add('creative path');
  if (profile.academicPerformance < 48) options.add('vocational/apprenticeship path');
  return Array.from(options);
}

function parentReactionFor(score: number, behavior: number) {
  if (score >= 76 && behavior >= 60) return 'Your parents were proud and started talking about scholarships.';
  if (score >= 76) return 'Your parents praised the grades but warned you about behavior.';
  if (score >= 55) return 'Your parents accepted the result but expected improvement.';
  if (score >= 40) return 'Your parents were worried and asked what support you need.';
  return 'Your parents were disappointed and pressure at home increased.';
}

function teacherReactionFor(score: number, teacherReputation: number, behavior: number) {
  if (score >= 76 && teacherReputation >= 55) return 'Teachers saw you as a serious student worth recommending.';
  if (score >= 60) return 'Teachers felt you were progressing.';
  if (score >= 45 && behavior >= 60) return 'Teachers thought you could recover with better preparation.';
  return 'Teachers became concerned about your future performance.';
}

function uniqueLabel(existing: string[], label: string) {
  if (!existing.includes(label)) return label;
  return `${label} ${existing.length + 1}`;
}

function average(values: number[]) {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function pick<T>(items: T[], rand: () => number) {
  return items[Math.floor(rand() * items.length)] ?? items[0];
}

function slug(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '_');
}

function clamp100(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}
