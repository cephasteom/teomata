import type { CellRule, Operation } from "./types"

// Applies the Game of Life rules to the square
// A cell on the square survives with two or three live neighbours, and an
// empty square gets a new, still cell with exactly three
// Neighbours count wherever they are, whether or not their square has a g
const createLife = (): CellRule => (cell, _tick, neighbours) => {
    const alive = neighbours.filter(other => other.value !== undefined).length
    if (cell.value !== undefined) return alive === 2 || alive === 3 ? cell : {}
    return alive === 3 ? { value: 1 } : cell
}

export const life: Operation = {
    name: "game of life",
    about: "A cell here survives with 2 or 3 live neighbours, and an empty square gets a new cell with exactly 3.",
    params: [],
    rule: createLife,
}
