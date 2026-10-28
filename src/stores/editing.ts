import { writable, derived, get } from "svelte/store"
import type { direction } from "./cells"
import { gridSize } from "./global"
import { operations, args, setArg, holdOperations, releaseOperations } from "./operations"
import { cursor, anchor, placeCursor } from "./cursor"
import { argsFor, paramsFor } from "../rules"
import type { Param } from "../rules/types"
import { calculate, formatArg } from "../lib/arithmetic"

// The square whose operation has its arguments open for editing, or null
export const editing = writable<number | null>(null)

// The square the open operation shows in while its arguments are open. It is
// its own square, or moved left along the row when its arguments would run
// off the end, so they always fit to its right
export const shownSquare = derived([editing, operations, args, gridSize], ([$editing, $operations, $args, $size]) => {
    if ($editing === null) return null
    const count = paramsFor($operations[$editing], $size, $args[$editing]).length
    return $editing - Math.max(0, $editing % $size + count - ($size - 1))
})

// The squares the open operation's arguments show in, in order, running left
// to right from the square after the shown operation. Some operations show
// fewer of them depending on what their arguments are
export const argSquares = derived([editing, shownSquare, operations, args, gridSize], ([$editing, $shown, $operations, $args, $size]) => {
    if ($editing === null || $shown === null) return []
    return paramsFor($operations[$editing], $size, $args[$editing]).map((_, k) => $shown + k + 1)
})

type Area = { x1: number, x2: number, y1: number, y2: number }

// The open row of squares, the operation's with its arguments', as an
// inclusive rectangle. Null when no arguments are open
export const openArea = derived([shownSquare, argSquares, gridSize], ([$shown, $squares, $size]): Area | null => {
    if ($shown === null) return null
    const columns = [$shown, ...$squares].map(square => square % $size)
    const y = Math.floor($shown / $size)
    return { x1: Math.min(...columns), x2: Math.max(...columns), y1: y, y2: y }
})

// An argument as it's kept, which is the result when it is arithmetic, such
// as 1/8 for .125, giving a number the param takes, and as typed otherwise
const settled = (param: Param, text: string) => {
    if (param.accepts(text)) return text
    const value = calculate(text)
    return value !== null && param.accepts(formatArg(value)) ? formatArg(value) : text
}

// What each argument square shows, keyed by square
export const argCells = derived([editing, argSquares, operations, args, gridSize], ([$editing, $squares, $operations, $args, $size]) => {
    const shown = new Map<number, { text: string, valid: boolean }>()
    if ($editing === null) return shown
    const params = paramsFor($operations[$editing], $size, $args[$editing])
    $squares.forEach((square, k) => {
        const text = $args[$editing][k] ?? params[k].fallback
        shown.set(square, { text, valid: params[k].accepts(settled(params[k], text)) })
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
// other selected squares with the same operation. Every one of
// them is filled in with defaults where its arguments are unset. The cursor
// goes to the first argument, or stays on the operation when it has none.
// The rules keep running on the squares as they were before, which is what
// they have now unless an operation was just typed onto them, until the
// arguments close
export const openArgs = (
    square: number,
    selected: Iterable<number> = [],
    before = { operations: get(operations), args: get(args) },
) => {
    const all = get(operations)
    const operation = all[square]
    if (!operation) return
    targets = [square, ...[...selected].filter(i =>
        i !== square && all[i] === operation
    )]
    holdOperations(targets, before)
    const size = get(gridSize)
    args.update(args => {
        const next = [...args]
        for (const i of targets) next[i] = argsFor(operation, size, args[i])
        return next
    })
    selectedFrom = get(anchor)
    editing.set(square)
    placeCursor(get(argSquares)[0] ?? square)
    fresh = true
}

// Keeps the argument under the cursor as its result when it is arithmetic,
// once the cursor leaves it
const settleArg = () => {
    const square = get(editing)
    const k = cursorArg()
    if (square === null || k < 0) return
    const param = paramsFor(get(operations)[square], get(gridSize), get(args)[square])[k]
    const text = get(args)[square][k]
    if (param && text !== undefined && settled(param, text) !== text) setArg(targets, k, settled(param, text))
}

// Puts the cursor back on the operation's square, with the selection it had,
// and lets the rules run on what was edited
export const closeArgs = () => {
    settleArg()
    const square = get(editing)
    editing.set(null)
    releaseOperations()
    if (square === null) return
    placeCursor(square)
    anchor.set(selectedFrom)
}

// Puts the cursor on one of the arguments, or closes the arguments when the
// square is one of the hidden ones. The square the operation shows in leaves
// the cursor where it is
export const placeArgCursor = (square: number) => {
    if (get(argSquares).includes(square)) {
        if (square !== get(cursor)) settleArg()
        placeCursor(square)
        fresh = true
    } else if (square !== get(shownSquare)) {
        closeArgs()
        placeCursor(square)
    }
}

// Steps the cursor along the arguments. They all sit in one row, so only
// east and west go anywhere, and the cursor wraps around at either end
export const moveArgCursor = (direction: direction) => {
    if (get(editing) === null || (direction !== "e" && direction !== "w")) return
    const open = get(argSquares)
    if (!open.length) return
    const at = open.indexOf(get(cursor)) + (direction === "e" ? 1 : -1)
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
