import { opposite } from "../lib/utils"
import type { CellRule } from "./types"

// Turns a moving cell around
export const reverse: CellRule = cell =>
    cell.direction ? { ...cell, direction: opposite[cell.direction] } : cell
