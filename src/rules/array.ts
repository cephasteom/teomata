import type { CellRule, Operation, Param } from "./types"

// Gives a moving cell with any value but 0 the array of the given values,
// keeping its direction. Empty arguments are skipped, and with none at all
// the cell is left alone
const createArray = (values: number[]): CellRule => cell =>
    cell.direction && cell.value !== undefined && cell.value !== 0 && values.length
        ? { ...cell, value: values }
        : cell

const isNumber = (text: string) => text !== "" && Number.isFinite(Number(text))

const values: Param = {
    name: "values",
    about: "Any number, one per square. Empty squares are skipped.",
    fallback: "",
    accepts: text => text === "" || isNumber(text),
}

export const array: Operation = {
    name: "array",
    about: "Output an array of values when a non zero value arrives.",
    params: [],
    rest: values,
    rule: (...given) => createArray(given.filter(isNumber).map(Number)),
}
