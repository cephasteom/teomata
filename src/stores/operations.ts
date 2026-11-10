import { writable, derived, get } from "svelte/store"
import { SIZE } from "./global"
import type { direction } from "./cells"
import { opposite, step, type Rect } from "../lib/utils"
import { argsFor, inputParamsFor, modeOf, paramsFor } from "../rules"
import { isModeParam } from "../rules/_shared"
import type { Input } from "../rules/_types"

// One operation per square, or "" for none. Operations belong to the square rather
// than the cell on it, so they stay put while cells move over them.
export const operations = writable<string[]>(
    Array.from({ length: SIZE * SIZE }, () => "")
)

// The arguments typed in for each square's operation, as text. A square's
// arguments are cleared when its operation changes
export const args = writable<string[][]>(
    Array.from({ length: SIZE * SIZE }, () => [])
)

// The mode each square's operation is in, from its arguments. An operation
// that's off stays on its square but does nothing, and keeps what it remembers,
// until it is on again
export const modes = derived([operations, args], ([$operations, $args]) =>
    $operations.map((letter, i) => modeOf(letter, $args[i]))
)

// How far each square's operation reaches out into inputs, in a line from its
// square, or null when it has none. The squares along the line are inputs for
// its params in order, skipping those only set in the argument editor, so a
// length of 2 gives the first two params that take inputs.
// A square's expansion is cleared when its operation changes
export type Expansion = { direction: direction, length: number }

export const expansions = writable<(Expansion | null)[]>(
    Array.from({ length: SIZE * SIZE }, () => null)
)

// The squares an operation's inputs sit on, from its own square outwards,
// stopping at the edge of the grid
export const inputSquares = (i: number, { direction, length }: Expansion) => {
    const squares: number[] = []
    for (let at = step(i, direction, SIZE); at !== undefined && squares.length < length; at = step(at, direction, SIZE)) {
        squares.push(at)
    }
    return squares
}

// The operation and param each input square belongs to, keyed by square
export const inputs = derived([expansions, operations, args], ([$expansions, $operations, $args]) => {
    const map = new Map<number, Input>()
    $expansions.forEach((expansion, owner) => {
        if (!expansion) return
        const params = inputParamsFor($operations[owner], $args[owner])
        inputSquares(owner, expansion).forEach((square, j) => {
            if (params[j] !== undefined) map.set(square, { owner, k: params[j] })
        })
    })
    return map
})

// Cuts every expansion short where its inputs would run past the edge, onto
// an operation, or onto another operation's inputs, the operation nearer the
// grid's top left keeping them, or past the operation's params, such as an
// array's values once some are erased. Drops those left with none, or on a
// square without an operation
export const fitExpansions = () => {
    const [$operations, $args] = [get(operations), get(args)]
    const taken = new Set<number>()
    const fitted = get(expansions).map((expansion, i) => {
        if (!expansion) return null
        const most = Math.min(expansion.length, inputParamsFor($operations[i], $args[i]).length)
        const squares = inputSquares(i, { ...expansion, length: most })
        const free = squares.findIndex(square => $operations[square] || taken.has(square))
        const length = free < 0 ? squares.length : free
        squares.slice(0, length).forEach(square => taken.add(square))
        return length ? { direction: expansion.direction, length } : null
    })
    const current = get(expansions)
    const changed = fitted.some((expansion, i) =>
        expansion?.direction !== current[i]?.direction || expansion?.length !== current[i]?.length
    )
    if (changed) expansions.set(fitted)
}

// Reaches the operation on the square out one more input towards the
// direction, or draws it back one when the direction is the opposite of its
// own. Turning to either side starts its inputs afresh that way, with one.
// It only grows onto a free square, up to one input for each param that takes
// one, which for an array is each value given and its mode
export const expand = (square: number, direction: direction) => {
    const $operations = get(operations)
    const most = inputParamsFor($operations[square], get(args)[square]).length
    const current = get(expansions)[square]
    const own = new Set(current ? inputSquares(square, current) : [])
    let next: Expansion | null
    if (current && direction === opposite[current.direction]) {
        next = current.length > 1 ? { direction: current.direction, length: current.length - 1 } : null
    } else {
        next = { direction, length: current?.direction === direction ? current.length + 1 : 1 }
        const squares = inputSquares(square, next)
        const end = squares[next.length - 1]
        const taken = (at: number) => $operations[at] || (get(inputs).has(at) && !own.has(at))
        if (next.length > most || end === undefined || taken(end)) return
    }
    expansions.update(expansions => {
        const updated = [...expansions]
        updated[square] = next
        return updated
    })
}

// Sets an argument from a value that arrived on an input, filling in the
// operation's other arguments with defaults where they are unset
export const setInputArg = (square: number, k: number, text: string) => {
    args.update(args => {
        const next = [...args]
        next[square] = argsFor(get(operations)[square], next[square])
        next[square][k] = text
        return next
    })
}

