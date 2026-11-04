# CLAUDE.md

Guidance for Claude Code in this repository.

## Project

Teomata is a cellular automaton of single-letter operations on a grid, ticked by a musical clock (Tone.js) and sending MIDI (WebMidi). Svelte 5 + TypeScript + Vite single-page app (not SvelteKit).

## Commands

- `npm run dev` / `npm run build` / `npm run preview`
- `npm run check`: type-check. There is no test runner or linter; this is the only verification step.

## rules.md

`rules.md` is the user-facing spec of every operation (signature, defaults, display). Keep it in step with the code when an operation changes, but **don't refactor or restructure it unless necessary**, and don't pad it with comprehensive instructions or implementation detail. Keep entries short and in its existing style.

## Architecture

State lives in Svelte stores under `src/stores/`, shared by components and the scheduler. Outside components, read stores with `get(store)`; in components use `$store` and Svelte 5 event attributes (`onclick={...}`).

- `stores/global.ts`: `isPlaying`, fixed grid `SIZE` (64), `zoom`, `cps` (bars per second), `q` (ticks per bar), `showConsole`, `showInstructions`, with min/max constants.
- `stores/cells.ts`: the grid as a **flat** `Cell[]` of `SIZE²`. A cell's `value` is a number, a bang (`'b'`), or a number array; empty cell is `{}`. `stepCells(tick)` steps a module-level `grid` through the `rules` chain ahead of the screen; `showCells` draws it unless `setCells` bumped `version` since.
- `stores/operations.ts`: one operation letter per square (`operations`), its arguments as text (`args`), and input lines (`expansions`, derived `inputs`). Operations belong to squares; cells move over them. `fitExpansions` keeps input lines valid after edits.
- `stores/cursor.ts`: cursor, anchor and rectangular selection.
- `stores/editing.ts`: the argument editor (Enter on an operation). Edited squares keep running their old args until it closes (`holdOperations`).
- `stores/history.ts`: undo/redo of operations, args and expansions, via `change(make)` or `snapshot()`/`record()`.
- `stores/console.ts`: lines printed by `p`.
- `stores/persist.ts`: restores and saves settings, operations, args and expansions in `localStorage` (`teomata:` keys). Imported by `main.ts` before mount.
- `lib/midi.ts`: device stores, `playNote`, `sendControl`, `midiTime`. `lib/utils.ts`: directions/headings, `BANG`, `toNumber`, `step`. `lib/arithmetic.ts`: arg arithmetic and display formatting. `lib/harmony.ts`: chords and scales.
- `src/scheduler.ts`: a Tone `Loop` firing `q` times a bar at `cps`. Each tick runs `stepCells` in the lookahead, sends MIDI at `midiTime(time)`, and draws/prints via `getDraw().schedule`. `toggle()` starts/stops the transport (Space).
- Components: `Grid.svelte` (grid, keyboard, zoom, labels, borders, input outlines), `Controls.svelte` + `NumberSquare.svelte`, `Devices.svelte`, `Console.svelte`, `Instructions.svelte`.

## Rules (`src/rules/`)

- `types.ts`: `Operation`, `Param`, `CellRule`, `GridRule`, `Context`, `Input`. `shared.ts`: param builders and helpers (`named`, `directionParam`, `rateParam`, `resetParam`, `argFrom`, `fires`, `isMoving`, mode params). `events.ts`: `emit` for `note`, `cc`, `print`, `arg`, `absorb` events (rules never send MIDI or print directly).
- `index.ts`: the `operations` table (**case matters**: generators uppercase, operators/outputs lowercase), `withMode` (every operation gets a final `mode` param: `on`/`off`, outputs also `thru`), `paramsFor`, `labelFor`, `instructions`, and `rules = [move, applyRules]`.
- `applyRules` per tick: inputs take moving cells and set args, generators emit, then each square's built `CellRule` runs. Built rules persist until their operation or args change (rebuilt on tick 0), so they can keep state in closures; `keep`/`carry` hand state to a rebuilt rule, `stop` resets on transport stop.
- `instructions.ts`: all `about` text (shown as HTML), keyed by letter.

To add an operation: write it in its own file exporting an `Operation`, add its `about` text to `instructions.ts`, register it in `operations` in `index.ts`, and add a short entry to `rules.md`.
