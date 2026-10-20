import { writable } from "svelte/store"
import type { Cell, direction } from "./cells"
import { isDirection, opposite, step } from "../lib/utils"
import { ticksPerBar } from "./global"

// A rule is a pure function from one grid state to the next. Rules get the
// whole grid because some, like movement, send a cell to a different square.
// Letters are the per-square letters, and args the arguments typed in for
// each square's letter, which some rules read. Tick is the number of ticks
// since the transport started, for rules that keep time.
export type Rule = (cells: Cell[], size: number, letters: string[], args: string[][], tick: number) => Cell[]

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

// Removes the cell on the square
const die: LetterRule = () => ({})

// Puts a new cell heading in the given direction on the square every freq bars
// The next move carries it onto the neighbouring square like any other cell
// freq is in bars, so 1 is once a bar and .5 is twice a bar
// Fires on the first tick at or after each trigger, and at most once a tick
export const bang = (freq = 1, to: direction = "e"): LetterRule => (cell, tick) =>
    tick % (freq * ticksPerBar) < 1 ? { value: 1, direction: to } : cell

// An argument a letter takes. Arguments are typed in as text, so a param
// says which text it accepts and what to use when it isn't given or valid
export interface Param {
    name: string
    about: string
    fallback: string
    accepts: (text: string) => boolean
}

// A letter's params, and how to build its rule from their arguments
export interface Letter {
    params: Param[]
    rule: (...args: string[]) => LetterRule
}

const fixed = (rule: LetterRule): Letter => ({ params: [], rule: () => rule })

const bars: Param = {
    name: "bars",
    about: "How many bars between bangs. 1 is once a bar and .5 is twice a bar.",
    fallback: "1",
    accepts: text => text !== "" && Number.isFinite(Number(text)) && Number(text) > 0,
}

const heading: Param = {
    name: "direction",
    about: "Which way the new cell heads: n, s, e or w.",
    fallback: "e",
    accepts: text => isDirection(text.toLowerCase()),
}

export const letterRules: Record<string, Letter> = {
    // Turn to face the letter's direction
    n: fixed(turn("n")),
    s: fixed(turn("s")),
    e: fixed(turn("e")),
    w: fixed(turn("w")),
    r: fixed(reverse),
    d: fixed(die),
    b: { params: [bars, heading], rule: (freq, to) => bang(Number(freq), to.toLowerCase() as direction) },
}

// The params a letter takes, which is none for letters without a rule
export const paramsFor = (letter: string) => letterRules[letter.toLowerCase()]?.params ?? []

// The given arguments for a letter, with defaults filling in any missing ones
export const argsFor = (letter: string, given: string[] = []) =>
    paramsFor(letter).map((param, k) => given[k] ?? param.fallback)

// Applies the letter rule for every square with a letter
// The letter's case is ignored, and invalid arguments fall back to defaults
export const applyLetters: Rule = (cells, _size, letters, args, tick) =>
    cells.map((cell, i) => {
        const letter = letters[i] && letterRules[letters[i].toLowerCase()]
        if (!letter) return cell
        const valid = letter.params.map((param, k) =>
            args[i]?.[k] !== undefined && param.accepts(args[i][k]) ? args[i][k] : param.fallback
        )
        return letter.rule(...valid)(cell, tick)
    })

// Applied in order each tick
export const rules = writable<Rule[]>([move, applyLetters])
