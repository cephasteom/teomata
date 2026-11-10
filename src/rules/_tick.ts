import type { Cell } from "../stores/cells"
import type { Context, GridRule, Input, Param } from "./_types"
import { argFrom, isMoving } from "./_shared"
import { BANG, step as stepFrom } from "../lib/utils"
import { SIZE } from "../stores/global"
import { emit } from "./_events"
import { operationFor, kindOf } from "./_registry"
import { argsFor, modeOf, paramsFor } from "./_args"
import { cachedRule, clearRules, forgetRule, ruleFor } from "./_ruleCache"

type Bangs = Map<number, Set<string>>

// What the tick carries between stages. `args` starts as what was typed and
// picks up values set by inputs.
type TickState = { cells: Cell[], args: string[][], bangs: Bangs }

const nextOption = (param: Param, current: string) => {
    const options = param.options!
    const at = options.indexOf(param.settle?.(current) ?? current)
    return options[(at + 1) % options.length]
}

// A bang only stops on an input whose param takes bangs or has options
const passesOver = (param: Param, cell: Cell) =>
    cell.value === BANG && !param.bang && !param.options

// The arg a cell sets on its input, or undefined to leave it as it is
const argFromCell = (param: Param, cell: Cell, current: string) =>
    cell.value !== BANG ? argFrom(param, cell.value!)
    : param.bang ? param.fromBang
    : nextOption(param, current)

const withBang = (bangs: Bangs, square: number, name: string): Bangs =>
    new Map(bangs).set(square, new Set(bangs.get(square)).add(name))

// Inputs run whatever the owner's mode, so an "off" square can be switched
// back on from its input
const absorbInputs = (state: TickState, letters: string[], inputs: Map<number, Input>): TickState => {
    const args = [...state.args]
    let bangs = state.bangs
    const cells = state.cells.map((cell, square) => {
        const input = inputs.get(square)
        if (!input || !isMoving(cell)) return cell
        const { owner, k: p } = input
        const param = paramsFor(letters[owner])[p]
        if (!param || passesOver(param, cell)) return cell

        if (cell.value === BANG && param.bang) bangs = withBang(bangs, owner, param.name)
        const ownerArgs = argsFor(letters[owner], args[owner])
        const text = argFromCell(param, cell, ownerArgs[p])
        if (text !== undefined) {
            args[owner] = ownerArgs.with(p, text)
            emit({ type: "arg", square: owner, k: p, text })
        }
        emit({ type: "absorb", square, cell })
        return {}
    })
    return { cells, args, bangs }
}

// A rule can set its own args by param name; like an input's, they apply from
// the next tick
const contextFor = (square: number, letter: string, bangs = new Set<string>()): Context => ({
    bangs,
    set: (name, text) => {
        const p = paramsFor(letter).findIndex(param => param.name === name)
        if (p >= 0) emit({ type: "arg", square, k: p, text })
    },
})

const isRunning = (letter: string, typed?: string[]) =>
    operationFor(letter) !== undefined && modeOf(letter, typed) !== "off"

// Generators put their cell (and any split copies) on the neighbouring
// squares, so those squares act on it this tick
const generate = ({ cells, args }: TickState, letters: string[], tick: number): Cell[] => {
    const next = [...cells]
    letters.forEach((letter, square) => {
        if (kindOf(letter) !== "generator" || !isRunning(letter, args[square])) return
        const rule = ruleFor(square, letter, argsFor(letter, args[square]))
        const { split, ...cell } = rule({}, tick, contextFor(square, letter))
        if (!isMoving(cell)) return
        for (const direction of [cell.direction!, ...split ?? []]) {
            const to = stepFrom(square, direction, SIZE)
            if (to !== undefined) next[to] = { ...cell, direction }
        }
    })
    return next
}

// An "off" square keeps its rule, so it resumes where it was when back on
const runSquare = (cell: Cell, square: number, letter: string, { args, bangs }: TickState, tick: number): Cell => {
    if (!operationFor(letter)) {
        forgetRule(square)
        return cell
    }
    const mode = modeOf(letter, args[square])
    if (mode === "off" || kindOf(letter) === "generator") return cell

    const rule = ruleFor(square, letter, argsFor(letter, args[square]))
    const result = rule(cell, tick, contextFor(square, letter, bangs.get(square)))
    const absorbed = cell.value !== undefined && result.value === undefined
    if (mode === "thru" && absorbed) return cell
    // Show the absorbed cell on the destination for this tick
    if (kindOf(letter) === "destination" && isMoving(cell) && absorbed) emit({ type: "absorb", square, cell })
    return result
}

// Runs after every other square, so the copy reflects this tick's result
const copyEntangled = (cells: Cell[], letters: string[], args: string[][]): Cell[] =>
    cells.map((cell, square) => {
        if (!isRunning(letters[square], args[square])) return cell
        const from = cachedRule(square)?.entangled?.()
        if (from === undefined || cells[from]?.value === undefined) return cell
        return { ...cells[from] }
    })

export const step: GridRule = (cells, letters, typed, inputs, tick) => {
    if (tick === 0) clearRules()
    const start: TickState = { cells, args: typed, bangs: new Map() }
    const afterInputs = absorbInputs(start, letters, inputs)
    const afterGenerators = { ...afterInputs, cells: generate(afterInputs, letters, tick) }
    // Inputs again, for cells the generators just put on them
    const final = absorbInputs(afterGenerators, letters, inputs)
    const ran = final.cells.map((cell, square) => runSquare(cell, square, letters[square], final, tick))
    return copyEntangled(ran, letters, final.args)
}
