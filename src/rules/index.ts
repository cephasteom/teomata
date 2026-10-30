import type { Operation, GridRule, CellRule, Kind, Input } from "./types"
import type { Cell } from "../stores/cells"
import { argFrom, isMoving } from "./shared"
import { BANG, step } from "../lib/utils"
import { emit } from "./events"
import { move } from "./move"
import { rotate } from "./rotate"
import { die } from "./die"
import { bang, bangGenerator } from "./bang"
import { value, valueGenerator } from "./value"
import { harmony } from "./harmony"
import { count } from "./count"
import { math } from "./math"
import { logic } from "./logic"
import { print } from "./print"
import { note } from "./note"
import { cc } from "./cc"
import { wave, waveGenerator } from "./wave"
import { scale } from "./scale"

// Every operation by its letter. Case matters: generators are uppercase, and
// may share a letter with a lowercase operator
const operations: Record<string, Operation> = {
    B: bangGenerator,
    V: valueGenerator,
    W: waveGenerator,
    b: bang,
    d: die,
    h: harmony,
    i: count,
    l: logic,
    m: math,
    p: print,
    r: rotate,
    s: scale,
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

// The indices of the params an operation's inputs set, in order: every param
// but those only set in the argument editor
export const inputParamsFor = (letter: string, size: number) =>
    paramsFor(letter, size).flatMap((param, k) => param.editorOnly ? [] : [k])

// The given arguments for an operation, with defaults standing in for any
// missing or invalid ones, such as an argument that was erased
export const argsFor = (letter: string, size: number, given: string[] = []) =>
    paramsFor(letter, size).map((param, k) =>
        given[k] !== undefined && param.accepts(given[k]) ? given[k] : param.fallback
    )

// The rule built for each square, with the operation and arguments it was
// built from. A square's rule is kept from tick to tick, so it can remember
// things, until its operation or arguments change, when the rule built in its
// place carries on from what it kept. Every rule is built afresh when the
// transport starts or the grid resizes
let built = new Map<number, { key: string, rule: CellRule }>()
let builtSize = 0

const keyFor = (letter: string, args: string[]) => [letter, ...args].join("\n")

const ruleFor = (i: number, letter: string, size: number, given?: string[]) => {
    const args = argsFor(letter, size, given)
    const key = keyFor(letter, args)
    const kept = built.get(i)
    if (kept?.key === key) return kept.rule
    const rule = operations[letter].rule(...args)
    if (kept?.key.split("\n")[0] === letter) rule.carry?.(kept.rule.keep?.())
    built.set(i, { key, rule })
    return rule
}

// How a square's operation shows on the grid: what its rule remembers, such
// as a count's next number, or else what its arguments give, or else its
// letter. While it has inputs, which show its arguments, it shows its
// expanded label, or else its letter
export const labelFor = (i: number, letter: string, size: number, given?: string[], expanded = false) => {
    const operation = operationFor(letter)
    if (!operation) return letter
    const args = argsFor(letter, size, given)
    const kept = built.get(i)
    const remembered = kept?.key === keyFor(letter, args) ? kept.rule.label?.() : undefined
    const label = expanded ? operation.expandedLabel : operation.label
    return remembered ?? label?.(...args) ?? letter
}

// Takes the moving cells with numbers on the inputs of operations that aren't
// muted, each setting its input's argument to the number it brings, when the
// param takes it. Bangs pass over inputs. Gives the cells left and the
// arguments, queueing each one set for the store, and each cell taken to show
// for the tick
const takeInputs = (
    cells: Cell[], size: number, letters: string[], given: string[][], muted: boolean[], inputs: Map<number, Input>,
) => {
    const args = [...given]
    const left = cells.map((cell, i) => {
        const input = inputs.get(i)
        if (!input || !isMoving(cell) || cell.value === BANG || muted[input.owner]) return cell
        const { owner, k } = input
        const param = paramsFor(letters[owner], size)[k]
        if (!param) return cell
        const text = argFrom(param, cell.value as number | number[])
        if (text !== undefined) {
            args[owner] = argsFor(letters[owner], size, args[owner])
            args[owner][k] = text
            emit({ type: "arg", square: owner, k, text })
        }
        emit({ type: "absorb", square: i, cell })
        return {}
    })
    return { cells: left, args }
}

// Puts each cell the unmuted generators put out on the square next to them in
// its direction, over any cell there, so the operation there acts on it on
// the tick it's put out. One that would go past the edge isn't put out
const generate = (cells: Cell[], size: number, letters: string[], args: string[][], muted: boolean[], tick: number) => {
    const next = [...cells]
    letters.forEach((letter, i) => {
        if (kindOf(letter) !== "generator" || muted[i]) return
        const cell = ruleFor(i, letter, size, args[i])({}, tick)
        if (!isMoving(cell)) return
        const to = step(i, cell.direction!, size)
        if (to !== undefined) next[to] = cell
    })
    return next
}

// Applies the rule for every square with an operation that isn't muted, once
// the values on their inputs have set their arguments, so an argument set on
// a tick works from that tick. The generators put out their cells first, and
// the inputs take the cells put on them too. Cells arriving on a generator
// pass through. Invalid arguments fall back to defaults. A muted square's
// rule is kept, so it carries on from where it was when unmuted
const applyRules: GridRule = (given, size, letters, givenArgs, muted, inputs, tick) => {
    if (tick === 0 || size !== builtSize) built = new Map()
    builtSize = size
    const taken = takeInputs(given, size, letters, givenArgs, muted, inputs)
    const generated = generate(taken.cells, size, letters, taken.args, muted, tick)
    const { cells, args } = takeInputs(generated, size, letters, taken.args, muted, inputs)
    return cells.map((cell, i) => {
        if (!operationFor(letters[i])) {
            built.delete(i)
            return cell
        }
        if (muted[i] || kindOf(letters[i]) === "generator") return cell
        const next = ruleFor(i, letters[i], size, args[i])(cell, tick)
        // An output's cells still show on it for the tick they're absorbed
        if (kindOf(letters[i]) === "output" && isMoving(cell) && next.value === undefined) {
            emit({ type: "absorb", square: i, cell })
        }
        return next
    })
}

// Chain or rules to apply on each division of the cycle
// Called in scheduler.ts
export const rules = [
    move,
    applyRules,
]
