import { writable, derived, get } from "svelte/store"
import type { direction } from "./cells"
import { gridSize } from "./global"
import { operations, args, setArg } from "./operations"
import { cursor, anchor, placeCursor } from "./cursor"
import { argsFor, paramsFor } from "../rules"

// The square whose operation has its arguments open for editing, or null
export const editing = writable<number | null>(null)

// The squares the open operation's arguments show in, in order. They run out
// from the operation's square, rightwards, or leftwards when the row runs out of
// room, so the first argument is always next to the operation
export const argSquares = derived([editing, operations, gridSize], ([$editing, $operations, $size]) => {
    if ($editing === null) return []
    const count = paramsFor($operations[$editing]).length
    const way = $editing % $size + count < $size ? 1 : -1
    return Array.from({ length: count }, (_, k) => $editing + way * (k + 1))
})

// The open strip of squares, the operation's and its arguments', as inclusive
// columns and a row, or null when no arguments are open
export const openBounds = derived([editing, argSquares, gridSize], ([$editing, $squares, $size]) => {
    if ($editing === null) return null
    const columns = [$editing, ...$squares].map(square => square % $size)
    return { x1: Math.min(...columns), x2: Math.max(...columns), y: Math.floor($editing / $size) }
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
// them is filled in with defaults where its arguments are unset
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
    placeCursor(square)
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

// Puts the cursor on one of the open squares, or closes the arguments when the
// square is one of the hidden ones
export const placeArgCursor = (square: number) => {
    if (square === get(editing) || get(argSquares).includes(square)) {
        placeCursor(square)
        fresh = true
    } else {
        closeArgs()
        placeCursor(square)
    }
}

// Steps the cursor along the open squares. They all sit in one row, so only
// east and west go anywhere, and the cursor stops at either end
export const moveArgCursor = (direction: direction) => {
    const square = get(editing)
    if (square === null || (direction !== "e" && direction !== "w")) return
    const open = [square, ...get(argSquares)].sort((a, b) => a - b)
    const at = open.indexOf(get(cursor)) + (direction === "e" ? 1 : -1)
    if (at >= 0 && at < open.length) placeArgCursor(open[at])
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
