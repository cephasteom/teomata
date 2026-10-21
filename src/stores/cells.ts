import { writable, get } from "svelte/store"
import { gridSize } from "./global"
import { rules } from "../rules"
import { appliedOperations } from "./operations"
import { randomDirection, randomValue } from "../lib/utils"

export type direction = 'n' | 's' | 'e' | 'w' 
// A number, usually a whole MIDI value from 0 to 127, or an array of them
export type Value = number | number[]
export interface Cell {
    // A cell without a value is empty
    value?: Value
    direction?: direction
}

const randomCell = (): Cell => ({
    value: randomValue(),
    direction: randomDirection()
})

const randomGrid = (): Cell[] => Array.from(
    { length: Math.pow(get(gridSize), 2) },
    () => (Math.random() > .95 ? randomCell() : {})
)

const emptyGrid = (): Cell[] => Array.from(
    { length: Math.pow(get(gridSize), 2) },
    () => ({})
)

export const cells = writable<Cell[]>(emptyGrid())

// Runs the cells through each rule in order
// Tick is the number of ticks since the transport started
export const updateCells = (tick: number) => {
    const size = get(gridSize)
    // The operations being edited run as they were until their arguments close
    const { operations: letters, args: given } = appliedOperations()
    cells.update(cells => rules.reduce((cells, rule) => rule(cells, size, letters, given, tick), cells))
}

// Empties every cell on the grid
export const clearCells = () => {
    cells.set(Array.from({ length: Math.pow(get(gridSize), 2) }, () => ({})))
}

// Reseeds the grid with a fresh random state
export const randomizeCells = () => {
    cells.set(randomGrid())
}
