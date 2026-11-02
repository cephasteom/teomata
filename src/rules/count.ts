import type { CellRule, Operation, Param } from "./types"
import { isMoving } from "./shared"
import { about } from "./instructions"

// Counts each value arriving and gives it the count so far. While reset is on
// the count is held at 0. It carries on from the count built before it when
// reset changes
const createCount = (reset: boolean): CellRule => {
    let count = 0
    const rule: CellRule = cell => {
        if (reset) count = 0
        else if (isMoving(cell)) count++
        return isMoving(cell) ? { ...cell, value: count } : cell
    }
    rule.keep = () => count
    rule.carry = kept => {
        if (typeof kept === "number") count = kept
    }
    return rule
}

const reset: Param = {
    name: "reset",
    about: about.c.params.reset,
    fallback: "0",
    accepts: text => text === "0" || text === "1",
    options: ["0", "1"],}

export const count: Operation = {
    name: "count",
    kind: "operator",
    about: about.c.about,
    params: [reset],
    rule: reset => createCount(reset === "1"),
}
