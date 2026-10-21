import { BANG, toNumber } from "../lib/utils"
import type { CellRule, Operation } from "./types"

// Turns a moving cell's value into a bang when the test passes, and empties
// the cell when it doesn't. An array value passes when every one of its
// numbers does, and a bang counts as a 1
const createComparison = (test: (value: number) => boolean): CellRule => cell => {
    if (!cell.direction || cell.value === undefined) return cell
    const passes = Array.isArray(cell.value) ? cell.value.every(test) : test(toNumber(cell.value))
    return passes ? { ...cell, value: BANG } : {}
}

const isNumber = (text: string) => text !== "" && Number.isFinite(Number(text))

const comparison = (name: string, about: string, test: (value: number, by: number) => boolean): Operation => ({
    name,
    about,
    params: [{ name: "n", about: "Any number.", fallback: "0", accepts: isNumber }],
    rule: by => createComparison(value => test(value, Number(by))),
})

// Comparisons output a bang when true and nothing when false
export const lessThan = comparison("lt", "Output a bang if a value is less than n, or nothing if not.", (value, by) => value < by)
export const greaterThan = comparison("gt", "Output a bang if a value is greater than n, or nothing if not.", (value, by) => value > by)
export const equal = comparison("eq", "Output a bang if a value equals n, or nothing if not.", (value, by) => value === by)
export const notEqual = comparison("neq", "Output a bang if a value doesn't equal n, or nothing if it does.", (value, by) => value !== by)
