import type { Gender, StatBlock, StatKey, TraitId } from '../types';
import type { EducationState } from '../education/types';

export type PersonId = string;
export type FamilyId = string;
export type HouseholdId = string;
export type InstitutionId = string;
export type RelationshipId = string;
export type LifeEventId = string;
export type MemoryId = string;
export type BusinessId = string;

export type SimDate = {
  year: number;
  month: number;
  day: number;
};

export type RelationshipType =
  | 'parent'
  | 'child'
  | 'sibling'
  | 'friend'
  | 'best_friend'
  | 'classmate'
  | 'coworker'
  | 'romantic_partner'
  | 'spouse'
  | 'ex_partner'
  | 'rival'
  | 'enemy'
  | 'mentor'
  | 'teacher'
  | 'boss'
  | 'employee'
  | 'neighbor'
  | 'business_partner'
  | 'generational_link';

export type RelationshipOrigin =
  | 'birth'
  | 'family'
  | 'primary_school'
  | 'secondary_school'
  | 'work'
  | 'business'
  | 'neighborhood'
  | 'through_parent'
  | 'choice'
  | 'simulation';

export type LifeEventType =
  | 'born'
  | 'started_school'
  | 'met_friend'
  | 'school_choice'
  | 'exam_result'
  | 'graduated'
  | 'started_dating'
  | 'relationship_changed'
  | 'bought_asset'
  | 'moved_home'
  | 'managed_money'
  | 'health_changed'
  | 'public_reputation'
  | 'got_job'
  | 'started_business'
  | 'married'
  | 'had_child'
  | 'parenting_choice'
  | 'retired'
  | 'wrote_will'
  | 'became_rich'
  | 'lost_job'
  | 'committed_crime'
  | 'became_politician'
  | 'became_president'
  | 'died'
  | 'continued_lineage';

export type InstitutionType =
  | 'school'
  | 'company'
  | 'government'
  | 'hospital'
  | 'religious'
  | 'political_party'
  | 'criminal_network'
  | 'court'
  | 'bank'
  | 'business';

export type SchoolStage = 'primary' | 'secondary' | 'university';

export type SchoolSubject =
  | 'Mathematics'
  | 'English'
  | 'Science'
  | 'History'
  | 'Arts'
  | 'Art'
  | 'Physical Education'
  | 'Economics'
  | 'Business Studies'
  | 'Civic Education'
  | 'Government / Civic Education'
  | 'Computer Studies';

export type EducationRecord = {
  institutionId: InstitutionId;
  stage: SchoolStage;
  started: SimDate;
  ended?: SimDate;
  subjects: SchoolSubject[];
  teacherIds: PersonId[];
  classmateIds: PersonId[];
  performance: number;
};

export type EmploymentRecord = {
  institutionId: InstitutionId;
  role: string;
  started: SimDate;
  ended?: SimDate;
  salary: number;
  reputation: number;
};

export type Memory = {
  id: MemoryId;
  eventId: LifeEventId;
  date: SimDate;
  title: string;
  description: string;
  importance: number;
  emotionalTone: 'positive' | 'neutral' | 'negative' | 'mixed';
  relatedPersonIds: PersonId[];
  tags: string[];
};

export type LifeEvent = {
  id: LifeEventId;
  date: SimDate;
  type: LifeEventType;
  personIds: PersonId[];
  locationId?: InstitutionId | HouseholdId;
  description: string;
  consequences: string[];
  tags: string[];
  importantMemory: boolean;
};

export type Person = {
  id: PersonId;
  firstName: string;
  lastName: string;
  gender: Gender;
  birthDate: SimDate;
  deathDate?: SimDate;
  parentIds: PersonId[];
  childIds: PersonId[];
  siblingIds: PersonId[];
  partnerIds: PersonId[];
  spouseId?: PersonId;
  householdId: HouseholdId;
  familyId: FamilyId;
  educationHistory: EducationRecord[];
  employmentHistory: EmploymentRecord[];
  wealth: number;
  income: number;
  health: number;
  traits: TraitId[];
  stats: StatBlock;
  reputation: number;
  memories: Memory[];
  lifeEventIds: LifeEventId[];
  currentGoals: string[];
  relationshipIds: RelationshipId[];
  status: 'living' | 'dead';
};

export type Relationship = {
  id: RelationshipId;
  personAId: PersonId;
  personBId: PersonId;
  types: RelationshipType[];
  closeness: number;
  trust: number;
  respect: number;
  attraction: number;
  conflict: number;
  familiarity: number;
  history: string[];
  origin: RelationshipOrigin;
  originLabel: string;
  originEventId?: LifeEventId;
  lastInteractionDate: SimDate;
};

export type Family = {
  id: FamilyId;
  name: string;
  memberIds: PersonId[];
  reputation: number;
  wealth: number;
  trauma: number;
  memoryEventIds: LifeEventId[];
};

export type Household = {
  id: HouseholdId;
  name: string;
  memberIds: PersonId[];
  familyId: FamilyId;
  wealth: number;
  addressLabel: string;
};

export type Institution = {
  id: InstitutionId;
  type: InstitutionType;
  name: string;
  foundedDate: SimDate;
  ownerIds: PersonId[];
  staffIds: PersonId[];
  studentIds: PersonId[];
  employeeIds: PersonId[];
  reputation: number;
  wealth: number;
  metadata: Record<string, string | number | boolean>;
};

export type PersistentBusiness = {
  id: BusinessId;
  name: string;
  ownerIds: PersonId[];
  employeeIds: PersonId[];
  foundedDate: SimDate;
  wealth: number;
  reputation: number;
  inheritedFromPersonId?: PersonId;
};

export type SocietyState = {
  economy: number;
  politics: number;
  culture: number;
  crime: number;
  opportunity: number;
};

export type PlayerLineage = {
  founderId: PersonId;
  activePersonId: PersonId;
  generation: number;
  previousPlayerIds: PersonId[];
};

export type WorldChoice = {
  id: string;
  title: string;
  description: string;
  eventType?: LifeEventType;
  targetPersonId?: PersonId;
  relationshipTypes?: RelationshipType[];
  statEffects: Partial<Record<StatKey, number>>;
  relationshipEffects: Partial<Pick<Relationship, 'closeness' | 'trust' | 'respect' | 'conflict' | 'familiarity'>>;
  memoryTitle: string;
  memoryDescription: string;
  tags: string[];
};

export type WorldState = {
  seed: string;
  currentDate: SimDate;
  people: Record<PersonId, Person>;
  families: Record<FamilyId, Family>;
  households: Record<HouseholdId, Household>;
  institutions: Record<InstitutionId, Institution>;
  businesses: Record<BusinessId, PersistentBusiness>;
  relationships: Record<RelationshipId, Relationship>;
  lifeEvents: Record<LifeEventId, LifeEvent>;
  education: EducationState;
  playerLineage: PlayerLineage;
  society: SocietyState;
  milestones: string[];
};
