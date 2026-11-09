import type { Operation, GridRule, CellRule, Context, Kind, Input, Param } from "./types"
import type { Cell } from "../stores/cells"
import { argFrom, isModeParam, isMoving, modeParam, destinationModeParam } from "./shared"
import { BANG, step } from "../lib/utils"
import { emit } from "./events"
import { move } from "./move"
import { rotate } from "./rotate"
import { die } from "./die"
import { entangle } from "./entangle"
import { bang, bangGenerator } from "./bang"
import { value, valueGenerator } from "./value"
import { harmony } from "./harmony"
import { array } from "./array"
import { count } from "./count"
import { gate } from "./gate"
import { math } from "./math"
import { logic } from "./logic"
import { loop } from "./loop"
import { print } from "./print"
import { note } from "./note"
import { knob } from "./knob"
import { wave, waveGenerator } from "./wave"
import { scale } from "./scale"
import { quantize } from "./quantize"
import { tempo } from "./tempo"

// Every operation takes a mode after its own params
const withMode = (operation: Operation): Operation => ({
    ...operation,
    params: [...operation.params, operation.kind === "destination" ? destinationModeParam : modeParam],
})

// Every operation by its letter. Case matters: generators are uppercase, and
// may share a letter with a lowercase operator
const operations: Record<string, Operation> = Object.fromEntries(Object.entries({
    B: bangGenerator,
    V: valueGenerator,
    W: waveGenerator,
    a: array,
    b: bang,
    c: count,
    d: die,
    e: entangle,
    g: gate,
    h: harmony,
    l: logic,
    m: math,
    o: loop,
    p: print,
    q: quantize,
    r: rotate,
    s: scale,
    t: tempo,
    v: value,
    w: wave,
    k: knob,
    n: note,
}).map(([letter, operation]) => [letter, withMode(operation)]))

const operationFor = (letter: string): Operation | undefined =>
    Object.hasOwn(operations, letter) ? operations[letter] : undefined

const kinds: Kind[] = ["generator", "operator", "destination"]

// Every operation by its letter, for the instructions: the generators, then
// the operators, then the destinations, each alphabetically
export const instructions = Object.entries(operations)
    .sort(([a, x], [b, y]) => kinds.indexOf(x.kind) - kinds.indexOf(y.kind) || a.localeCompare(b))
    .map(([letter, { name, kind, about, params, rest }]) => ({ letter, name, kind, about, params, rest }))

// Whether the letter is a generator, operator or destination, or undefined when it
// isn't an operation
export const kindOf = (letter: string) => operationFor(letter)?.kind

// The params an operation takes on a grid of the given size, which is none for
// operations without a rule. A rest param repeats after the others to fill
// the rest of the row beside the operation, before the mode, which stays last
export const paramsFor = (letter: string, size: number): Param[] => {
    const operation = operationFor(letter)
    if (!operation) return []
    const { params, rest } = operation
    if (!rest) return params
    const [own, mode] = [params.slice(0, -1), params[params.length - 1]]
    return [...own, ...Array(Math.max(0, size - 1 - params.length)).fill(rest), mode]
}

// The indices of the params the argument editor shows for the arguments: those
// the operation shows, and the mode, which always shows
export const shownArgsFor = (letter: string, size: number, given: string[] = []) => {
    const count = operationFor(letter)?.shown?.(given) ?? Infinity
    return paramsFor(letter, size).flatMap((param, k) => k < count || isModeParam(param) ? [k] : [])
}

// The indices of the params an operation's inputs set, in order: every param
// but those only set in the argument editor, and of a rest param, only as far
// as the last one given, so the mode's input comes straight after them
export const inputParamsFor = (letter: string, size: number, given: string[] = []) => {
    const params = paramsFor(letter, size)
    const rest = operationFor(letter)?.rest
    const last = params.findLastIndex((param, k) => param === rest && (given[k] ?? "") !== "")
    return params.flatMap((param, k) => param.editorOnly || (param === rest && k > last) ? [] : [k])
}

// The given arguments for an operation, with defaults standing in for any
// missing or invalid ones, such as an argument that was erased
export const argsFor = (letter: string, size: number, given: string[] = []) =>
    paramsFor(letter, size).map((param, k) =>
        given[k] !== undefined && param.accepts(given[k]) ? given[k] : param.fallback
    )

// The mode of an operation given its arguments. An empty square counts as on
export const modeOf = (letter: string, size: number, given?: string[]) => {
    const params = paramsFor(letter, size)
    const k = params.findIndex(isModeParam)
    return k < 0 ? "on" : params[k].settle!(argsFor(letter, size, given)[k])
}

// The rule built for each square, with the operation and arguments it was
// built from. A square's rule is kept from tick to tick, so it can remember
// things, until its operation or arguments change, when the rule built in its
// place carries on from what it kept. Every rule is built afresh when the
// transport starts
let built = new Map<number, { key: string, rule: CellRule }>()

// Tells every built rule the transport has stopped, so those that remember
// something, such as c's count, can put it back
export const stopRules = () => {
    for (const { rule } of built.values()) rule.stop?.()
}

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
// as a count, or else what its arguments give, or else its
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

// The square an entangled square is entangled with, if it is one
export const entangledWith = (letter: string, size: number, given?: string[]) => {
    if (operationFor(letter) !== operations.e) return undefined
    const [x, y] = argsFor(letter, size, given).map(Number)
    return y * size + x
}

