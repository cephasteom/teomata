import type { Operation, GridRule, CellRule, Kind } from "./types"
import { move } from "./move"
import { rotate } from "./rotate"
import { die } from "./die"
import { bang, bangGenerator } from "./bang"
import { value, valueGenerator } from "./value"
import { harmony } from "./harmony"
import { increment, incrementGenerator } from "./increment"
import { math } from "./math"
import { logic } from "./logic"
import { print } from "./print"
import { note } from "./note"
import { cc } from "./cc"
import { wave, waveGenerator } from "./wave"

// Every operation by its letter. Case matters: generators are uppercase, and
// may share a letter with a lowercase operator
const operations: Record<string, Operation> = {
    B: bangGenerator,
    I: incrementGenerator,
    V: valueGenerator,
    W: waveGenerator,
    b: bang,
    d: die,
    h: harmony,
    i: increment,
    l: logic,
    m: math,
    p: print,
    r: rotate,
    v: value,
    w: wave,
    c: cc,
    n: note,
}

const operationFor = (letter: string): Operation | undefined =>
    Object.hasOwn(operations, letter) ? operations[letter] : undefined

const kinds: Kind[] = ["generator", "operator", "output"]

// Every operation by its letter, for the instructions: the generators, then
// the operators, then the outputs, each alphabetically
export const instructions = Object.entries(operations)
    .sort(([a, x], [b, y]) => kinds.indexOf(x.kind) - kinds.indexOf(y.kind) || a.localeCompare(b))
    .map(([letter, { name, kind, about, params, rest }]) => ({ letter, name, kind, about, params, rest }))

// Whether the letter is a generator, operator or output, or undefined when it
// isn't an operation
export const kindOf = (letter: string) => operationFor(letter)?.kind

// The params an operation takes on a grid of the given size, which is none for
// operations without a rule. A rest param repeats after the others to fill
// the rest of the row beside the operation. Given the arguments, only the
// params the operation shows for them are kept
export const paramsFor = (letter: string, size: number, given?: string[]) => {
    const operation = operationFor(letter)
    if (!operation) return []
    const { params, rest, shown } = operation
    const all = rest ? [...params, ...Array(Math.max(0, size - 1 - params.length)).fill(rest)] : params
    return given && shown ? all.slice(0, shown(given)) : all
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

const keyFor = (letter: string, args: string[]) => [letter, ...args].join("\n")

const ruleFor = (i: number, letter: string, size: number, given?: string[]) => {
    const args = argsFor(letter, size, given)
    const key = keyFor(letter, args)
    const kept = built.get(i)
    if (kept?.key === key) return kept.rule
    const rule = operations[letter].rule(...args)
    built.set(i, { key, rule })
    return rule
}

// How a square's operation shows on the grid: what its rule remembers, such
// as an increment's next count, or else what its arguments give, or else its
// letter
export const labelFor = (i: number, letter: string, size: number, given?: string[]) => {
    const operation = operationFor(letter)
    if (!operation) return letter
    const args = argsFor(letter, size, given)
    const kept = built.get(i)
    const remembered = kept?.key === keyFor(letter, args) ? kept.rule.label?.() : undefined
    return remembered ?? operation.label?.(...args) ?? letter
}

// Applies the rule for every square with an operation that isn't muted
// Invalid arguments fall back to defaults. A muted square's rule is kept, so
// it carries on from where it was when unmuted
const applyRules: GridRule = (cells, size, letters, args, muted, tick) => {
    if (tick === 0 || size !== builtSize) built = new Map()
    builtSize = size
    return cells.map((cell, i) => {
        if (!operationFor(letters[i])) {
            built.delete(i)
            return cell
        }
        if (muted[i]) return cell
        return ruleFor(i, letters[i], size, args[i])(cell, tick)
    })
}

// Chain or rules to apply on each division of the cycle
// Called in scheduler.ts
export const rules = [
    move,
    applyRules,
]
