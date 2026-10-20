import { writable, get } from "svelte/store"
import { gridSize } from "./global"
import type { direction } from "./cells"
import { step } from "../lib/utils"

// Index into the flat cells array of the square the cursor is on
export const cursor = writable<number>(0)

// Steps the cursor one square, wrapping around the edges like the move rule
export const moveCursor = (direction: direction) => {
    const size = get(gridSize)
    cursor.update(i => step(i, direction, size))
}
