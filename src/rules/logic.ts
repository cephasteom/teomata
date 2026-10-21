import { BANG, toNumber } from "../lib/utils"
import type { CellRule, Operation, Param } from "./types"

// Tests a number against n, which only ! goes without
type Test = (value: number, n: number) => boolean

// Each operator by name, after JS's own. A number is true when it isn't 0.
// Those that take n come first, then ! which works on the value alone
const withN: Record<string, Test> = {
    "<": (value, n) => value < n,
    ">": (value, n) => value > n,
    "<=": (value, n) => value <= n,
    ">=": (value, n) => value >= n,
    // Values are only ever numbers, so loose and strict equality are the same
    "==": (value, n) => value === n,
    "===": (value, n) => value === n,
    "!=": (value, n) => value !== n,
    "!==": (value, n) => value !== n,
    "&&": (value, n) => value !== 0 && n !== 0,
    "||": (value, n) => value !== 0 || n !== 0,
    "^": (value, n) => (value !== 0) !== (n !== 0),
}

const alone: Record<string, Test> = {
    "!": value => value === 0,
}

const operators = { ...withN, ...alone }

// Turns a moving cell's value into a bang when the test passes, and empties
// the cell when it doesn't. An array value passes when every one of its
// numbers does, and a bang counts as a 1
const createLogic = (test: Test, n: number): CellRule => cell => {
    if (!cell.direction || cell.value === undefined) return cell
    const passes = (value: number) => test(value, n)
    const passed = Array.isArray(cell.value) ? cell.value.every(passes) : passes(toNumber(cell.value))
    return passed ? { ...cell, value: BANG } : {}
}

const isNumber = (text: string) => text !== "" && Number.isFinite(Number(text))

const operator: Param = {
    name: "operator",
    about: "<, >, <=, >=, == (also ===), != (also !==), && (and), || (or) and ^ (xor) take the value and n. ! (not) takes the value alone. "
        + "A number is true when it isn't 0.",
    fallback: "==",
    accepts: text => text in operators,
}

const n: Param = {
    name: "n",
    about: "Any number, for the operators that take one.",
    fallback: "0",
    accepts: isNumber,
}

export const logic: Operation = {
    name: "logic",
    about: "Output a bang if a value passes a test with an operator from JS, or nothing if not.",
    params: [operator, n],
    // n only shows for the operators that take it
    shown: ([operator = ""]) => operator in alone ? 1 : 2,
    rule: (operator, n) => createLogic(operators[operator], Number(n)),
}
