import { BANG } from "../lib/utils"
import type { CellRule, Operation, Param } from "./types"

// Gives a moving cell the array of the given values when a bang or an array
// arrives, or the value at the index of a number, rounded and wrapped to the
// array's length, keeping its direction. Empty arguments are skipped, and
// with none at all the cell is left alone
export const createArray = (values: number[]): CellRule => cell => {
    if (!cell.direction || cell.value === undefined || !values.length) return cell
    if (cell.value === BANG || Array.isArray(cell.value)) return { ...cell, value: values }
    const index = ((Math.round(cell.value) % values.length) + values.length) % values.length
    return { ...cell, value: values[index] }
}

const isNumber = (text: string) => text !== "" && Number.isFinite(Number(text))

const values: Param = {
    name: "values",
    about: "Any number, one per square. Empty squares are skipped.",
    fallback: "",
    accepts: text => text === "" || isNumber(text),
}

export const array: Operation = {
    name: "array",
    about: "Output a single value on receiving an integer index, output the whole array on receiving a bang or non-integer.",
    params: [],
    rest: values,
    rule: (...given) => createArray(given.filter(isNumber).map(Number)),
}
