import { writable, derived, get } from "svelte/store"
import { gridSize } from "./global"
import type { direction } from "./cells"
import { step } from "../lib/utils"

// Index into the flat cells array of the square the cursor is on
export const cursor = writable<number>(0)

// The corner the selection was started from. The selection is the rectangle
// between it and the cursor, so it is just the cursor's square when they match
export const anchor = writable<number>(0)

// The selected rectangle's corners, as inclusive columns and rows
export const bounds = derived([cursor, anchor, gridSize], ([$cursor, $anchor, $size]) => {
    const [x1, x2] = [$cursor % $size, $anchor % $size].sort((a, b) => a - b)
    const [y1, y2] = [Math.floor($cursor / $size), Math.floor($anchor / $size)].sort((a, b) => a - b)
    return { x1, x2, y1, y2 }
})

// Indices of every selected square
export const selection = derived([bounds, gridSize], ([{ x1, x2, y1, y2 }, $size]) => {
    const squares = new Set<number>()
    for (let y = y1; y <= y2; y++) {
        for (let x = x1; x <= x2; x++) squares.add(y * $size + x)
    }
    return squares
})

// Puts the cursor on a square. Extending keeps the anchor where it is, so the
// selection grows or shrinks to reach the new square
export const placeCursor = (i: number, extend = false) => {
    cursor.set(i)
    if (!extend) anchor.set(i)
}

// Steps the cursor one square, wrapping around the edges like the move rule
export const moveCursor = (direction: direction, extend = false) => {
    placeCursor(step(get(cursor), direction, get(gridSize)), extend)
}
