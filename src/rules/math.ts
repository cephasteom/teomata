import { toNumber } from "../lib/utils"
import type { CellRule, Operation, Param } from "./_types"
import { isMoving, isNumber, named } from "./_shared"
import { about } from "./_instructions"

// Works out a number from a value and num, which is undefined when its square is empty
type Apply = (value: number, num?: number) => number

// Does the sum with num, leaving the value as it is when there's no num
const binary = (sum: (value: number, num: number) => number): Apply => (value, num) => num === undefined ? value : sum(value, num)

// Works on the value alone, ignoring num
const unary = (f: (value: number) => number): Apply => value => f(value)

// Each operator by name, after the JS Math object. Those that take num come
// first, then those that work on the value alone
const withNum: Record<string, Apply> = {
    "+": binary((value, num) => value + num),
    "-": binary((value, num) => value - num),
    "*": binary((value, num) => value * num),
    "/": binary((value, num) => value / num),
    "%": binary((value, num) => value % num),
    "^": binary(Math.pow),
    // JS's bitwise operators, which work on whole numbers, dropping any fraction
    "&": binary((value, num) => value & num),
    "|": binary((value, num) => value | num),
    pow: binary(Math.pow),
    atan2: binary(Math.atan2),
    min: binary(Math.min),
    max: binary(Math.max),
    hypot: binary(Math.hypot),
}

const alone: Record<string, Apply> = {
    "~": unary(value => ~value),
    abs: unary(Math.abs),
    sign: unary(Math.sign),
    floor: unary(Math.floor),
    ceil: unary(Math.ceil),
    round: unary(Math.round),
    trunc: unary(Math.trunc),
    fround: unary(Math.fround),
    sqrt: unary(Math.sqrt),
    cbrt: unary(Math.cbrt),
    exp: unary(Math.exp),
    expm1: unary(Math.expm1),
    log: unary(Math.log),
    log1p: unary(Math.log1p),
    log2: unary(Math.log2),
    log10: unary(Math.log10),
    sin: unary(Math.sin),
    cos: unary(Math.cos),
    tan: unary(Math.tan),
    asin: unary(Math.asin),
    acos: unary(Math.acos),
    atan: unary(Math.atan),
    sinh: unary(Math.sinh),
    cosh: unary(Math.cosh),
    tanh: unary(Math.tanh),
    asinh: unary(Math.asinh),
    acosh: unary(Math.acosh),
    atanh: unary(Math.atanh),
    clz32: unary(Math.clz32),
}

const operators = { ...withNum, ...alone }

// An operator by name, ignoring case, or by its index in the table
const names = named(Object.keys(operators))

// Works out a moving cell's new value from its old one, keeping its direction
// An array value has the sum done to each of its numbers, and a bang counts
// as a 1. The results aren't rounded, or kept to MIDI's range, but a number
// whose result isn't finite, such as after dividing by 0, is left as it was
const createMath = (apply: Apply, num?: number): CellRule => cell => {
    if (!isMoving(cell)) return cell
    const sum = (value: number) => {
        const result = apply(value, num)
        return Number.isFinite(result) ? result : value
    }
    return { ...cell, value: Array.isArray(cell.value) ? cell.value.map(sum) : sum(toNumber(cell.value!)) }
}

const operator: Param = {
    name: "operator",
    about: about.m.params.operator,
    fallback: "+",
    accepts: names.accepts,
    settle: names.settle,
    options: names.options,
    // Changes what the operation is, so it's only set in the argument editor
    editorOnly: true,
}

const num: Param = {
    name: "num",
    about: about.m.params.num,
    fallback: "",
    accepts: text => text === "" || isNumber(text),
}

export const math: Operation = {
    name: "math",
    kind: "operator",
    about: about.m.about,
    params: [operator, num],
    // num only shows for the operators that take it
    shown: ([operator = ""]) => Object.hasOwn(alone, names.nameOf(operator)) ? 1 : 2,
    label: operator => names.nameOf(operator),
    // The operator has no input, so it still shows while num has one
    expandedLabel: operator => names.nameOf(operator),
    rule: (operator, num) => createMath(operators[names.nameOf(operator)], isNumber(num) ? Number(num) : undefined),
}
