import type {
  LifeEvent,
  LifeEventId,
  LifeEventType,
  Memory,
  PersonId,
  SimDate,
  WorldState,
} from '../world/types';

function nextEventId(world: WorldState, type: LifeEventType): LifeEventId {
  const count = Object.keys(world.lifeEvents).length + 1;
  return `event_${type}_${count}`;
}

export function recordLifeEvent(
  world: WorldState,
  input: {
    type: LifeEventType;
    date?: SimDate;
    personIds: PersonId[];
    locationId?: string;
    description: string;
    consequences?: string[];
    tags?: string[];
    importantMemory?: boolean;
    memoryTitle?: string;
  },
) {
  const event: LifeEvent = {
    id: nextEventId(world, input.type),
    date: input.date ?? world.currentDate,
    type: input.type,
    personIds: input.personIds,
    locationId: input.locationId,
    description: input.description,
    consequences: input.consequences ?? [],
    tags: input.tags ?? [],
    importantMemory: input.importantMemory ?? false,
  };

  world.lifeEvents[event.id] = event;

  for (const personId of input.personIds) {
    const person = world.people[personId];
    if (!person) continue;
    person.lifeEventIds.push(event.id);

    if (event.importantMemory) {
      const memory: Memory = {
        id: `memory_${event.id}_${personId}`,
        eventId: event.id,
        date: event.date,
        title: input.memoryTitle ?? event.type.replace(/_/g, ' '),
        description: event.description,
        importance: 80,
        emotionalTone: 'mixed',
        relatedPersonIds: input.personIds.filter((id) => id !== personId),
        tags: event.tags,
      };
      person.memories.push(memory);
    }
  }

  return event;
}
