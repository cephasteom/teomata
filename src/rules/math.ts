import { toNumber } from "../lib/utils"
import type { CellRule, Operation, Param } from "./types"

// Works out a number from a value and n, which is undefined when its square is empty
type Apply = (value: number, n?: number) => number

// Does the sum with n, leaving the value as it is when there's no n
const binary = (sum: (value: number, n: number) => number): Apply => (value, n) => n === undefined ? value : sum(value, n)

// Works on the value alone, ignoring n
const unary = (f: (value: number) => number): Apply => value => f(value)

// Each operator by name, after the JS Math object. Those that take n come
// first, then those that work on the value alone
const withN: Record<string, Apply> = {
    "+": binary((value, n) => value + n),
    "-": binary((value, n) => value - n),
    "*": binary((value, n) => value * n),
    "/": binary((value, n) => value / n),
    "%": binary((value, n) => value % n),
    "^": binary(Math.pow),
    // JS's bitwise operators, which work on whole numbers, dropping any fraction
    "&": binary((value, n) => value & n),
    "|": binary((value, n) => value | n),
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

const operators = { ...withN, ...alone }

// Keeps a count from 0, giving each moving cell with any value but 0 that
// arrives the count one on from last time, up or down by the given step.
// Once the count would pass n it goes back to 0, and with no n it never does
const createCount = (by: 1 | -1) => (end?: number): CellRule => {
    let count = 0
    return cell => {
        if (!cell.direction || cell.value === undefined || cell.value === 0) return cell
        const next = count + by
        count = end !== undefined && (by > 0 ? next > end : next < end) ? 0 : next
        return { ...cell, value: count }
    }
}

// The counting operators, which remember their count rather than working on
// the value, so each square's rule keeps its own
const counters: Record<string, (end?: number) => CellRule> = {
    "++": createCount(1),
    "--": createCount(-1),
}

const isOperator = (text: string) => text in operators || text in counters

// Works out a moving cell's new value from its old one, keeping its direction
// An array value has the sum done to each of its numbers, and a bang counts
// as a 1. The results aren't rounded, or kept to MIDI's range, but a number
// whose result isn't finite, such as after dividing by 0, is left as it was
const createMath = (apply: Apply, n?: number): CellRule => cell => {
    if (!cell.direction || cell.value === undefined) return cell
    const sum = (value: number) => {
        const result = apply(value, n)
        return Number.isFinite(result) ? result : value
    }
    return { ...cell, value: Array.isArray(cell.value) ? cell.value.map(sum) : sum(toNumber(cell.value)) }
}

const isNumber = (text: string) => text !== "" && Number.isFinite(Number(text))

const operator: Param = {
    name: "operator",
    about: "+, -, *, /, %, ^ (also pow), & and |, atan2, min, max and hypot take the value and n. "
        + "~, abs, sign, floor, ceil, round, trunc, fround, sqrt, cbrt, exp, expm1, log, log1p, log2, log10, "
        + "sin, cos, tan, asin, acos, atan, sinh, cosh, tanh, asinh, acosh, atanh and clz32 "
        + "take the value alone. ++ and -- count up or down by 1 from 0 for each value but 0 that arrives, "
        + "giving the count, and go back to 0 once they would pass n. Ignores case.",
    fallback: "+",
    accepts: text => isOperator(text.toLowerCase()),
}

const n: Param = {
    name: "n",
    about: "Any number, for the operators that take one. Left empty, they leave the value alone, and ++ and -- count on forever.",
    fallback: "",
    accepts: text => text === "" || isNumber(text),
}

export const math: Operation = {
    name: "math",
    about: "Change a value with an operator from the JS Math object.",
    params: [operator, n],
    // n only shows for the operators that take it
    shown: ([operator = ""]) => operator.toLowerCase() in alone ? 1 : 2,
    rule: (operator, n) => {
        const name = operator.toLowerCase()
        const given = isNumber(n) ? Number(n) : undefined
        return name in counters ? counters[name](given) : createMath(operators[name], given)
    },
}
