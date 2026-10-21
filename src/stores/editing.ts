import { writable, derived, get } from "svelte/store"
import type { direction } from "./cells"
import { gridSize } from "./global"
import { operations, args, setArg } from "./operations"
import { cursor, anchor, placeCursor } from "./cursor"
import { argsFor, paramsFor } from "../rules"

// The square whose operation has its arguments open for editing, or null
export const editing = writable<number | null>(null)

// The squares the open operation's arguments show in, in order. They run out
// from the operation's square, downwards, or upwards when the column runs out
// of room, so the first argument is always next to the operation
export const argSquares = derived([editing, operations, gridSize], ([$editing, $operations, $size]) => {
    if ($editing === null) return []
    const count = paramsFor($operations[$editing]).length
    const way = Math.floor($editing / $size) + count < $size ? $size : -$size
    return Array.from({ length: count }, (_, k) => $editing + way * (k + 1))
})

// The squares the arguments' labels show in, one beside each argument. They
// sit to the left, like the controls' labels, or to the right when the
// operation is in the first column, so they stay on the grid
export const labelSquares = derived([editing, argSquares, gridSize], ([$editing, $squares, $size]) => {
    if ($editing === null) return []
    const side = $editing % $size === 0 ? 1 : -1
    return $squares.map(square => square + side)
})

type Area = { x1: number, x2: number, y1: number, y2: number }

// The open columns of squares as inclusive rectangles: the operation's with its
// arguments', and the labels' beside them. Empty when no arguments are open
export const openAreas = derived([editing, argSquares, labelSquares, gridSize], ([$editing, $squares, $labels, $size]) => {
    if ($editing === null) return []
    const column = (squares: number[]): Area => {
        const rows = squares.map(square => Math.floor(square / $size))
        const x = squares[0] % $size
        return { x1: x, x2: x, y1: Math.min(...rows), y2: Math.max(...rows) }
    }
    return $labels.length ? [column([$editing, ...$squares]), column($labels)] : [column([$editing])]
})

// What each argument square shows, keyed by square
export const argCells = derived([editing, argSquares, operations, args], ([$editing, $squares, $operations, $args]) => {
    const shown = new Map<number, { text: string, valid: boolean }>()
    if ($editing === null) return shown
    const params = paramsFor($operations[$editing])
    $squares.forEach((square, k) => {
        const text = $args[$editing][k] ?? params[k].fallback
        shown.set(square, { text, valid: params[k].accepts(text) })
    })
    return shown
})

// What each label square shows, keyed by square
export const labelCells = derived([editing, labelSquares, operations], ([$editing, $labels, $operations]) => {
    const shown = new Map<number, string>()
    if ($editing === null) return shown
    const params = paramsFor($operations[$editing])
    $labels.forEach((square, k) => shown.set(square, params[k].label))
    return shown
})

// True until something is typed on the argument the cursor just moved onto,
// so the first key replaces the argument and later keys add to it
let fresh = true

// The squares an edited argument goes to: the open square and every selected
// square with the same operation
let targets: number[] = []

// Where the selection was anchored when the arguments opened
let selectedFrom = 0

// Opens a square's arguments for editing. Arguments typed in also go to the
// other selected squares with the same operation, ignoring case. Every one of
// them is filled in with defaults where its arguments are unset. The cursor
// goes to the first argument, or stays on the operation when it has none
export const openArgs = (square: number, selected: Iterable<number> = []) => {
    const all = get(operations)
    const operation = all[square]
    if (!operation) return
    targets = [square, ...[...selected].filter(i =>
        i !== square && all[i].toLowerCase() === operation.toLowerCase()
    )]
    args.update(args => {
        const next = [...args]
        for (const i of targets) next[i] = argsFor(operation, args[i])
        return next
    })
    selectedFrom = get(anchor)
    editing.set(square)
    placeCursor(get(argSquares)[0] ?? square)
    fresh = true
}

// Puts the cursor back on the operation's square, with the selection it had
export const closeArgs = () => {
    const square = get(editing)
    editing.set(null)
    if (square === null) return
    placeCursor(square)
    anchor.set(selectedFrom)
}

// Puts the cursor on one of the arguments, or closes the arguments when the
// square is one of the hidden ones. A label puts it on its argument, and the
// operation's own square leaves the cursor where it is
export const placeArgCursor = (square: number) => {
    const label = get(labelSquares).indexOf(square)
    if (label >= 0) square = get(argSquares)[label]
    if (get(argSquares).includes(square)) {
        placeCursor(square)
        fresh = true
    } else if (square !== get(editing)) {
        closeArgs()
        placeCursor(square)
    }
}

// Steps the cursor along the arguments. They all sit in one column, so only
// north and south go anywhere, and the cursor wraps around at either end
export const moveArgCursor = (direction: direction) => {
    if (get(editing) === null || (direction !== "n" && direction !== "s")) return
    const open = [...get(argSquares)].sort((a, b) => a - b)
    if (!open.length) return
    const at = open.indexOf(get(cursor)) + (direction === "s" ? 1 : -1)
    placeArgCursor(open[(at + open.length) % open.length])
}

// Index of the argument under the cursor, or -1 when it is on the operation
export const cursorArg = () => get(argSquares).indexOf(get(cursor))

// Types a key into the argument under the cursor
export const typeArg = (key: string) => {
    const square = get(editing)
    const k = cursorArg()
    if (square === null || k < 0) return
    setArg(targets, k, fresh ? key : get(args)[square][k] + key)
    fresh = false
}

// Takes the last character off the argument under the cursor, or empties it
// when nothing has been typed into it yet
export const eraseArg = () => {
    const square = get(editing)
    const k = cursorArg()
    if (square === null || k < 0) return
    setArg(targets, k, fresh ? "" : get(args)[square][k].slice(0, -1))
    fresh = false
}
