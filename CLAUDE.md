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

- `stores/global.ts`: app-wide settings (`isPlaying`, `gridSize`) and the `ticksPerBar` constant.
- `stores/cells.ts`: the grid. It is a **flat** `Cell[]` of length `gridSize²`, randomly seeded at module load (about 5% of cells get `value: 1` and a random cardinal `direction`). An empty cell is `{}`. `updateCells()` reduces the grid over the rule chain from `src/rules/`; `clearCells()` and `randomizeCells()` empty or reseed it.
- `stores/operations.ts`: one operation per square (`""` for none), typed at the cursor. Operations belong to the square, not the cell, so cells move over them. `args` holds each square's operation arguments as text (`string[]` per square), cleared when the square's operation changes.
- `stores/editing.ts`: the argument editor. Enter on a square with an operation opens it (`editing`); every other square hides apart from one square per param, to the right of the operation or to the left if the row runs out (`argSquares`). Typing replaces the argument under the cursor and then appends, left/right move between the open squares, and Enter or Escape closes it, restoring the selection. With several squares selected, the editor opens on the cursor's square and each edited argument is also written to every selected square with the same operation.
### Rules (`src/rules/`)

Each rule lives in its own file (`move.ts`, `turn.ts`, `reverse.ts`, `die.ts`, `bang.ts`, `life.ts`). The shared types (`GridRule`, `CellRule`, `Param`, `Operation`) are in `rules/types.ts`. `rules/index.ts` wires them together: the `fixed` helper, the `operations` table, `applyRules`, `paramsFor`, `argsFor`, and the exported `rules` chain. The chain is a plain array, not a store.

- A `GridRule` is a pure `(cells, size, operations, args, tick) => Cell[]` function over the whole grid. `rules` is `[move, applyRules]`, and `updateCells()` reduces over it each tick.
- `move` steps each cell in its direction, wrapping around the edges. Cells that would hit each other bounce off, and cells landing on the same square overwrite each other.
- `applyRules` is a single pass that looks up each square's operation (case-insensitive) in the `operations` table. An `Operation` has `params` (each with a `name`, `about` text, a text `fallback` and an `accepts` check) and a `rule` that builds a per-square `CellRule` `(cell, tick, neighbours) => Cell` from its arguments. Any missing or invalid argument uses its fallback. The cell is `{}` on an empty square, and `neighbours` are the cells on the eight wrapping squares around it, read from the grid before any operation applies.
- Operations: `n`, `s`, `e` and `w` (`turn`) turn a moving cell to face that way, `r` (`reverse`) turns it around, and `d` (`die`) removes whatever cell is on the square. `b` is `bang` (params `bars`, default 1, and `direction`, default east), which puts a new cell heading that way on the square every `bars` bars for `move` to carry off. `g` is `life`, the classic Game of Life rules: neighbours (on any square) count as alive when they have a `value`, a cell survives with 2 or 3, and an empty square gets a new still cell with exactly 3.
- To add an operation, write it in its own file and add an entry to `operations` in `rules/index.ts` (`fixed(rule)` for one without params). Rules that need the whole grid go in the `rules` chain as full `GridRule`s.

Shared direction helpers (`step` for a wrapping one-square move, `neighbours` for the eight squares around one, `opposite`, `isDirection`, `randomDirection`) live in `src/lib/utils.ts`.

`src/scheduler.ts` owns timing. At import time it creates a Tone.js `Loop` firing `ticksPerBar` times a bar (`"8n"`) and counts ticks since the transport started (reset on stop), and `toggle()` starts or stops the Tone transport and flips `isPlaying`. Each loop tick calls `updateCells(tick)` via `getDraw().schedule` so the visual update lands on the audible tick. `toggle()` calls Tone's `start()` first because the audio context needs a user gesture.

Stores are read outside components with `get(store)` from `svelte/store`. Components use the `$store` auto-subscription syntax together with Svelte 5 event attributes (`onclick={...}`).
