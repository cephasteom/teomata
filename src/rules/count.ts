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
        next: () => {
            const value = count
            const after = count + by
            count = (by > 0 ? after > to : after < to) ? from : after
            return value
        },
        at: () => count,
        // Carries on from another count's next number, wrapped into this one's range
        resume: (at: number) => {
            const [lo, span] = [Math.min(from, to), Math.abs(to - from) + 1]
            count = lo + (((at - lo) % span) + span) % span
        },
    }
}

// Gives each value arriving the next count, carrying on from the count built
// before it when its range changes
const createCount = (from: number, to: number): CellRule => {
    const counter = createCounter(from, to)
    const rule: CellRule = cell => isMoving(cell) ? { ...cell, value: counter.next() } : cell
    rule.keep = counter.at
    rule.carry = at => {
        if (typeof at === "number") counter.resume(at)
    }
    return rule
}

export const count: Operation = {
    name: "increment",
    kind: "operator",
    about: about.i.about,
    params: [fromParam(about.i.params.from), toParam(about.i.params.to)],
    rule: (from, to) => createCount(Number(from), Number(to)),
}
