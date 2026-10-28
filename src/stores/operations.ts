import { writable, get } from "svelte/store"
import { SIZE } from "./global"
import type { direction } from "./cells"
import { step } from "../lib/utils"

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

// Whether each square's operation is muted. A muted operation stays on its
// square but does nothing, and keeps what it remembers, until it is unmuted.
// A square is unmuted when its operation changes
export const muted = writable<boolean[]>(
    Array.from({ length: SIZE * SIZE }, () => false)
)

// Mutes the operations on the squares, or unmutes them when every one is
// already muted. Squares without an operation are left alone
export const toggleMuted = (squares: Iterable<number>) => {
    const $operations = get(operations)
    const list = [...squares].filter(i => $operations[i])
    if (!list.length) return
    const mute = list.some(i => !get(muted)[i])
    muted.update(muted => {
        const next = [...muted]
        for (const i of list) next[i] = mute
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
    return { operations: $operations, args: $args, muted: get(muted) }
}

// Puts the same operation, or "" to clear them, on every one of the squares
// Typing the operation a square already has keeps its arguments
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
    muted.update(muted => {
        const next = [...muted]
        for (const i of changed) next[i] = false
        return next
    })
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

// Steps the operations on the squares, with their arguments and whether they
// are muted, one square over.
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
    muted.update(muted => shift(muted, () => false))
}

// The operations, arguments and mutes last copied, as a rectangle read row by row
type Copied = { width: number, height: number, operations: string[], args: string[][], muted: boolean[] }
let clipboard: Copied | null = null

type Rectangle = { x1: number, x2: number, y1: number, y2: number }

// Copies the operations, arguments and mutes in the rectangle, empty squares included
export const copyOperations = ({ x1, x2, y1, y2 }: Rectangle) => {
    const [$operations, $args, $muted] = [get(operations), get(args), get(muted)]
    const squares: number[] = []
    for (let y = y1; y <= y2; y++) {
        for (let x = x1; x <= x2; x++) squares.push(y * SIZE + x)
    }
    clipboard = {
        width: x2 - x1 + 1,
        height: y2 - y1 + 1,
        operations: squares.map(i => $operations[i]),
        args: squares.map(i => $args[i]),
        muted: squares.map(i => $muted[i]),
    }
}

// Pastes the copied rectangle with its top left corner on the square, over
// whatever is there. Whatever would reach past the edge is cut off. Returns
// the rectangle it pasted into, or null when nothing has been copied
export const pasteOperations = (x: number, y: number): Rectangle | null => {
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
    muted.update(muted => paste(muted, clipboard!.muted))
    return pasted
}

export const clearOperations = () => {
    releaseOperations()
    operations.set(Array.from({ length: SIZE * SIZE }, () => ""))
    args.set(Array.from({ length: SIZE * SIZE }, () => []))
    muted.set(Array.from({ length: SIZE * SIZE }, () => false))
}