// Moves the operations on the squares on to the mode after the one the square
// given is in, or the first with an operation when it hasn't one, among the
// modes that square's operation has, or back to on for those without it.
// Squares without an operation are left alone
export const stepModes = (squares: Iterable<number>, from: number) => {
    const $operations = get(operations)
    const list = [...squares].filter(i => $operations[i])
    if (!list.length) return
    const at = $operations[from] ? from : list[0]
    const options = paramsFor($operations[at]).find(isModeParam)!.options!
    const mode = options[(options.indexOf(get(modes)[at]) + 1) % options.length]
    args.update(args => {
        const next = [...args]
        for (const i of list) {
            const params = paramsFor($operations[i])
            const k = params.findIndex(isModeParam)
            next[i] = argsFor($operations[i], next[i])
            next[i][k] = params[k].accepts(mode) ? mode : params[k].fallback
        }
        return next
    })
}

// What squares had before their arguments opened, keyed by square. The rules
// run on these until the arguments close, so an edit only takes effect once
// it is done
let held = new Map<number, { operation: string, args: string[] }>()

// Holds the squares at what they had in the given operations and arguments
export const holdOperations = (squares: Iterable<number>, before: { operations: string[], args: string[][] }) => {
    held = new Map([...squares].map(i => [i, { operation: before.operations[i], args: before.args[i] }]))
}

// Lets the rules see what the held squares have now
export const releaseOperations = () => {
    held = new Map()
}

// The operations and arguments the rules run on: what each square has, or
// what it had for the squares being edited
export const appliedOperations = () => {
    const [$operations, $args] = [[...get(operations)], [...get(args)]]
    for (const [i, { operation, args }] of held) {
        $operations[i] = operation
        $args[i] = args
    }
    return { operations: $operations, args: $args, inputs: get(inputs) }
}

// Puts the same operation, or "" to clear them, on every one of the squares
// Typing the operation a square already has keeps its arguments and inputs,
// and an operation typed onto another's inputs cuts them short before it
export const setOperations = (squares: Iterable<number>, operation: string) => {
    const list = [...squares]
    const current = get(operations)
    const changed = list.filter(i => current[i] !== operation)
    operations.update(operations => {
        const next = [...operations]
        for (const i of list) next[i] = operation
        return next
    })
    args.update(args => {
        const next = [...args]
        for (const i of changed) next[i] = []
        return next
    })
    expansions.update(expansions => {
        const next = [...expansions]
        for (const i of changed) next[i] = null
        return next
    })
    fitExpansions()
}

// Sets the same argument for the operation on every one of the squares
export const setArg = (squares: Iterable<number>, k: number, text: string) => {
    args.update(args => {
        const next = [...args]
        for (const square of squares) {
            next[square] = [...next[square]]
            next[square][k] = text
        }
        return next
    })
}

// Steps the operations on the squares, with their arguments and inputs, one
// square over.
// They land on top of whatever was there, and the squares they leave are
// emptied. Any that would step past the edge are lost
export const moveOperations = (squares: Iterable<number>, direction: direction) => {
    const list = [...squares]
    const shift = <T>(values: T[], empty: () => T) => {
        const next = [...values]
        for (const i of list) next[i] = empty()
        for (const i of list) {
            const to = step(i, direction, SIZE)
            if (to !== undefined) next[to] = values[i]
        }
        return next
    }
    operations.update(operations => shift(operations, () => ""))
    args.update(args => shift(args, () => []))
    expansions.update(expansions => shift(expansions, () => null))
    fitExpansions()
}

// The operations, arguments and inputs last copied, as a rectangle read row by row
type Copied = {
    width: number, height: number, operations: string[], args: string[][], expansions: (Expansion | null)[],
}
let clipboard: Copied | null = null

// Copies the operations, arguments and inputs in the rectangle, empty squares included
export const copyOperations = ({ x1, x2, y1, y2 }: Rect) => {
    const [$operations, $args, $expansions] = [get(operations), get(args), get(expansions)]
    const squares: number[] = []
    for (let y = y1; y <= y2; y++) {
        for (let x = x1; x <= x2; x++) squares.push(y * SIZE + x)
    }
    clipboard = {
        width: x2 - x1 + 1,
        height: y2 - y1 + 1,
        operations: squares.map(i => $operations[i]),
        args: squares.map(i => $args[i]),
        expansions: squares.map(i => $expansions[i]),
    }
}

// Pastes the copied rectangle with its top left corner on the square, over
// whatever is there. Whatever would reach past the edge is cut off. Returns
// the rectangle it pasted into, or null when nothing has been copied
export const pasteOperations = (x: number, y: number): Rect | null => {
    if (!clipboard) return null
    const { width, height } = clipboard
    const pasted = { x1: x, x2: Math.min(x + width, SIZE) - 1, y1: y, y2: Math.min(y + height, SIZE) - 1 }
    const paste = <T>(values: T[], copied: T[]) => {
        const next = [...values]
        for (let dy = 0; dy <= pasted.y2 - y; dy++) {
            for (let dx = 0; dx <= pasted.x2 - x; dx++) {
                next[(y + dy) * SIZE + x + dx] = copied[dy * width + dx]
            }
        }
        return next
    }
    operations.update(operations => paste(operations, clipboard!.operations))
    args.update(args => paste(args, clipboard!.args))
    expansions.update(expansions => paste(expansions, clipboard!.expansions))
    fitExpansions()
    return pasted
}

export const clearOperations = () => {
    releaseOperations()
    operations.set(Array.from({ length: SIZE * SIZE }, () => ""))
    args.set(Array.from({ length: SIZE * SIZE }, () => []))
    expansions.set(Array.from({ length: SIZE * SIZE }, () => null))
}
