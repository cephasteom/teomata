import type { CellRule } from "./_types"
import { operationFor } from "./_registry"
import { argsFor } from "./_args"

// Rules hold state in closures (a count, a loop position), so each square
// keeps its rule until its letter or args change. This is the only mutable
// state in the rules.
type Cached = { letter: string, key: string, rule: CellRule }

let cache = new Map<number, Cached>()

const cacheKey = (letter: string, args: string[]) => [letter, ...args].join("\n")

// What rules saved, by square, for the letter that saved it, which the next
// rule built there for that letter loads. Outlasts the rules themselves
export type Saved = { letter: string, data: unknown }

let saved = new Map<number, Saved>()

// Keeps what the square's rule saves before it's dropped
const keepSaved = (square: number) => {
    const cached = cache.get(square)
    if (cached?.rule.save) saved.set(square, { letter: cached.letter, data: cached.rule.save() })
}

export const clearRules = () => {
    for (const square of cache.keys()) keepSaved(square)
    cache = new Map()
}

export const forgetRule = (square: number) => {
    cache.delete(square)
    saved.delete(square)
}

// What every square's rule has saved, as it is now
export const savedRules = () => {
    for (const square of cache.keys()) keepSaved(square)
    return new Map(saved)
}

// Replaces what the rules have saved, such as from a patch. Rules that save
// are rebuilt, loading it
export const loadRules = (next: Map<number, Saved>) => {
    saved = new Map(next)
    for (const [square, { rule }] of cache) if (rule.load) cache.delete(square)
}

export const cachedRule = (square: number) => cache.get(square)?.rule

export const stopRules = () => {
    for (const { rule } of cache.values()) rule.stop?.()
}

// A rebuilt rule for the same letter carries on from what the old one kept
export const ruleFor = (square: number, letter: string, args: string[]): CellRule => {
    const key = cacheKey(letter, args)
    const cached = cache.get(square)
    if (cached?.key === key) return cached.rule
    const rule = operationFor(letter)!.rule(...args)
    if (cached?.letter === letter) rule.carry?.(cached.rule.keep?.())
    else {
        const kept = saved.get(square)
        if (kept?.letter === letter) rule.load?.(kept.data)
        else saved.delete(square)
    }
    cache.set(square, { letter, key, rule })
    return rule
}

// What the rule remembers (e.g. a count) wins over the label its args give
export const labelFor = (square: number, letter: string, typed?: string[], expanded = false) => {
    const operation = operationFor(letter)
    if (!operation) return letter
    const args = argsFor(letter, typed)
    const cached = cache.get(square)
    const remembered = cached?.key === cacheKey(letter, args) ? cached.rule.label?.() : undefined
    const label = expanded ? operation.expandedLabel : operation.label
    return remembered ?? label?.(...args) ?? letter
}
