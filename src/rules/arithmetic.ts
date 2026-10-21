import { BANG, toNumber } from "../lib/utils"
import type { CellRule, Operation } from "./types"

// Works out a moving cell's new value from its old one, keeping its direction
// An array value has the sum done to each of its numbers, and a bang counts
// as a 1. The results aren't rounded, or kept to MIDI's range
const createArithmetic = (apply: (value: number) => number): CellRule => cell => {
    if (!cell.direction || cell.value === undefined) return cell
    return { ...cell, value: Array.isArray(cell.value) ? cell.value.map(apply) : apply(toNumber(cell.value)) }
}

// Turns a moving cell's value into a bang when the test passes, and empties
// the cell when it doesn't. An array value passes when every one of its
// numbers does, and a bang counts as a 1
const createComparison = (test: (value: number) => boolean): CellRule => cell => {
    if (!cell.direction || cell.value === undefined) return cell
    const passes = Array.isArray(cell.value) ? cell.value.every(test) : test(toNumber(cell.value))
    return passes ? { ...cell, value: BANG } : {}
}

const isNumber = (text: string) => text !== "" && Number.isFinite(Number(text))

// Each operation's fallback leaves the value as it is
const arithmetic = (name: string, about: string, fallback: string, apply: (value: number, by: number) => number, accepts = isNumber): Operation => ({
    name,
    about,
    params: [{ name: "n", about: "Any number.", fallback, accepts }],
    rule: by => createArithmetic(value => apply(value, Number(by))),
})

const comparison = (name: string, about: string, test: (value: number, by: number) => boolean): Operation => ({
    name,
    about,
    params: [{ name: "n", about: "Any number.", fallback: "0", accepts: isNumber }],
    rule: by => createComparison(value => test(value, Number(by))),
})

export const add = arithmetic("add", "Add n to a value.", "0", (value, by) => value + by)
export const subtract = arithmetic("subtract", "Subtract n from a value.", "0", (value, by) => value - by)
export const multiply = arithmetic("multiply", "Multiply a value by n.", "1", (value, by) => value * by)
export const divide = arithmetic("divide", "Divide a value by n.", "1", (value, by) => value / by,
    text => isNumber(text) && Number(text) !== 0)
// That leaves alone any value from 0 to 127
export const modulo = arithmetic("modulo", "Set a value to its remainder after dividing by n.", "128", (value, by) => value % by,
    text => isNumber(text) && Number(text) !== 0)

// Comparisons output a bang when true and nothing when false
export const lessThan = comparison("lt", "Output a bang if a value is less than n, or nothing if not.", (value, by) => value < by)
export const greaterThan = comparison("gt", "Output a bang if a value is greater than n, or nothing if not.", (value, by) => value > by)
export const equal = comparison("eq", "Output a bang if a value equals n, or nothing if not.", (value, by) => value === by)
export const notEqual = comparison("neq", "Output a bang if a value doesn't equal n, or nothing if it does.", (value, by) => value !== by)
