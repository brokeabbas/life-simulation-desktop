import { recordLifeEvent } from '../lifeEvents/lifeEvents';
import { upsertRelationship } from '../relationships/relationships';
import type { StatKey } from '../types';
import type { WorldChoice, WorldState } from '../world/types';

function clampStat(stat: StatKey, value: number) {
  if (stat === 'wealth') return Math.max(0, Math.round(value));
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function applyWorldChoice(world: WorldState, choice: WorldChoice) {
  const active = world.people[world.playerLineage.activePersonId];
  if (!active) return false;

  for (const [key, delta] of Object.entries(choice.statEffects)) {
    const stat = key as StatKey;
    active.stats[stat] = clampStat(stat, (active.stats[stat] ?? 0) + Number(delta ?? 0));
  }

  active.health = active.stats.health;
  active.wealth = active.stats.wealth;
  active.reputation = active.stats.reputation;

  if (choice.targetPersonId) {
    const relationship = upsertRelationship(world, active.id, choice.targetPersonId, {
      types: choice.relationshipTypes ?? ['classmate'],
      origin: 'choice',
      originLabel: choice.memoryDescription,
      date: world.currentDate,
      deltas: choice.relationshipEffects,
      history: choice.memoryDescription,
    });

    if (relationship?.types.includes('friend')) {
      relationship.origin = relationship.origin === 'choice' ? 'primary_school' : relationship.origin;
      relationship.originLabel = 'became friends during primary school';
    }
  }

  recordLifeEvent(world, {
    type: choice.eventType ?? 'school_choice',
    personIds: choice.targetPersonId ? [active.id, choice.targetPersonId] : [active.id],
    description: choice.memoryDescription,
    consequences: [
      ...Object.entries(choice.statEffects).map(([stat, delta]) => `${stat} ${Number(delta) >= 0 ? '+' : ''}${delta}`),
      choice.targetPersonId ? 'Relationship history updated.' : 'Personal development updated.',
    ],
    tags: choice.tags,
    importantMemory: true,
    memoryTitle: choice.memoryTitle,
  });

  world.milestones.push(choice.memoryDescription);
  return true;
}
