import type { Value } from "../stores/cells"
import type { CellRule, Operation } from "./types"

// An array value counts as the average of its numbers
const average = (value: Value) =>
    Array.isArray(value) ? value.reduce((sum, n) => sum + n, 0) / (value.length || 1) : value

// Applies the Game of Life rules to the square
// A cell on the square survives with two or three live neighbours, and an
// empty square gets a new, still cell with exactly three, valued at their average
// Neighbours count wherever they are, whether or not their square has a g
const createLife = (): CellRule => (cell, _tick, neighbours) => {
    const alive = neighbours.flatMap(other => other.value !== undefined ? [average(other.value)] : [])
    if (cell.value !== undefined) return alive.length === 2 || alive.length === 3 ? cell : {}
    return alive.length === 3 ? { value: Math.round((alive[0] + alive[1] + alive[2]) / 3) } : cell
}

export const life: Operation = {
    name: "gol",
    about: "Apply game of life rules to cell.",
    params: [],
    rule: createLife,
}
