import { fixed, type Letter, type GridRule } from "./rule"
import { turn } from "./turn"
import { reverse } from "./reverse"
import { die } from "./die"
import { bang } from "./bang"
import { life } from "./life"
import { neighbours } from "../lib/utils"

export const rules: Record<string, Letter> = {
    n: fixed(turn("n")),
    s: fixed(turn("s")),
    e: fixed(turn("e")),
    w: fixed(turn("w")),
    r: fixed(reverse),
    d: fixed(die),
    b: bang,
    g: fixed(life),
}

// The params a letter takes, which is none for letters without a rule
export const paramsFor = (letter: string) => rules[letter.toLowerCase()]?.params ?? []

// The given arguments for a letter, with defaults filling in any missing ones
export const argsFor = (letter: string, given: string[] = []) =>
    paramsFor(letter).map((param, k) => given[k] ?? param.fallback)

// Applies the rule for every square with a letter
// The letter's case is ignored, and invalid arguments fall back to defaults
export const applyRules: GridRule = (cells, size, letters, args, tick) =>
    cells.map((cell, i) => {
        const letter = letters[i] && rules[letters[i].toLowerCase()]
        if (!letter) return cell
        const valid = letter.params.map((param, k) =>
            args[i]?.[k] !== undefined && param.accepts(args[i][k]) ? args[i][k] : param.fallback
        )
        return letter.rule(...valid)(cell, tick, neighbours(i, size).map(j => cells[j]))
    })
