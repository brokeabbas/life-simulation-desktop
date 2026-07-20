import { z } from 'zod';
import { STAT_KEYS, TRAIT_IDS, type Choice, type Condition, type Effect, type GameEvent, type LifePhase } from './types';

const statEnum = z.enum(STAT_KEYS);
const traitEnum = z.enum(TRAIT_IDS);
const phaseEnum = z.enum(['child', 'teen', 'adult', 'retired'] satisfies readonly LifePhase[] as any);

// Conditions
const conditionSchema: z.ZodType<Condition> = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('ageAtLeast'), days: z.number().int().nonnegative() }),
  z.object({ kind: z.literal('ageAtMost'), days: z.number().int().nonnegative() }),
  z.object({ kind: z.literal('statAtLeast'), stat: statEnum, value: z.number() }),
  z.object({ kind: z.literal('statAtMost'), stat: statEnum, value: z.number() }),
  z.object({ kind: z.literal('hasTrait'), trait: traitEnum }),
  z.object({ kind: z.literal('notTrait'), trait: traitEnum }),
  z.object({ kind: z.literal('hasFlag'), flag: z.string() }),
  z.object({ kind: z.literal('notFlag'), flag: z.string() }),
  z.object({ kind: z.literal('phaseIs'), phase: phaseEnum }),
  z.object({ kind: z.literal('hasJob') }),
  z.object({ kind: z.literal('notJob') }),
  z.object({ kind: z.literal('jobLevelAtLeast'), level: z.number().int().nonnegative() }),
  z.object({ kind: z.literal('daysWorkedAtLeast'), days: z.number().int().nonnegative() }),
]);

// Effects
const effectSchema: z.ZodType<Effect> = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('deltaStat'), stat: statEnum, delta: z.number() }),
  z.object({ kind: z.literal('setStat'), stat: statEnum, value: z.number() }),
  z.object({ kind: z.literal('addTrait'), trait: traitEnum }),
  z.object({ kind: z.literal('removeTrait'), trait: traitEnum }),
  z.object({ kind: z.literal('setFlag'), flag: z.string(), value: z.boolean() }),
  z.object({ kind: z.literal('advanceDays'), days: z.number().int() }),
  z.object({ kind: z.literal('giveMoney'), amount: z.number() }),
  z.object({ kind: z.literal('setJob'), jobId: z.string(), level: z.number().int().optional() }),
  z.object({ kind: z.literal('promoteJob'), levels: z.number().int().optional() }),
  z.object({ kind: z.literal('fireJob') }),
]);

// Choices
const choiceSchema: z.ZodType<Choice> = z.object({
  id: z.string(),
  text: z.string(),
  conditions: z.array(conditionSchema).optional(),
  effects: z.array(effectSchema).optional(),
  weight: z.number().optional(),
});

// Event
export const eventSchema: z.ZodType<GameEvent> = z.object({
  id: z.string(),
  title: z.string(),
  text: z.string(),
  tags: z.array(z.string()).optional(),
  weight: z.number(),
  once: z.boolean().optional(),
  cooldownDays: z.number().int().optional(),
  when: z.array(conditionSchema).optional(),
  choices: z.array(choiceSchema).min(1),
});

export const eventsSchema = z.array(eventSchema);
