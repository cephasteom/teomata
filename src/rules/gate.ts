import { toNumber } from "../lib/utils"
import type { CellRule, Operation, Param } from "./_types"
import { isMoving, isNumber } from "./_shared"
import { about } from "./_instructions"

// Lets through a moving cell whose value matches, and empties the cell when it
// doesn't. An array value matches when every one of its numbers does, and a
// bang counts as a 1
const createGate = (match: number): CellRule => cell => {
    if (!isMoving(cell)) return cell
    const matches = (value: number) => value === match
    const passed = Array.isArray(cell.value) ? cell.value.every(matches) : matches(toNumber(cell.value!))
    return passed ? cell : {}
}

const match: Param = {
    name: "match",
    about: about.g.params.match,
    fallback: "1",
    accepts: isNumber,
}

export const gate: Operation = {
    name: "gate",
    kind: "operator",
    about: about.g.about,
    params: [match],
    rule: match => createGate(Number(match)),
}
