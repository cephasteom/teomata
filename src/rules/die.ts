import type { CellRule, Operation } from "./types"

// Removes the cell on the square
const createDie = (): CellRule => () => ({})

export const die: Operation = {
    name: "die",
    about: "Nullify value.",
    params: [],
    rule: createDie,
}
