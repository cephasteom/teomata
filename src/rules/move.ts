import type { Cell } from "../stores/cells"
import { opposite, step } from "../lib/utils"
import type { GridRule } from "./types"

// Moves every cell one step in its direction
// Cells that would step past the edge of the grid die
// Head on collisions reverse direction
// Last cells wins multiple cell occupancy
export const move: GridRule = (cells, size) => {
    const next: Cell[] = Array.from({ length: cells.length }, () => ({}))
    cells.forEach((cell, i) => {
        if (!cell.direction) {
            if (cell.value !== undefined) next[i] = cell
            return
        }
        const ahead = step(i, cell.direction, size)
        const other = ahead === undefined ? undefined : cells[ahead].direction
        const collided = other !== undefined && other !== cell.direction
        const direction = collided ? opposite[cell.direction] : cell.direction
        const to = step(i, direction, size)
        if (to !== undefined) next[to] = collided ? { ...cell, direction } : cell
    })
    return next
}
