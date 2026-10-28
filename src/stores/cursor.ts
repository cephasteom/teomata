import { writable, derived, get } from "svelte/store"
import { SIZE } from "./global"
import type { direction } from "./cells"
import { step } from "../lib/utils"

// Whether the grid has focus. The cursor and selection only show while it does
export const gridFocused = writable<boolean>(false)

// Index into the flat cells array of the square the cursor is on
export const cursor = writable<number>(0)

// The corner the selection was started from. The selection is the rectangle
// between it and the cursor, so it is just the cursor's square when they match
export const anchor = writable<number>(0)

// The selected rectangle's corners, as inclusive columns and rows
export const bounds = derived([cursor, anchor], ([$cursor, $anchor]) => {
    const [x1, x2] = [$cursor % SIZE, $anchor % SIZE].sort((a, b) => a - b)
    const [y1, y2] = [Math.floor($cursor / SIZE), Math.floor($anchor / SIZE)].sort((a, b) => a - b)
    return { x1, x2, y1, y2 }
})

// Indices of every selected square
export const selection = derived(bounds, ({ x1, x2, y1, y2 }) => {
    const squares = new Set<number>()
    for (let y = y1; y <= y2; y++) {
        for (let x = x1; x <= x2; x++) squares.add(y * SIZE + x)
    }
    return squares
})

// Puts the cursor on a square. Extending keeps the anchor where it is, so the
// selection grows or shrinks to reach the new square
export const placeCursor = (i: number, extend = false) => {
    cursor.set(i)
    if (!extend) anchor.set(i)
}

// Steps the cursor one square, stopping at the edges
export const moveCursor = (direction: direction, extend = false) => {
    placeCursor(step(get(cursor), direction, SIZE) ?? get(cursor), extend)
}

// Selects every square. The selection is a rectangle between the anchor and
// the cursor, so they go in opposite corners, with the cursor bottom right
export const selectAll = () => {
    anchor.set(0)
    cursor.set(SIZE * SIZE - 1)
}

// Whether the selection has room to step one square without reaching past the edge
export const selectionCanMove = (direction: direction) => {
    const { x1, x2, y1, y2 } = get(bounds)
    const last = SIZE - 1
    return { n: y1 > 0, s: y2 < last, e: x2 < last, w: x1 > 0 }[direction]
}

// Steps the whole selection one square, keeping its shape. Check it has room
// first with selectionCanMove
export const moveSelection = (direction: direction) => {
    cursor.update(i => step(i, direction, SIZE) ?? i)
    anchor.update(i => step(i, direction, SIZE) ?? i)
}
