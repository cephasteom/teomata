import type { Operation, GridRule } from "./types"
import { move } from "./move"
import { north, south, east, west } from "./turn"
import { reverse } from "./reverse"
import { die } from "./die"
import { bang } from "./bang"
import { life } from "./life"
import { neighbours } from "../lib/utils"

const operations: Record<string, Operation> = {
    n: north,
    s: south,
    e: east,
    w: west,
    r: reverse,
    d: die,
    b: bang,
    g: life,
}

// Every operation by its letter, for the instructions
export const instructions = Object.entries(operations).map(([letter, { name, about, params }]) => ({ letter, name, about, params }))

// The params an operation takes, which is none for operations without a rule
export const paramsFor = (letter: string) => operations[letter.toLowerCase()]?.params ?? []

// The given arguments for an operation, with defaults standing in for any
// missing or invalid ones, such as an argument that was erased
export const argsFor = (letter: string, given: string[] = []) =>
    paramsFor(letter).map((param, k) =>
        given[k] !== undefined && param.accepts(given[k]) ? given[k] : param.fallback
    )

// Applies the rule for every square with an operation
// The operation's case is ignored, and invalid arguments fall back to defaults
const applyRules: GridRule = (cells, size, letters, args, tick) =>
    cells.map((cell, i) => {
        const operation = letters[i] && operations[letters[i].toLowerCase()]
        if (!operation) return cell
        return operation.rule(...argsFor(letters[i], args[i]))(cell, tick, neighbours(i, size).map(j => cells[j]))
    })

// Chain or rules to apply on each division of the cycle
// Called in scheduler.ts
export const rules = [
    move, 
    applyRules
]