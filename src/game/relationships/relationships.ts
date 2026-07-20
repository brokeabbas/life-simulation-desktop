import type {
  PersonId,
  Relationship,
  RelationshipId,
  RelationshipOrigin,
  RelationshipType,
  SimDate,
  WorldState,
} from '../world/types';

type RelationshipDelta = Partial<
  Pick<Relationship, 'closeness' | 'trust' | 'respect' | 'attraction' | 'conflict' | 'familiarity'>
>;

function clamp100(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function relationshipIdFor(a: PersonId, b: PersonId): RelationshipId {
  return [a, b].sort().join('__rel__');
}

export function getRelationship(world: WorldState, a: PersonId, b: PersonId) {
  return world.relationships[relationshipIdFor(a, b)] ?? null;
}

export function getRelationshipsForPerson(world: WorldState, personId: PersonId) {
  const person = world.people[personId];
  if (!person) return [];
  return person.relationshipIds
    .map((id) => world.relationships[id])
    .filter((relationship): relationship is Relationship => Boolean(relationship));
}

export function upsertRelationship(
  world: WorldState,
  personAId: PersonId,
  personBId: PersonId,
  options: {
    types: RelationshipType[];
    origin: RelationshipOrigin;
    originLabel: string;
    date: SimDate;
    deltas?: RelationshipDelta;
    history?: string;
    originEventId?: string;
  },
) {
  if (personAId === personBId) return null;

  const id = relationshipIdFor(personAId, personBId);
  const existing = world.relationships[id];
  const deltas = options.deltas ?? {};

  if (existing) {
    for (const type of options.types) {
      if (!existing.types.includes(type)) existing.types.push(type);
    }
    existing.closeness = clamp100(existing.closeness + (deltas.closeness ?? 0));
    existing.trust = clamp100(existing.trust + (deltas.trust ?? 0));
    existing.respect = clamp100(existing.respect + (deltas.respect ?? 0));
    existing.attraction = clamp100(existing.attraction + (deltas.attraction ?? 0));
    existing.conflict = clamp100(existing.conflict + (deltas.conflict ?? 0));
    existing.familiarity = clamp100(existing.familiarity + (deltas.familiarity ?? 0));
    existing.lastInteractionDate = options.date;
    if (options.history) existing.history.push(options.history);
    return existing;
  }

  const relationship: Relationship = {
    id,
    personAId,
    personBId,
    types: [...options.types],
    closeness: clamp100(20 + (deltas.closeness ?? 0)),
    trust: clamp100(20 + (deltas.trust ?? 0)),
    respect: clamp100(20 + (deltas.respect ?? 0)),
    attraction: clamp100(deltas.attraction ?? 0),
    conflict: clamp100(deltas.conflict ?? 0),
    familiarity: clamp100(20 + (deltas.familiarity ?? 0)),
    history: options.history ? [options.history] : [],
    origin: options.origin,
    originLabel: options.originLabel,
    originEventId: options.originEventId,
    lastInteractionDate: options.date,
  };

  world.relationships[id] = relationship;

  const personA = world.people[personAId];
  const personB = world.people[personBId];
  if (personA && !personA.relationshipIds.includes(id)) personA.relationshipIds.push(id);
  if (personB && !personB.relationshipIds.includes(id)) personB.relationshipIds.push(id);

  return relationship;
}
