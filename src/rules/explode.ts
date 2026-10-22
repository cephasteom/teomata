import type { Cell, direction } from "../stores/cells"
import { axes, isAxis, isDirection, step, type axis } from "../lib/utils"
import type { GridRule, Operation, Param } from "./types"
import { about } from "./instructions"

// Explodes a cell's array value out from square i in the given direction, the
// first number staying on the square and each one after going one square
// further, as a cell with the original's direction. Along x or y the numbers
// after the first take turns going either way, each one square further than
// the last one that went the same way
// Gives the square for each number with its new cell, wrapping around the
// edges, and nothing for single values and empty cells
const explodeLine = ({ value, direction }: Cell, i: number, to: string, size: number): [number, Cell][] => {
    if (!Array.isArray(value)) return []
    const directions = isDirection(to) ? [to] : axes[to as axis]
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
    about: about.explode.params.direction,
    fallback: "n",
    accepts: text => isDirection(text.toLowerCase()) || isAxis(text.toLowerCase()),
}

// The exploding needs the whole grid, so it is done by explodeArrays in the
// rules chain, and the rule for the square itself leaves the cell alone
export const explode: Operation = {
    name: "explode",
    about: about.explode.about,
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
