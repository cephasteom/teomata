import type { Cell } from "../stores/cells"
import type { CellRule, Operation, Param } from "./types"
import { isMoving, isNumber } from "./shared"
import { about } from "./instructions"

const fromParam = (about: string): Param => ({ name: "from", about, fallback: "0", accepts: isNumber })
const toParam = (about: string): Param => ({ name: "to", about, fallback: "7", accepts: isNumber })

// A count from one number to another, stepping by 1 towards to, or down by 1
// when to is below from. Once the count would pass to it wraps back to from
const createCounter = (from: number, to: number) => {
    const by = to < from ? -1 : 1
    let count = from
    return {
        // The count the next call to next gives
        peek: () => count,
        next: () => {
            const value = count
            const after = count + by
            count = (by > 0 ? after > to : after < to) ? from : after
            return value
        },
    }
}

// Gives each value arriving the next count
const createCount = (from: number, to: number): CellRule => {
    const counter = createCounter(from, to)
    return Object.assign(
        (cell: Cell) => isMoving(cell) ? { ...cell, value: counter.next() } : cell,
        { label: () => `${counter.peek()}` },
    )
}

export const count: Operation = {
    name: "count",
    kind: "operator",
    about: about.i.about,
    params: [fromParam(about.i.params.from), toParam(about.i.params.to)],
    label: from => from,
    rule: (from, to) => createCount(Number(from), Number(to)),
}
