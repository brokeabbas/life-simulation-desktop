# Feeble Us — Life and Society Simulation

Feeble Us is a desktop-ready life simulation in which characters, families,
relationships, education, careers, businesses, memories, and social history
persist as the world advances.

The current milestone focuses on making one character's life playable from birth
to death while retaining the foundations for generational play.

## Highlights

- Seeded simulation for repeatable worlds and events
- Persistent people, families, households, institutions, and businesses
- Relationship graph with trust, respect, attraction, conflict, and history
- Education, employment, health, lifestyle, relationship, and business systems
- Durable life events and character memories
- Save migration for older game-state formats
- Tauri desktop shell with a React and TypeScript interface

## Architecture

The application combines a Zustand-backed player state with a persistent
`WorldState`. Domain modules own world generation, relationships, life events,
school, reusable choices, simulation progression, and UI-specific systems.

See [the architecture notes](./docs/feeble-us-architecture.md) for the data model,
module boundaries, and current vertical slice.

## Technology

- React 19 and TypeScript
- Zustand and Immer
- Zod for runtime validation
- Vite
- Tauri 2 and Rust

## Run locally

Requirements: a current Node.js installation plus the Tauri prerequisites for
your operating system.

```bash
npm install
npm run dev
```

Run the desktop application:

```bash
npm run tauri dev
```

Create a production web build:

```bash
npm run build
```

## Current status

This is an active work in progress. The single-life simulation is the current
product priority; deeper generational play, balancing, automated tests, and
packaged releases remain on the roadmap.
