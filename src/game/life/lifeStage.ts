import { ageInYears } from '../world/date';
import type { Person, WorldState } from '../world/types';

export type LifeStage =
  | 'birth'
  | 'early_childhood'
  | 'primary_school'
  | 'secondary_school'
  | 'post_school'
  | 'young_adult'
  | 'adult'
  | 'middle_age'
  | 'late_career'
  | 'retired'
  | 'old_age'
  | 'deceased';

export const LIFE_STAGE_LABEL: Record<LifeStage, string> = {
  birth: 'Birth',
  early_childhood: 'Early Childhood',
  primary_school: 'Primary School',
  secondary_school: 'Teenage Years',
  post_school: 'Post-School Path',
  young_adult: 'Young Adulthood',
  adult: 'Adult Life',
  middle_age: 'Middle Age',
  late_career: 'Late Career',
  retired: 'Retirement',
  old_age: 'Old Age',
  deceased: 'Life Complete',
};

export function lifeStageForAge(age: number, status: Person['status'] = 'living'): LifeStage {
  if (status === 'dead') return 'deceased';
  if (age < 1) return 'birth';
  if (age < 5) return 'early_childhood';
  if (age < 12) return 'primary_school';
  if (age < 18) return 'secondary_school';
  if (age < 22) return 'post_school';
  if (age < 35) return 'young_adult';
  if (age < 50) return 'adult';
  if (age < 62) return 'middle_age';
  if (age < 70) return 'late_career';
  if (age < 80) return 'retired';
  return 'old_age';
}

export function getActiveLifeStage(world: WorldState): LifeStage {
  const person = world.people[world.playerLineage.activePersonId];
  if (!person) return 'deceased';
  return lifeStageForAge(ageInYears(person.birthDate, world.currentDate), person.status);
}
