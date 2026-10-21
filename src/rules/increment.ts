import type { CellRule, Operation, Param } from "./types"

// Gives a moving cell with any value but 0 the count, one more than last
// time, going back to the start once it would pass the end. The count begins
// at the start, so the first cell gets one more than it
const createIncrement = (from = 0, to = Infinity): CellRule => {
    let count = from
    return cell => {
        if (!cell.direction || cell.value === undefined || cell.value === 0) return cell
        count = count + 1 > to ? from : count + 1
        return { ...cell, value: count }
    }
}

const isNumber = (text: string) => text !== "" && Number.isFinite(Number(text))

const start: Param = {
    name: "start",
    about: "Any number, where the count starts and wraps back to.",
    fallback: "0",
    accepts: isNumber,
}

const end: Param = {
    name: "end",
    about: "Any number, or Infinity, the highest the count goes before it wraps.",
    fallback: "Infinity",
    accepts: text => text !== "" && !Number.isNaN(Number(text)),
}

export const increment: Operation = {
    name: "increment",
    about: "Count up by 1 each time a non zero value arrives, and output the count.",
    params: [start, end],
    rule: (from, to) => createIncrement(Number(from), Number(to)),
}
