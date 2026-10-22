import type { CellRule, Operation } from "./types"
import { about } from "./instructions"

// Removes the cell on the square
const createDie = (): CellRule => () => ({})

export const die: Operation = {
    name: "die",
    about: about.die.about,
    params: [],
    rule: createDie,
}
