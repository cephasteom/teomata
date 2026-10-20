import { writable } from "svelte/store"
import type { Cell } from "./cells"
import { isDirection, opposite, step } from "../lib/utils"

// A rule is a pure function from one grid state to the next. Rules get the
// whole grid because some, like movement, send a cell to a different square.
// Letters are the per-square letters, which some rules read.
export type Rule = (cells: Cell[], size: number, letters: string[]) => Cell[]

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

// Turns cells landing on an n, s, e or w square to face that way
// The letter's case is ignored
export const redirect: Rule = (cells, _size, letters) =>
    cells.map((cell, i) => {
        const letter = letters[i]?.toLowerCase() ?? ""
        return cell.direction && isDirection(letter) ? { ...cell, direction: letter } : cell
    })

// Turns cells landing on an r square around to face the way they came
// The letter's case is ignored
export const reverse: Rule = (cells, _size, letters) =>
    cells.map((cell, i) =>
        cell.direction && letters[i]?.toLowerCase() === "r"
            ? { ...cell, direction: opposite[cell.direction] }
            : cell
    )

// Applied in order each tick
export const rules = writable<Rule[]>([move, redirect, reverse])
