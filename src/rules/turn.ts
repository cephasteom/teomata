import type { direction } from "../stores/cells"
import type { CellRule } from "./types"

// Turns a moving cell to face the given direction
export const turn = (to: direction): CellRule => cell =>
    cell.direction ? { ...cell, direction: to } : cell
