import type { StatKey } from '../types';

export type EducationLevel =
  | 'preschool'
  | 'primary'
  | 'junior_secondary'
  | 'senior_secondary'
  | 'graduated';

export type SchoolType =
  | 'public'
  | 'private'
  | 'elite'
  | 'religious'
  | 'boarding'
  | 'technical'
  | 'community';

export type EducationSubjectId =
  | 'mathematics'
  | 'english'
  | 'science'
  | 'computer_studies'
  | 'business_studies'
  | 'government_civic'
  | 'art'
  | 'physical_education';

export const SUBJECT_CATALOG: {
  id: EducationSubjectId;
  label: string;
  careerRelevance: string[];
}[] = [
  { id: 'mathematics', label: 'Mathematics', careerRelevance: ['engineering', 'finance', 'programming', 'science'] },
  { id: 'english', label: 'English', careerRelevance: ['law', 'media', 'teaching', 'communication'] },
  { id: 'science', label: 'Science', careerRelevance: ['medicine', 'engineering', 'research', 'health'] },
  { id: 'computer_studies', label: 'Computer Studies', careerRelevance: ['software', 'cybersecurity', 'data', 'tech business'] },
  { id: 'business_studies', label: 'Business Studies', careerRelevance: ['banking', 'sales', 'management', 'entrepreneurship'] },
  { id: 'government_civic', label: 'Government / Civic Education', careerRelevance: ['law', 'politics', 'public service'] },
  { id: 'art', label: 'Art', careerRelevance: ['design', 'entertainment', 'creative business'] },
  { id: 'physical_education', label: 'Physical Education', careerRelevance: ['sports', 'fitness', 'military', 'health'] },
];

export type EducationChoiceCategory =
  | 'academic'
  | 'social'
  | 'discipline'
  | 'activity'
  | 'family'
  | 'conflict'
  | 'exam'
  | 'stress';

export type EducationEventCategory =
  | 'academic'
  | 'social'
  | 'teacher'
  | 'friend'
  | 'bullying'
  | 'discipline'
  | 'parent'
  | 'club'
  | 'competition'
  | 'exam'
  | 'stress'
  | 'opportunity'
  | 'romance'
  | 'finance';

export type ClassmateArchetype =
  | 'best_friend_potential'
  | 'academic_rival'
  | 'bully'
  | 'popular_student'
  | 'quiet_smart_student'
  | 'troublemaker'
  | 'rich_student'
  | 'poor_hardworking_student'
  | 'athlete'
  | 'class_clown';

export type FriendGroup =
  | 'none'
  | 'studious'
  | 'popular'
  | 'sports'
  | 'creative'
  | 'troublemaker'
  | 'rich_kids'
  | 'quiet_kids'
  | 'tech'
  | 'debate';

export type EducationOutcomeId =
  | 'university_scholarship'
  | 'university_reputation_issues'
  | 'average_flexible_paths'
  | 'poor_grades_alternative_path'
  | 'special_talent_path';

export type EducationSchool = {
  id: string;
  name: string;
  type: SchoolType;
  level: EducationLevel;
  quality: number;
  tuition: number;
  location: string;
  reputation: number;
  disciplineStrictness: number;
  academicDifficulty: number;
  teacherQuality: number;
  facilitiesQuality: number;
  safetyLevel: number;
  bullyingLevel: number;
  socialStatusLevel: number;
  clubAvailability: number;
  sportsQuality: number;
  scholarshipAvailability: number;
  corruptionLevel: number;
  parentSatisfaction: number;
  examPerformanceAverage: number;
};

export type SubjectPerformance = {
  id: EducationSubjectId;
  label: string;
  currentGrade: number;
  understanding: number;
  interest: number;
  effort: number;
  teacherRelationship: number;
  assignmentScore: number;
  examScore: number;
  naturalAptitude: number;
  stress: number;
  careerRelevance: string[];
  teacherId?: string;
};

export type EducationTeacher = {
  id: string;
  personId: string;
  name: string;
  primarySubjectId: EducationSubjectId;
  subjectIds: EducationSubjectId[];
  teachingSkill: number;
  strictness: number;
  fairness: number;
  patience: number;
  personality: string;
  biasRisk: number;
  relationship: number;
  favoriteStudentIds: string[];
  disciplineStyle: string;
  encouragementStyle: string;
  memoryOfPlayer: string[];
};

export type EducationClassmate = {
  id: string;
  personId: string;
  name: string;
  age: number;
  gender: 'male' | 'female';
  archetype: ClassmateArchetype;
  familyBackground: string;
  academicAbility: number;
  popularity: number;
  confidence: number;
  personalityTraits: string[];
  friendGroup: FriendGroup;
  interests: string[];
  behaviorRecord: number;
  relationship: number;
  rivalry: number;
  bullyingTendency: number;
  loyalty: number;
  jealousy: number;
  influence: number;
  futurePotential: string;
};

