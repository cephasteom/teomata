import type { CellRule, Operation, Param } from "./types"

// Gives a moving cell the given value, keeping its direction
const createValue = (value = 1): CellRule => cell =>
    cell.direction ? { ...cell, value } : cell

const isNumber = (text: string) => text !== "" && Number.isFinite(Number(text))

const number: Param = {
    name: "number",
    about: "Any number.",
    fallback: "1",
    accepts: isNumber,
}

export const value: Operation = {
    name: "value",
    about: "Change a value to a fixed number.",
    params: [number],
    rule: number => createValue(Number(number)),
}
