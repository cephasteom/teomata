import { writable } from "svelte/store"
import type { Cell, direction } from "./cells"

// A rule is a pure function from one grid state to the next. Rules get the
// whole grid because some, like movement, send a cell to a different square.
export type Rule = (cells: Cell[], size: number) => Cell[]

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

// Applied in order each tick
export const rules = writable<Rule[]>([move])
