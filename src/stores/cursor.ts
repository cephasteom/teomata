import { writable, get } from "svelte/store"
import { gridSize } from "./global"
import type { direction } from "./cells"

const offsets: Record<direction, [number, number]> = {
    n: [0, -1],
    s: [0, 1],
    e: [1, 0],
    w: [-1, 0],
}

// Index into the flat cells array of the square the cursor is on
export const cursor = writable<number>(0)

// Steps the cursor one square, wrapping around the edges like the move rule
export const moveCursor = (direction: direction) => {
    const size = get(gridSize)
    const [dx, dy] = offsets[direction]
    cursor.update(i => {
        const x = (i % size + dx + size) % size
        const y = (Math.floor(i / size) + dy + size) % size
        return y * size + x
    })
}
