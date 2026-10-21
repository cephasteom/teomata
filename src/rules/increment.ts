import type { CellRule, Operation, Param } from "./types"

// Gives a moving cell with any value but 0 the count, one on from last time,
// going back to the start once it would pass the end. It counts up, or down
// when the start is above the end. The count begins at the start, so the
// first cell gets one on from it
const createIncrement = (from = 0, to = Infinity): CellRule => {
    const by = from <= to ? 1 : -1
    let count = from
    return cell => {
        if (!cell.direction || cell.value === undefined || cell.value === 0) return cell
        const next = count + by
        count = (by > 0 ? next > to : next < to) ? from : next
        return { ...cell, value: count }
    }
}

const isNumber = (text: string) => text !== "" && Number.isFinite(Number(text))

// ~ stands for infinity, and -~ for minus infinity
const isEnd = (text: string) => text === "~" || text === "-~" || isNumber(text)
const toEnd = (text: string) => text === "~" ? Infinity : text === "-~" ? -Infinity : Number(text)

const start: Param = {
    name: "start",
    about: "Any number, where the count starts and wraps back to.",
    fallback: "0",
    accepts: isNumber,
}

const end: Param = {
    name: "end",
    about: "Any number, or ~ for infinity, the furthest the count goes before it wraps. Below the start counts down.",
    fallback: "~",
    accepts: isEnd,
}

export const increment: Operation = {
    name: "increment",
    about: "Count by 1 each time a non zero value arrives, and output the count.",
    params: [start, end],
    rule: (from, to) => createIncrement(Number(from), toEnd(to)),
}
