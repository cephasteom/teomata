# Teomata
A cellular automata where you can add custom rules on the fly.

## Local Development
This project was built with Vite/Svelte. To develop locally:
* `npm i`
* `npm run dev`

## How it works
The grid is a flat list of cells. Each cell is either empty or has a value and, if it's moving, a direction (n, s, e or w). Every square can also hold an **operation**, a letter typed at the cursor, which belongs to the square rather than the cell, so cells pass over it.

A Tone.js loop drives the automaton, ticking eight times a bar, so each step lands in time with the audio. On every tick the grid runs through a chain of rules (`src/rules/`):

1. **move**: every moving cell steps one square in its direction, wrapping around the edges and bouncing off cells it would hit.
2. **operations**: every square with an operation transforms the cell on it.

| Operation | Effect |
| --- | --- |
| `n` `s` `e` `w` | Turn a moving cell to face that way |
| `r` | Reverse a moving cell |
| `d` | Remove the cell |
| `b` | Bang: emit a new cell every `bars` bars heading in `direction` |
| `g` | Apply the Game of Life rules to the square |

Some operations take arguments. Press Enter on a square to edit them; missing or invalid arguments fall back to defaults.

State lives in Svelte stores (`src/stores/`): the cells, the operations and their arguments, the cursor and the argument editor. `src/scheduler.ts` owns the clock.

To add an operation, write a rule in its own file under `src/rules/` and register it in the `operations` table in `src/rules/index.ts`.
