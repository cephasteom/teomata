import type { CellRule, Operation } from "./types"

// Works out a moving cell's new value from its old one, keeping its direction
// An array value has the sum done to each of its numbers. The results aren't
// rounded, or kept to MIDI's range
const createArithmetic = (apply: (value: number) => number): CellRule => cell => {
    if (!cell.direction || cell.value === undefined) return cell
    return { ...cell, value: Array.isArray(cell.value) ? cell.value.map(apply) : apply(cell.value) }
}

const isNumber = (text: string) => text !== "" && Number.isFinite(Number(text))

// Each operation's fallback leaves the value as it is
const arithmetic = (name: string, about: string, fallback: string, apply: (value: number, by: number) => number, accepts = isNumber): Operation => ({
    name,
    about,
    params: [{ name: "n", about: "Any number.", fallback, accepts }],
    rule: by => createArithmetic(value => apply(value, Number(by))),
})

export const add = arithmetic("add", "Add n to a value.", "0", (value, by) => value + by)
export const subtract = arithmetic("subtract", "Subtract n from a value.", "0", (value, by) => value - by)
export const multiply = arithmetic("multiply", "Multiply a value by n.", "1", (value, by) => value * by)
export const divide = arithmetic("divide", "Divide a value by n.", "1", (value, by) => value / by,
    text => isNumber(text) && Number(text) !== 0)
// That leaves alone any value from 0 to 127
export const modulo = arithmetic("modulo", "Set a value to its remainder after dividing by n.", "128", (value, by) => value % by,
    text => isNumber(text) && Number(text) !== 0)

// Comparisons set a value to 1 when true and 0 when false
export const lessThan = arithmetic("lt", "Set a value to 1 if it is less than n, or 0 if not.", "0", (value, by) => Number(value < by))
export const greaterThan = arithmetic("gt", "Set a value to 1 if it is greater than n, or 0 if not.", "0", (value, by) => Number(value > by))
export const equal = arithmetic("eq", "Set a value to 1 if it equals n, or 0 if not.", "0", (value, by) => Number(value === by))
export const notEqual = arithmetic("neq", "Set a value to 1 if it doesn't equal n, or 0 if it does.", "0", (value, by) => Number(value !== by))
