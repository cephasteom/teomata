import { writable } from "svelte/store"
import type { Cell, direction } from "./cells"

// A rule is a pure function from one grid state to the next. Rules get the
// whole grid because some, like movement, send a cell to a different square.
// Letters are the per-square letters, which some rules read.
export type Rule = (cells: Cell[], size: number, letters: string[]) => Cell[]

const offsets: Record<direction, [number, number]> = {
    n: [0, -1],
    s: [0, 1],
    e: [1, 0],
    w: [-1, 0],
}

const opposite: Record<direction, direction> = { n: 's', s: 'n', e: 'w', w: 'e' }

// Moves every cell one step in its direction
// Cells wrap around the boundary of the grid
// Head on collisions reverse direction
// Last cells wins multiple cell occupancy
export const move: Rule = (cells, size) => {
    const step = (i: number, direction: direction) => {
        const [dx, dy] = offsets[direction]
        const x = (i % size + dx + size) % size
        const y = (Math.floor(i / size) + dy + size) % size
        return y * size + x
    }

    const next: Cell[] = Array.from({ length: cells.length }, () => ({}))
    cells.forEach((cell, i) => {
        if (!cell.direction) {
            if (cell.value !== undefined) next[i] = cell
            return
        }
        const other = cells[step(i, cell.direction)].direction
        const collided = other !== undefined && other !== cell.direction
        const direction = collided ? opposite[cell.direction] : cell.direction
        next[step(i, direction)] = collided ? { ...cell, direction } : cell
    })
    return next
}

const isDirection = (letter: string): letter is direction => letter in offsets

// Turns cells landing on an n, s, e or w square to face that way
// The letter's case is ignored
export const redirect: Rule = (cells, _size, letters) =>
    cells.map((cell, i) => {
        const letter = letters[i]?.toLowerCase() ?? ""
        return cell.direction && isDirection(letter) ? { ...cell, direction: letter } : cell
    })

// Applied in order each tick
export const rules = writable<Rule[]>([move, redirect])
