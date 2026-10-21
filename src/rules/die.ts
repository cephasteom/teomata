import type { CellRule, Operation } from "./types"

// Removes the cell on the square
const createDie = (): CellRule => () => ({})

export const die: Operation = {
    name: "die",
    about: "Removes any cell on the square.",
    params: [],
    rule: createDie,
}
