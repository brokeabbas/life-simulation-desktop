import { getRelationshipsForPerson } from '../relationships/relationships';
import { ageInYears } from './date';
import type { LifeEvent, Person, Relationship, WorldState } from './types';

export function getActivePerson(world: WorldState) {
  return world.people[world.playerLineage.activePersonId] ?? null;
}

export function fullName(person: Person | null | undefined) {
  return person ? `${person.firstName} ${person.lastName}` : 'Unknown';
}

export function getActiveAge(world: WorldState) {
  const person = getActivePerson(world);
  return person ? ageInYears(person.birthDate, world.currentDate) : 0;
}

export function getParents(world: WorldState, person: Person | null) {
  if (!person) return [];
  return person.parentIds
    .map((id) => world.people[id])
    .filter((parent): parent is Person => Boolean(parent));
}

export function getChildren(world: WorldState, person: Person | null) {
  if (!person) return [];
  return person.childIds
    .map((id) => world.people[id])
    .filter((child): child is Person => Boolean(child));
}

export function getRecentLifeEvents(world: WorldState, limit = 6): LifeEvent[] {
  return Object.values(world.lifeEvents).slice(-limit).reverse();
}

export function getRelationshipSummaries(world: WorldState, person: Person | null, limit = 6) {
  if (!person) return [];
  return getRelationshipsForPerson(world, person.id)
    .map((relationship) => {
      const otherId = relationship.personAId === person.id ? relationship.personBId : relationship.personAId;
      return { relationship, other: world.people[otherId] };
    })
    .filter((item): item is { relationship: Relationship; other: Person } => Boolean(item.other))
    .sort((a, b) => b.relationship.familiarity + b.relationship.closeness - (a.relationship.familiarity + a.relationship.closeness))
    .slice(0, limit);
}

export function getChildhoodFriend(world: WorldState, person: Person | null) {
  if (!person) return null;
  return getRelationshipsForPerson(world, person.id)
    .filter((relationship) => relationship.types.includes('friend'))
    .map((relationship) => {
      const otherId = relationship.personAId === person.id ? relationship.personBId : relationship.personAId;
      return { relationship, friend: world.people[otherId] };
    })
    .find((item) => item.friend && item.relationship.originLabel.toLowerCase().includes('primary school')) ?? null;
}

export function getGenerationalRecognition(world: WorldState, person: Person | null) {
  if (!person) return null;
  return getRelationshipsForPerson(world, person.id)
    .filter((relationship) => relationship.types.includes('generational_link'))
    .map((relationship) => {
      const otherId = relationship.personAId === person.id ? relationship.personBId : relationship.personAId;
      return { relationship, other: world.people[otherId] };
    })
    .find((item) => Boolean(item.other)) ?? null;
}
