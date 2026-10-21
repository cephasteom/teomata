import type { direction } from "../stores/cells"
import type { CellRule, Operation } from "./types"

// Turns a moving cell to face the given direction
const turn = (to: direction): CellRule => cell =>
    cell.direction ? { ...cell, direction: to } : cell

export const north: Operation = { name: "north", params: [], rule: () => turn("n") }
export const south: Operation = { name: "south", params: [], rule: () => turn("s") }
export const east: Operation = { name: "east", params: [], rule: () => turn("e") }
export const west: Operation = { name: "west", params: [], rule: () => turn("w") }
