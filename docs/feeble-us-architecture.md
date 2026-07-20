# Feeble Us Architecture

## Current App Shape

Feeble Us is a React, Vite, TypeScript, Tauri-ready app. The existing app already had:

- A Zustand game store.
- A scalar `GameState` for player stats, jobs, events, history, traits, and flags.
- UI panels for stats, jobs, health/food, categories, and businesses.
- Seeded randomness for deterministic event and market generation.

The uploaded design brief requires the app to grow from a player-only event simulator into a persistent society simulation. The new architecture keeps the existing UI/store model but adds a persistent `WorldState` beside it.

## Core Modules

- `src/game/world`
  - Owns `WorldState`, `Person`, `Family`, `Household`, `Institution`, persistent business, society, date, lineage, and selectors.
- `src/game/relationships`
  - Owns the relationship graph, relationship IDs, relationship origins, and relationship updates.
- `src/game/lifeEvents`
  - Records durable life events and attaches important events as memories to involved people.
- `src/game/school`
  - Creates primary school, teachers, classmates, education records, and school choices.
- `src/game/choices`
  - Applies reusable choice effects to stats, relationships, memories, and life events.
- `src/game/simulation`
  - Advances world time, progresses NPC careers, creates partners/children, and performs lineage continuation.
- `src/game/ui/WorldDashboard.tsx`
  - Provides the current playable/debug vertical slice.

## Data Model Direction

Every major person is now a persistent `Person` with:

- Stable ID, name, gender, birth/death dates, status.
- Parents, children, siblings, partners, spouse, household, and family.
- Education and employment history.
- Wealth, income, health, traits, stats, reputation, goals.
- Memories, life events, and relationship links.

Relationships are stored as graph edges with:

- Types such as parent, child, friend, classmate, teacher, spouse, rival, and generational link.
- Closeness, trust, respect, attraction, conflict, familiarity.
- Origin and origin label, such as `met in primary school` or `your father knew their father from primary school`.

Life events are stored globally and attached to people as memories when important.

## Current Playable Priority

The second product update narrows the immediate milestone: make one character's life deep and playable from birth to death before expanding next-generation play. The generational architecture remains, but the main UI now routes simulation through the existing category tabs.

Category integration now works like this:

- `Health / Food`, `Job`, `Career`, and `Business` keep their existing richer panels.
- `Education`, `Government`, `Assets`, `Bank`, `Lifestyle`, `Properties`, `Media`, `Relationship`, `Pets`, `Will`, `Lottery`, `Shop`, and `Become Infamous` use the reusable life-category panel.
- Each category action can alter stats, money, relationships, life events, and memories.
- Available actions are gated by life stage, age, active relationships, and affordability.
- The `Will` category supports retirement, relationship repair, will-writing, death, and a generated life summary.

## Vertical Slice

The implemented foundation supports:

1. Creating a seeded world.
2. Generating a player born into a family household.
3. Generating parents and parent-child relationships.
4. Advancing to childhood.
5. Starting primary school.
6. Generating persistent classmates and a teacher.
7. Making school choices that affect stats and relationships.
8. Creating a real childhood friend through the relationship graph.
9. Advancing classmates into adulthood and careers.
10. Giving the childhood friend a child.
11. Giving the player a child.
12. Continuing as the player's child later, when legacy play becomes the focus.
13. Preserving historical recognition between generations.

The category tabs are now the primary play surface for the current single-life milestone.

## Integration Notes

The existing `GameState` still powers older UI panels, but it now contains `world: WorldState`. The active person's stats, traits, gender, age, and date are synchronized back into the existing sidebar and category systems. Older saves without a world are migrated by creating a new `WorldState` from the saved seed and gender.
