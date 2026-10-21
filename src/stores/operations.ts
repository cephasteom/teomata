import { writable, get } from "svelte/store"
import { gridSize } from "./global"
import type { direction } from "./cells"
import { step } from "../lib/utils"

// One operation per square, or "" for none. Operations belong to the square rather
// than the cell on it, so they stay put while cells move over them.
export const operations = writable<string[]>(
    Array.from({ length: Math.pow(get(gridSize), 2) }, () => "")
)

// The arguments typed in for each square's operation, as text. A square's
// arguments are cleared when its operation changes
export const args = writable<string[][]>(
    Array.from({ length: Math.pow(get(gridSize), 2) }, () => [])
)

// Puts the same operation, or "" to clear them, on every one of the squares
// Typing the operation a square already has keeps its arguments
export const setOperations = (squares: Iterable<number>, operation: string) => {
    const list = [...squares]
    const current = get(operations)
    const changed = list.filter(i => current[i].toLowerCase() !== operation.toLowerCase())
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

// Steps the operations on the squares, with their arguments, one square over.
// They land on top of whatever was there, and the squares they leave are emptied
export const moveOperations = (squares: Iterable<number>, direction: direction) => {
    const list = [...squares]
    const size = get(gridSize)
    const shift = <T>(values: T[], empty: () => T) => {
        const next = [...values]
        for (const i of list) next[i] = empty()
        for (const i of list) next[step(i, direction, size)] = values[i]
        return next
    }
    operations.update(operations => shift(operations, () => ""))
    args.update(args => shift(args, () => []))
}

// The operations and arguments last copied, as a rectangle read row by row
type Copied = { width: number, height: number, operations: string[], args: string[][] }
let clipboard: Copied | null = null

type Rectangle = { x1: number, x2: number, y1: number, y2: number }

// Copies the operations and arguments in the rectangle, empty squares included
export const copyOperations = ({ x1, x2, y1, y2 }: Rectangle) => {
    const size = get(gridSize)
    const [$operations, $args] = [get(operations), get(args)]
    const squares: number[] = []
    for (let y = y1; y <= y2; y++) {
        for (let x = x1; x <= x2; x++) squares.push(y * size + x)
    }
    clipboard = {
        width: x2 - x1 + 1,
        height: y2 - y1 + 1,
        operations: squares.map(i => $operations[i]),
        args: squares.map(i => $args[i]),
    }
}

// Pastes the copied rectangle with its top left corner on the square, over
// whatever is there. Whatever would reach past the edge is cut off. Returns
// the rectangle it pasted into, or null when nothing has been copied
export const pasteOperations = (x: number, y: number): Rectangle | null => {
    if (!clipboard) return null
    const { width, height } = clipboard
    const size = get(gridSize)
    const pasted = { x1: x, x2: Math.min(x + width, size) - 1, y1: y, y2: Math.min(y + height, size) - 1 }
    const paste = <T>(values: T[], copied: T[]) => {
        const next = [...values]
        for (let dy = 0; dy <= pasted.y2 - y; dy++) {
            for (let dx = 0; dx <= pasted.x2 - x; dx++) {
                next[(y + dy) * size + x + dx] = copied[dy * width + dx]
            }
        }
        return next
    }
    operations.update(operations => paste(operations, clipboard!.operations))
    args.update(args => paste(args, clipboard!.args))
    return pasted
}

export const clearOperations = () => {
    operations.set(Array.from({ length: Math.pow(get(gridSize), 2) }, () => ""))
    args.set(Array.from({ length: Math.pow(get(gridSize), 2) }, () => []))
}
