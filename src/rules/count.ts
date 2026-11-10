import type { CellRule, Operation } from "./_types"
import { isMoving, resetParam, resets } from "./_shared"
import { about } from "./_instructions"

// Counts each value arriving and gives it the count so far. The count goes
// back to 0 every reset cycles, on the first division of the cycle, and when
// a bang arrives on its reset input, before it counts what arrives. It
// carries on from the count built before it when its arguments change, and
// goes back to 0 when the transport stops
const createCount = (every: number): CellRule => {
    let count = 0
    const rule: CellRule = (cell, tick, context) => {
        if (resets(every, tick, context)) count = 0
        if (!isMoving(cell)) return cell
        return { ...cell, value: ++count }
    }
    rule.keep = () => count
    rule.carry = kept => {
        if (typeof kept === "number") count = kept
    }
    // The count goes back to 0 when the transport stops
    rule.stop = () => {
        count = 0
    }
    return rule
}

export const count: Operation = {
    name: "count",
    kind: "operator",
    about: about.c.about,
    params: [resetParam(about.c.params.reset)],
    rule: reset => createCount(Number(reset)),
}
