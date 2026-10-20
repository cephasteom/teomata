import { writable } from "svelte/store"
import type { Cell, direction } from "./cells"
import { opposite, step } from "../lib/utils"
import { ticksPerBar } from "./global"

// A rule is a pure function from one grid state to the next. Rules get the
// whole grid because some, like movement, send a cell to a different square.
// Letters are the per-square letters, which some rules read. Tick is the
// number of ticks since the transport started, for rules that keep time.
export type Rule = (cells: Cell[], size: number, letters: string[], tick: number) => Cell[]

// Moves every cell one step in its direction
// Cells wrap around the boundary of the grid
// Head on collisions reverse direction
// Last cells wins multiple cell occupancy
export const move: Rule = (cells, size) => {
    const next: Cell[] = Array.from({ length: cells.length }, () => ({}))
    cells.forEach((cell, i) => {
        if (!cell.direction) {
            if (cell.value !== undefined) next[i] = cell
            return
        }
        const other = cells[step(i, cell.direction, size)].direction
        const collided = other !== undefined && other !== cell.direction
        const direction = collided ? opposite[cell.direction] : cell.direction
        next[step(i, direction, size)] = collided ? { ...cell, direction } : cell
    })
    return next
}

// What a square with a given letter does to the cell on it each tick
// The cell is {} when the square is empty
export type LetterRule = (cell: Cell, tick: number) => Cell

const turn = (to: direction): LetterRule => cell =>
    cell.direction ? { ...cell, direction: to } : cell
const reverse: LetterRule = cell =>
    cell.direction ? { ...cell, direction: opposite[cell.direction] } : cell

// Puts a new cell heading in the given direction on the square every freq bars
// The next move carries it onto the neighbouring square like any other cell
// freq is in bars, so 1 is once a bar and .5 is twice a bar
// Fires on the first tick at or after each trigger, and at most once a tick
export const bang = (freq = 1, to: direction = "e"): LetterRule => (cell, tick) =>
    tick % (freq * ticksPerBar) < 1 ? { value: 1, direction: to } : cell

export const letterRules: Record<string, LetterRule> = {
    // Turn to face the letter's direction
    n: turn("n"),
    s: turn("s"),
    e: turn("e"),
    w: turn("w"),
    r: reverse,
    b: bang(),
}

// Applies the letter rule for every square with a letter
// The letter's case is ignored
export const applyLetters: Rule = (cells, _size, letters, tick) =>
    cells.map((cell, i) => {
        const rule = letters[i] && letterRules[letters[i].toLowerCase()]
        return rule ? rule(cell, tick) : cell
    })

// Applied in order each tick
export const rules = writable<Rule[]>([move, applyLetters])
