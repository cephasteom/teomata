import { opposite } from "../lib/utils"
import type { CellRule, Operation } from "./types"

// Turns a moving cell around
const createReverse = (): CellRule => cell =>
    cell.direction ? { ...cell, direction: opposite[cell.direction] } : cell

export const reverse: Operation = { name: "reverse", params: [], rule: createReverse }
