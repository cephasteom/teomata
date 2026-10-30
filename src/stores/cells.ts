import { writable, get } from "svelte/store"
import { SIZE } from "./global"
import { rules } from "../rules"
import { appliedOperations, setInputArg } from "./operations"
import { randomDirection, randomValue } from "../lib/utils"
import { drain } from "../rules/events"

export type direction = 'n' | 's' | 'e' | 'w' 
// A bang, which for now counts as a 1 wherever a number is needed
export type Bang = 'b'
// A number, usually a whole MIDI value from 0 to 127, a bang, or an array of numbers
export type Value = number | Bang | number[]
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
    { length: SIZE * SIZE },
    () => (Math.random() > .95 ? randomCell() : {})
)

const emptyGrid = (): Cell[] => Array.from(
    { length: SIZE * SIZE },
    () => ({})
)

// The cells on screen, which lag the grid the rules work on by up to the
// scheduler's lookahead
export const cells = writable<Cell[]>(emptyGrid())

// The grid the rules step from, worked out ahead of the tick being heard
let grid: Cell[] = get(cells)
// Counts up with every change made outside the rules, so a grid stepped
// before it is never shown over it
let version = 0

// Replaces the grid, showing it at once
export const setCells = (next: Cell[]) => {
    grid = next
    version++
    cells.set(next)
}

// Runs the grid through each rule in order, giving the new grid and the
// events the rules queued, for the scheduler to send and show in time, and
// the grid to show, which also has the cells absorbed by inputs and outputs
// on the tick, so they flash there before they go
// Tick is the number of ticks since the transport started. Arguments set by
// values arriving on inputs are kept at once, so the next tick runs on them
export const stepCells = (tick: number) => {
    // The operations being edited run as they were until their arguments close
    const { operations: letters, args: given, muted, inputs } = appliedOperations()
    grid = rules.reduce((cells, rule) => rule(cells, SIZE, letters, given, muted, inputs, tick), grid)
    const events = drain()
    const shown = [...grid]
    for (const event of events) {
        if (event.type === "arg") setInputArg(event.square, event.k, event.text)
        if (event.type === "absorb") shown[event.square] = event.cell
    }
    return { shown, events, version }
}

// Shows a stepped grid, unless the grid was changed since it was stepped
export const showCells = (next: Cell[], from: number) => {
    if (from === version) cells.set(next)
}

// Empties every cell on the grid
export const clearCells = () => {
    setCells(emptyGrid())
}

// Reseeds the grid with a fresh random state
export const randomizeCells = () => {
    setCells(randomGrid())
}