export type EducationClubId =
  | 'sports_team'
  | 'debate_club'
  | 'science_club'
  | 'computer_club'
  | 'music_drama_club';

export type EducationClub = {
  id: EducationClubId;
  name: string;
  skillBenefits: string[];
  subjectBoosts: Partial<Record<EducationSubjectId, number>>;
  statBoosts: Partial<Record<StatKey, number>>;
  timeCost: number;
  stressCost: number;
  happinessBenefit: number;
  mentorTeacherId?: string;
  competitionLevel: number;
  awards: string[];
  leadershipAvailable: boolean;
  careerRelevance: string[];
  joined: boolean;
  participation: number;
};

export type SchoolTerm = {
  id: string;
  label: string;
  period: 1 | 2 | 3;
  week: number;
  examHeld: boolean;
  focus: string;
};

export type SchoolEvent = {
  id: string;
  templateId: string;
  title: string;
  description: string;
  category: EducationEventCategory;
  dateLabel: string;
  resolved: boolean;
  important: boolean;
  consequenceSummary: string;
  tags: string[];
};

export type ExamResult = {
  id: string;
  schoolYear: number;
  level: EducationLevel;
  termPeriod: 1 | 2 | 3;
  overallScore: number;
  classRank: number;
  subjectScores: Partial<Record<EducationSubjectId, number>>;
  parentReaction: string;
  teacherReaction: string;
  scholarshipEligible: boolean;
  promoted: boolean;
  dateLabel: string;
};

export type EducationOutcome = {
  id: EducationOutcomeId;
  title: string;
  description: string;
  unlockedOptions: string[];
  score: number;
};

export type StudentEducationProfile = {
  studentPersonId: string;
  currentSchoolId?: string;
  level: EducationLevel;
  schoolYear: number;
  className: string;
  term: SchoolTerm;
  totalExamPeriods: number;
  teacherIds: string[];
  classmateIds: string[];
  subjects: Record<EducationSubjectId, SubjectPerformance>;
  attendance: number;
  punctuality: number;
  homeworkCompletion: number;
  examReadiness: number;
  academicPerformance: number;
  academicConfidence: number;
  behaviorRecord: number;
  disciplinePoints: number;
  teacherReputation: number;
  classmateReputation: number;
  popularity: number;
  bullyingRisk: number;
  socialGroup: FriendGroup;
  clubMembershipIds: EducationClubId[];
  leadershipRoles: string[];
  awards: string[];
  punishments: string[];
  scholarships: string[];
  favoriteSubjectIds: EducationSubjectId[];
  weakSubjectIds: EducationSubjectId[];
  careerInterests: string[];
  studyHabits: number;
  schoolMemories: string[];
  importantMemoryEventIds: string[];
  lastConsequence?: string;
  futureOptions: string[];
};

export type EducationChoice = {
  id: string;
  title: string;
  description: string;
  category: EducationChoiceCategory;
  targetSubjectId?: EducationSubjectId;
  targetClassmateId?: string;
  targetTeacherId?: string;
  targetClubId?: EducationClubId;
  profileEffects: Partial<Record<
    | 'attendance'
    | 'punctuality'
    | 'homeworkCompletion'
    | 'examReadiness'
    | 'academicPerformance'
    | 'academicConfidence'
    | 'behaviorRecord'
    | 'disciplinePoints'
    | 'teacherReputation'
    | 'classmateReputation'
    | 'popularity'
    | 'bullyingRisk'
    | 'studyHabits',
    number
  >>;
  statEffects: Partial<Record<StatKey, number>>;
  subjectEffects: Partial<Record<EducationSubjectId, Partial<Pick<SubjectPerformance,
    'currentGrade' | 'understanding' | 'interest' | 'effort' | 'teacherRelationship' | 'assignmentScore' | 'examScore' | 'stress'
  >>>>;
  classmateRelationshipEffect?: number;
  teacherRelationshipEffect?: number;
  clubParticipationEffect?: number;
  memory: string;
  consequence: string;
  tags: string[];
};

export type EducationState = {
  activeProfile: StudentEducationProfile | null;
  schools: Record<string, EducationSchool>;
  teachers: Record<string, EducationTeacher>;
  classmates: Record<string, EducationClassmate>;
  clubs: Record<EducationClubId, EducationClub>;
  eventLog: SchoolEvent[];
  generatedEventIds: string[];
  examHistory: ExamResult[];
  outcomes: EducationOutcome[];
};
