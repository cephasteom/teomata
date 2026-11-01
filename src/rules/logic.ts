import { toNumber } from "../lib/utils"
import type { CellRule, Operation, Param } from "./types"
import { isMoving, isNumber, named } from "./shared"
import { about } from "./instructions"

// Tests a number against num, which only ! goes without
type Test = (value: number, num: number) => boolean

// Each operator by name, after JS's own. A number is true when it isn't 0.
// Those that take num come first, then ! which works on the value alone
const withNum: Record<string, Test> = {
    "<": (value, num) => value < num,
    ">": (value, num) => value > num,
    "<=": (value, num) => value <= num,
    ">=": (value, num) => value >= num,
    // Values are only ever numbers, so loose and strict equality are the same
    "==": (value, num) => value === num,
    "===": (value, num) => value === num,
    "!=": (value, num) => value !== num,
    "!==": (value, num) => value !== num,
    "&&": (value, num) => value !== 0 && num !== 0,
    "||": (value, num) => value !== 0 || num !== 0,
    "^": (value, num) => (value !== 0) !== (num !== 0),
}

const alone: Record<string, Test> = {
    "!": value => value === 0,
}

const operators = { ...withNum, ...alone }

// An operator by name, or by its index in the table
const names = named(Object.keys(operators))

// Turns a moving cell's value into a 1 when the test passes, and a 0 when it
// doesn't. An array value passes when every one of its numbers does, and a
// bang counts as a 1
const createLogic = (test: Test, num: number): CellRule => cell => {
    if (!isMoving(cell)) return cell
    const passes = (value: number) => test(value, num)
    const passed = Array.isArray(cell.value) ? cell.value.every(passes) : passes(toNumber(cell.value!))
    return { ...cell, value: passed ? 1 : 0 }
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

const num: Param = {
    name: "num",
    about: about.l.params.num,
    fallback: "0",
    accepts: isNumber,
}

export const logic: Operation = {
    name: "logic",
    kind: "operator",
    about: about.l.about,
    params: [operator, num],
    // num only shows for the operators that take it
    shown: ([operator = ""]) => Object.hasOwn(alone, names.nameOf(operator)) ? 1 : 2,
    label: operator => names.nameOf(operator),
    // The operator has no input, so it still shows while num has one
    expandedLabel: operator => names.nameOf(operator),
    rule: (operator, num) => createLogic(operators[names.nameOf(operator)], Number(num)),
}
