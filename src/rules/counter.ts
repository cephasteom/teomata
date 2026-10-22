import type { CellRule, Operation, Param } from "./types"
import { about } from "./instructions"

// Keeps a count from one number to another, giving each moving cell with a
// value that arrives the count, then stepping it by 1 towards to, or down by
// 1 when to is below from. Once the count would pass to it wraps back to from
const createCounter = (from = 0, to = 7): CellRule => {
    const by = to < from ? -1 : 1
    let count = from
    return cell => {
        if (!cell.direction || cell.value === undefined) return cell
        const value = count
        const next = count + by
        count = (by > 0 ? next > to : next < to) ? from : next
        return { ...cell, value }
    }
}

const isNumber = (text: string) => text !== "" && Number.isFinite(Number(text))

const from: Param = {
    name: "from",
    about: about.counter.params.from,
    fallback: "0",
    accepts: isNumber,
}

const to: Param = {
    name: "to",
    about: about.counter.params.to,
    fallback: "7",
    accepts: isNumber,
}

export const counter: Operation = {
    name: "counter",
    about: about.counter.about,
    params: [from, to],
    rule: (from, to) => createCounter(Number(from), Number(to)),
}
