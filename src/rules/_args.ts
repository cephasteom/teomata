import type { Param } from "./_types"
import { isModeParam } from "./_shared"
import { SIZE } from "../stores/global"
import { operationFor } from "./_registry"

// `typed` is what the user entered for a square, possibly missing or invalid;
// `args` is the full list with defaults filled in.

// A rest param repeats to fill the row beside the operation; mode stays last.
export const paramsFor = (letter: string): Param[] => {
    const operation = operationFor(letter)
    if (!operation) return []
    const { params, rest } = operation
    if (!rest) return params
    const own = params.slice(0, -1)
    const mode = params[params.length - 1]
    const restCount = Math.max(0, SIZE - 1 - params.length)
    return [...own, ...Array(restCount).fill(rest), mode]
}

export const argsFor = (letter: string, typed: string[] = []): string[] =>
    paramsFor(letter).map((param, p) =>
        typed[p] !== undefined && param.accepts(typed[p]) ? typed[p] : param.fallback
    )

// An empty square counts as on
export const modeOf = (letter: string, typed?: string[]) => {
    const params = paramsFor(letter)
    const p = params.findIndex(isModeParam)
    return p < 0 ? "on" : params[p].settle!(argsFor(letter, typed)[p])
}

// Param indices shown in the argument editor; mode is always shown
export const shownArgsFor = (letter: string, typed: string[] = []) => {
    const count = operationFor(letter)?.shown?.(typed) ?? Infinity
    return paramsFor(letter).flatMap((param, p) => p < count || isModeParam(param) ? [p] : [])
}

// Param indices that get an input square. Rest params only up to the last one
// typed, so the mode's input sits straight after them.
export const inputParamsFor = (letter: string, typed: string[] = []) => {
    const params = paramsFor(letter)
    const rest = operationFor(letter)?.rest
    const lastRest = params.findLastIndex((param, p) => param === rest && (typed[p] ?? "") !== "")
    return params.flatMap((param, p) => param.editorOnly || (param === rest && p > lastRest) ? [] : [p])
}

export const entangledWith = (letter: string, typed?: string[]) => {
    if (letter !== "e") return undefined
    const [x, y] = argsFor(letter, typed).map(Number)
    return y * SIZE + x
}

// The square at the end of i's chain of entanglements, empty or not, or
// undefined when i isn't entangled or the chain loops back
export const entangledSource = (i: number, operations: string[], args: string[][]) => {
    const seen = new Set([i])
    let to = entangledWith(operations[i], args[i])
    while (to !== undefined && !seen.has(to)) {
        seen.add(to)
        const next = entangledWith(operations[to], args[to])
        if (next === undefined) return to
        to = next
    }
    return undefined
}

// The square at the end of i's chain of entanglements, or i itself when the
// chain is empty, reaches an empty square, or loops back
export const resolveEntangled = (i: number, operations: string[], args: string[][]) => {
    const to = entangledSource(i, operations, args)
    return to !== undefined && operations[to] ? to : i
}
