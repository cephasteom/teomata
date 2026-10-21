import { fixed, type Operation, type GridRule } from "./rule"
import { turn } from "./turn"
import { reverse } from "./reverse"
import { die } from "./die"
import { bang } from "./bang"
import { life } from "./life"
import { neighbours } from "../lib/utils"

export const rules: Record<string, Operation> = {
    n: fixed(turn("n")),
    s: fixed(turn("s")),
    e: fixed(turn("e")),
    w: fixed(turn("w")),
    r: fixed(reverse),
    d: fixed(die),
    b: bang,
    g: fixed(life),
}

// The params an operation takes, which is none for operations without a rule
export const paramsFor = (operation: string) => rules[operation.toLowerCase()]?.params ?? []

// The given arguments for an operation, with defaults filling in any missing ones
export const argsFor = (operation: string, given: string[] = []) =>
    paramsFor(operation).map((param, k) => given[k] ?? param.fallback)

// Applies the rule for every square with an operation
// The operation's case is ignored, and invalid arguments fall back to defaults
export const applyRules: GridRule = (cells, size, operations, args, tick) =>
    cells.map((cell, i) => {
        const operation = operations[i] && rules[operations[i].toLowerCase()]
        if (!operation) return cell
        const valid = operation.params.map((param, k) =>
            args[i]?.[k] !== undefined && param.accepts(args[i][k]) ? args[i][k] : param.fallback
        )
        return operation.rule(...valid)(cell, tick, neighbours(i, size).map(j => cells[j]))
    })
