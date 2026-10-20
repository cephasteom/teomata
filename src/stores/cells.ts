import { writable, get } from "svelte/store"
import { gridSize } from "./global"
import { rules } from "./rules"
import { letters } from "./letters"
import { randomDirection } from "../lib/utils"

export type direction = 'n' | 's' | 'e' | 'w' 
export interface Cell {
    value?: number
    direction?: direction
}

const randomCell = (): Cell => ({
    value: 1, 
    direction: randomDirection()
})

const randomGrid = (): Cell[] => Array.from(
    { length: Math.pow(get(gridSize), 2) },
    () => (Math.random() > .95 ? randomCell() : {})
)

export const cells = writable<Cell[]>(randomGrid())

// Runs the cells through each rule in order
// Tick is the number of ticks since the transport started
export const updateCells = (tick: number) => {
    const size = get(gridSize)
    const squares = get(letters)
    cells.update(cells => get(rules).reduce((cells, rule) => rule(cells, size, squares, tick), cells))
}

// Empties every cell on the grid
export const clearCells = () => {
    cells.set(Array.from({ length: Math.pow(get(gridSize), 2) }, () => ({})))
}

// Reseeds the grid with a fresh random state
export const randomizeCells = () => {
    cells.set(randomGrid())
}
