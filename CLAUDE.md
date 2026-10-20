# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Teomata is a cellular automaton where custom rules can be added on the fly. The automaton's tick is driven by a musical clock (Tone.js), so steps happen in time with audio. It is an early-stage Svelte 5 + TypeScript + Vite single-page app (not SvelteKit).

## Commands

- `npm run dev`: start the Vite dev server
- `npm run build`: production build
- `npm run preview`: serve the production build
- `npm run check`: type-check (`svelte-check` for `src/` using `tsconfig.app.json`, plus `tsc` for the Vite/node config)

There is no test runner or linter set up yet. `npm run check` is the only verification step.

## Architecture

State lives in Svelte stores under `src/stores/`, and the components and the scheduler share them:

- `stores/global.ts`: app-wide settings (`isPlaying`, `gridSize`).
- `stores/cells.ts`: the grid. It is a **flat** `Cell[]` of length `gridSize²`, randomly seeded at module load (about 10% of cells get `value: 1` and a random cardinal `direction`). An empty cell is `{}`. `updateCells()` applies the rule chain.
- `stores/rules.ts`: the rule chain. A `Rule` is a pure `(cells, size) => Cell[]` function over the whole grid, and the `rules` store holds the ordered list that `updateCells()` reduces over each tick. `move` (step each cell in its direction, wrapping around the edges; cells that would hit each other bounce off, and cells landing on the same square overwrite each other) is the first rule.

`src/scheduler.ts` owns timing. At import time it creates a Tone.js `Loop` on a `"16n"` interval, and `toggle()` starts or stops the Tone transport and flips `isPlaying`. Each loop tick calls `updateCells()` via `getDraw().schedule` so the visual update lands on the audible tick. `toggle()` calls Tone's `start()` first because the audio context needs a user gesture.

Stores are read outside components with `get(store)` from `svelte/store`. Components use the `$store` auto-subscription syntax together with Svelte 5 event attributes (`onclick={...}`).
