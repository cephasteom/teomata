import { BANG, toNumber } from "../lib/utils"
import type { CellRule, Operation, Param } from "./types"
import { isMoving, isNumber, named } from "./shared"
import { about } from "./instructions"

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

// An operator by name, or by its index in the table
const names = named(Object.keys(operators))

// Turns a moving cell's value into a bang when the test passes, and empties
// the cell when it doesn't. An array value passes when every one of its
// numbers does, and a bang counts as a 1
const createLogic = (test: Test, n: number): CellRule => cell => {
    if (!isMoving(cell)) return cell
    const passes = (value: number) => test(value, n)
    const passed = Array.isArray(cell.value) ? cell.value.every(passes) : passes(toNumber(cell.value!))
    return passed ? { ...cell, value: BANG } : {}
}

const operator: Param = {
    name: "operator",
    about: about.l.params.operator,
    fallback: "==",
    accepts: names.accepts,
    settle: names.settle,
    options: names.options,
    // Changes what the operation is, so it's only set in the argument editor
    editorOnly: true,
}

const n: Param = {
    name: "n",
    about: about.l.params.n,
    fallback: "0",
    accepts: isNumber,
}

export const logic: Operation = {
    name: "logic",
    kind: "operator",
    about: about.l.about,
    params: [operator, n],
    // n only shows for the operators that take it
    shown: ([operator = ""]) => Object.hasOwn(alone, names.nameOf(operator)) ? 1 : 2,
    label: operator => names.nameOf(operator),
    // The operator has no input, so it still shows while n has one
    expandedLabel: operator => names.nameOf(operator),
    rule: (operator, n) => createLogic(operators[names.nameOf(operator)], Number(n)),
}