// Takes the moving cells with numbers on the inputs of every operation, whatever
// its mode, so one that's off can be turned back on, each setting its input's
// argument to the number it brings, when the param takes it. Bangs on the
// inputs of params that take a bang are taken and added to the names of the
// params banged on the square, setting the argument the param's fromBang
// gives, if any. Bangs on the inputs of other params with options are taken,
// stepping the argument on to the next option, wrapped. Bangs pass over every
// other input, setting nothing.
// Gives the cells left and the arguments, queueing each one set for the
// store, and each cell taken to show for the tick
const takeInputs = (
    cells: Cell[], size: number, letters: string[], given: string[][], inputs: Map<number, Input>,
    bangs: Map<number, Set<string>>,
) => {
    const args = [...given]
    const left = cells.map((cell, i) => {
        const input = inputs.get(i)
        if (!input || !isMoving(cell)) return cell
        const { owner, k } = input
        const param = paramsFor(letters[owner], size)[k]
        if (!param) return cell
        if (cell.value === BANG && !param.bang && !param.options) return cell
        if (cell.value === BANG && param.bang) bangs.set(owner, (bangs.get(owner) ?? new Set()).add(param.name))
        const text = cell.value !== BANG ? argFrom(param, cell.value!)
            : param.bang ? param.fromBang
            : nextOption(param, argsFor(letters[owner], size, args[owner])[k])
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

// The option after the argument a param has, wrapped to the first after the last
const nextOption = (param: Param, text: string) => {
    const options = param.options!
    const at = options.indexOf(param.settle?.(text) ?? text)
    return options[(at + 1) % options.length]
}

// What the rule on a square is given beside its cell: the params banged on the
// tick, and a way to set its own arguments by param name, queued for the
// store as an input's are, so they show and take effect from the next tick
const contextFor = (i: number, letter: string, size: number, bangs = new Set<string>()): Context => ({
    bangs,
    set: (name, text) => {
        const k = paramsFor(letter, size).findIndex(param => param.name === name)
        if (k >= 0) emit({ type: "arg", square: i, k, text })
    },
})

// Puts each cell the generators that aren't off put out on the square next to them in
// its direction, and a copy of it on the square next to them in each direction
// it splits off in, over any cell there, so the operation there acts on it on
// the tick it's put out. One that would go past the edge isn't put out
const generate = (cells: Cell[], size: number, letters: string[], args: string[][], tick: number) => {
    const next = [...cells]
    letters.forEach((letter, i) => {
        if (kindOf(letter) !== "generator" || modeOf(letter, size, args[i]) === "off") return
        const { split, ...cell } = ruleFor(i, letter, size, args[i])({}, tick, contextFor(i, letter, size))
        if (!isMoving(cell)) return
        for (const direction of [cell.direction!, ...split ?? []]) {
            const to = step(i, direction, size)
            if (to !== undefined) next[to] = { ...cell, direction }
        }
    })
    return next
}

// Applies the rule for every square with an operation that isn't off, once
// the values on their inputs have set their arguments, so an argument set on
// a tick works from that tick. The generators put out their cells first, and
// the inputs take the cells put on them too. Cells arriving on a generator
// pass through. Invalid arguments fall back to defaults. The rule of a square that's off
// is kept, so it carries on from where it was when it's on again
const applyRules: GridRule = (given, size, letters, givenArgs, inputs, tick) => {
    if (tick === 0) built = new Map()
    const bangs = new Map<number, Set<string>>()
    const taken = takeInputs(given, size, letters, givenArgs, inputs, bangs)
    const generated = generate(taken.cells, size, letters, taken.args, tick)
    const { cells, args } = takeInputs(generated, size, letters, taken.args, inputs, bangs)
    const next = cells.map((cell, i) => {
        if (!operationFor(letters[i])) {
            built.delete(i)
            return cell
        }
        const mode = modeOf(letters[i], size, args[i])
        if (mode === "off" || kindOf(letters[i]) === "generator") return cell
        const next = ruleFor(i, letters[i], size, args[i])(cell, tick, contextFor(i, letters[i], size, bangs.get(i)))
        // A thru destination does what it does, but lets through what it would absorb
        if (mode === "thru" && cell.value !== undefined && next.value === undefined) return cell
        // A destination's cells still show on it for the tick they're absorbed
        if (kindOf(letters[i]) === "destination" && isMoving(cell) && next.value === undefined) {
            emit({ type: "absorb", square: i, cell })
        }
        return next
    })
    return copyEntangled(next, size, letters, args)
}

// Copies onto each entangled square that's on the cell on the square it's
// entangled with, as it is once every other square's rule has run, so the
// copy carries on from there, heading the same way. One entangled with an
// empty square lets what arrives on it pass
const copyEntangled = (cells: Cell[], size: number, letters: string[], args: string[][]) => {
    const next = [...cells]
    letters.forEach((letter, i) => {
        if (!operationFor(letter) || modeOf(letter, size, args[i]) === "off") return
        const from = built.get(i)?.rule.entangled?.(size)
        if (from === undefined || cells[from]?.value === undefined) return
        next[i] = { ...cells[from] }
    })
    return next
}

// Chain or rules to apply on each division of the cycle
// Called in scheduler.ts
export const rules = [
    move,
    applyRules,
]
