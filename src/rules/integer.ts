import { isValue } from "../lib/utils"
import type { CellRule, Operation, Param } from "./types"

// Gives a moving cell the given value, keeping its direction
const createInteger = (value = 1): CellRule => cell =>
    cell.direction ? { ...cell, value } : cell

const value: Param = {
    name: "value",
    label: "val",
    about: "Any whole number.",
    fallback: "1",
    accepts: isValue,
}

export const integer: Operation = {
    name: "integer",
    about: "Set the value of moving cell.",
    params: [value],
    rule: value => createInteger(Number(value)),
}
