import type { GridRule } from "./types"

// Empties every cell whose value has come to 0, so it stops moving
// An array value is kept, even when its numbers are all 0
export const zero: GridRule = cells => cells.map(cell => cell.value === 0 ? {} : cell)
