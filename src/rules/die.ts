import type { CellRule, Operation } from "./_types"
import { about } from "./_instructions"

// Nullifies whatever cell is on the square
const createDie = (): CellRule => () => ({})

export const die: Operation = {
    name: "die",
    kind: "operator",
    about: about.d.about,
    params: [],
    rule: createDie,
}
