import type { Cell } from "../stores/cells"
import { opposite, step } from "../lib/utils"
import type { GridRule } from "./rule"

// Moves every cell one step in its direction
// Cells wrap around the boundary of the grid
// Head on collisions reverse direction
// Last cells wins multiple cell occupancy
export const move: GridRule = (cells, size) => {
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
