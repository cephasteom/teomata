import { get, type Writable } from "svelte/store"
import { gridSize } from "./global"
import { cells } from "./cells"
import { operations, args } from "./operations"
import { cursor, anchor } from "./cursor"
import { closeArgs } from "./editing"
import { resize } from "../lib/utils"

// Changes the squares per side. Growing adds squares to the right and bottom,
// and shrinking cuts them off, so every square that stays keeps its cell,
// operation and arguments. The cursor and the selection's anchor stay on
// their square, or move in to the nearest edge
export const resizeGrid = (size: number) => {
    const from = get(gridSize)
    if (size === from) return
    // The open arguments' squares could fall off the grid
    closeArgs()
    cells.update(cells => resize(cells, from, size, () => ({})))
    operations.update(operations => resize(operations, from, size, () => ""))
    args.update(args => resize(args, from, size, () => []))
    const clamp = (i: number) => {
        const [x, y] = [i % from, Math.floor(i / from)].map(n => Math.min(n, size - 1))
        return y * size + x
    }
    cursor.update(clamp)
    anchor.update(clamp)
    gridSize.set(size)
}

// The grid size as a store whose set resizes the grid, for the controls
export const size: Writable<number> = {
    subscribe: gridSize.subscribe,
    set: resizeGrid,
    update: fn => resizeGrid(fn(get(gridSize))),
}
