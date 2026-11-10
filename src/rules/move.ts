import type { Cell } from "../stores/cells"
import { opposite, step } from "../lib/utils"
import type { GridRule } from "./_types"
import { SIZE } from "../stores/global"

// Moves every cell one step in its direction
// Copies cells where axes used (x,y,xy)
// Cells that would step past the edge of the grid die
// Head on collisions reverse direction
// Last cells wins multiple cell occupancy
export const move: GridRule = (cells) => {
    const next: Cell[] = Array.from({ length: cells.length }, () => ({}))
    cells.forEach(({ split, ...cell }, i) => {
        if (!cell.direction) {
            if (cell.value !== undefined) next[i] = cell
            return
        }
        for (const heading of [cell.direction, ...split ?? []]) {
            const ahead = step(i, heading, SIZE)
            const other = ahead === undefined ? undefined : cells[ahead].direction
            const collided = other !== undefined && other !== heading
            const direction = collided ? opposite[heading] : heading
            const to = step(i, direction, SIZE)
            if (to !== undefined) next[to] = { ...cell, direction }
        }
    })
    return next
}
