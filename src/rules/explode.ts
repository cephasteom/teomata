import type { Cell, direction } from "../stores/cells"
import { isDirection, step } from "../lib/utils"
import type { GridRule, Operation, Param } from "./types"

// The two ways an axis explodes, taking turns
const ways: Record<"x" | "y", [direction, direction]> = { x: ["e", "w"], y: ["n", "s"] }

// Explodes a cell's array value out from square i in the given direction, the
// first number staying on the square and each one after going one square
// further, as a cell with the original's direction. Along x or y the numbers
// after the first take turns going either way, each one square further than
// the last one that went the same way
// Gives the square for each number with its new cell, wrapping around the
// edges, and nothing for single values and empty cells
const explodeLine = ({ value, direction }: Cell, i: number, to: string, size: number): [number, Cell][] => {
    if (!Array.isArray(value)) return []
    const directions = isDirection(to) ? [to] : ways[to as "x" | "y"]
    const ends = directions.map(() => i)
    return value.map((n, k) => {
        let j = i
        if (k) {
            const d = (k - 1) % directions.length
            j = ends[d] = step(ends[d], directions[d], size)
        }
        return [j, direction ? { value: n, direction } : { value: n }]
    })
}

const heading: Param = {
    name: "direction",
    about: "n, s, e or w, or x or y to explode both ways along an axis.",
    fallback: "n",
    accepts: text => isDirection(text.toLowerCase()) || /^[xy]$/i.test(text),
}

// The exploding needs the whole grid, so it is done by explodeArrays in the
// rules chain, and the rule for the square itself leaves the cell alone
export const explode: Operation = {
    name: "explode",
    about: "Explode an array's values out in a line in a given direction, or both ways along an axis.",
    params: [heading],
    rule: () => cell => cell,
}

// Explodes the array value of the cell on every square with an x, putting
// its numbers out in a line from the square. The cells are read before any
// explosions, and each number overwrites whatever cell is on its square
// An erased or invalid direction falls back to the param's default
export const explodeArrays: GridRule = (cells, size, letters, args) => {
    const next = [...cells]
    cells.forEach((cell, i) => {
        if (letters[i]?.toLowerCase() !== "x") return
        const given = args[i]?.[0]
        const to = (given !== undefined && heading.accepts(given) ? given : heading.fallback).toLowerCase()
        explodeLine(cell, i, to, size).forEach(([j, exploded]) => next[j] = exploded)
    })
    return next
}
