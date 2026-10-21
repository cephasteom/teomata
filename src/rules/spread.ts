import type { Cell, direction } from "../stores/cells"
import { isDirection, step } from "../lib/utils"
import type { GridRule, Operation, Param } from "./types"

// Spreads a cell's array value out along a line from square i in the given
// direction, the first number staying on the square and each one after going
// one square further, as a cell with the original's direction
// Gives the square for each number with its new cell, wrapping around the
// edges, and nothing for single values and empty cells
const spreadLine = ({ value, direction }: Cell, i: number, to: direction, size: number): [number, Cell][] => {
    if (!Array.isArray(value)) return []
    let j = i
    return value.map((n, k) => {
        if (k) j = step(j, to, size)
        return [j, direction ? { value: n, direction } : { value: n }]
    })
}

const heading: Param = {
    name: "direction",
    about: "n, s, e or w.",
    fallback: "n",
    accepts: text => isDirection(text.toLowerCase()),
}

// The spreading needs the whole grid, so it is done by spreadArrays in the
// rules chain, and the rule for the square itself leaves the cell alone
export const spread: Operation = {
    name: "spread",
    about: "Spread an array's values out in a line in a given direction.",
    params: [heading],
    rule: () => cell => cell,
}

// Spreads the array value of the cell on every square with a ., putting
// its numbers out in a line from the square. The cells are read before any
// spreads, and each number overwrites whatever cell is on its square
// An erased or invalid direction falls back to the param's default
export const spreadArrays: GridRule = (cells, size, letters, args) => {
    const next = [...cells]
    cells.forEach((cell, i) => {
        if (letters[i] !== ".") return
        const given = args[i]?.[0]
        const to = (given !== undefined && heading.accepts(given) ? given : heading.fallback).toLowerCase() as direction
        spreadLine(cell, i, to, size).forEach(([j, spread]) => next[j] = spread)
    })
    return next
}
