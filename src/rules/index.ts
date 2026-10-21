import type { Operation, GridRule, CellRule } from "./types"
import { move } from "./move"
import { rotate } from "./rotate"
import { die } from "./die"
import { bang } from "./bang"
import { value } from "./value"
import { increment } from "./increment"
import { array } from "./array"
import { chord } from "./chord"
import { explode, explodeArrays } from "./explode"
import { add, subtract, multiply, divide, modulo, lessThan, greaterThan, equal, notEqual } from "./arithmetic"
import { isLetter } from "../lib/utils"

const operations: Record<string, Operation> = {
    r: rotate,
    d: die,
    b: bang,
    v: value,
    i: increment,
    a: array,
    c: chord,
    "+": add,
    "-": subtract,
    "*": multiply,
    "/": divide,
    "%": modulo,
    "<": lessThan,
    ">": greaterThan,
    "=": equal,
    "!": notEqual,
    "{": explode,
}

// Every operation by its letter, for the instructions. The arithmetic comes
// first, in the table's order, then the letters alphabetically
export const instructions = Object.entries(operations)
    .sort(([a], [b]) => Number(isLetter(a)) - Number(isLetter(b)) || (isLetter(a) ? a.localeCompare(b) : 0))
    .map(([letter, { name, about, params, rest }]) => ({ letter, name, about, params, rest }))

// The params an operation takes on a grid of the given size, which is none for
// operations without a rule. A rest param repeats after the others to fill
// the rest of the row beside the operation
export const paramsFor = (letter: string, size: number) => {
    const operation = operations[letter.toLowerCase()]
    if (!operation) return []
    const { params, rest } = operation
    return rest ? [...params, ...Array(Math.max(0, size - 1 - params.length)).fill(rest)] : params
}

// The given arguments for an operation, with defaults standing in for any
// missing or invalid ones, such as an argument that was erased
export const argsFor = (letter: string, size: number, given: string[] = []) =>
    paramsFor(letter, size).map((param, k) =>
        given[k] !== undefined && param.accepts(given[k]) ? given[k] : param.fallback
    )

// The rule built for each square, with the operation and arguments it was
// built from. A square's rule is kept from tick to tick, so it can remember
// things, until its operation or arguments change. Every rule is built afresh
// when the transport starts or the grid resizes
let built = new Map<number, { key: string, rule: CellRule }>()
let builtSize = 0

const ruleFor = (i: number, letter: string, size: number, given?: string[]) => {
    const args = argsFor(letter, size, given)
    const key = [letter.toLowerCase(), ...args].join("\n")
    const kept = built.get(i)
    if (kept?.key === key) return kept.rule
    const rule = operations[letter.toLowerCase()].rule(...args)
    built.set(i, { key, rule })
    return rule
}

// Applies the rule for every square with an operation
// The operation's case is ignored, and invalid arguments fall back to defaults
const applyRules: GridRule = (cells, size, letters, args, tick) => {
    if (tick === 0 || size !== builtSize) built = new Map()
    builtSize = size
    return cells.map((cell, i) => {
        if (!letters[i] || !operations[letters[i].toLowerCase()]) {
            built.delete(i)
            return cell
        }
        return ruleFor(i, letters[i], size, args[i])(cell, tick)
    })
}

// Chain or rules to apply on each division of the cycle
// Called in scheduler.ts
export const rules = [
    move,
    explodeArrays,
    applyRules,
]