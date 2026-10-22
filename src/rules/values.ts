import { BANG } from "../lib/utils"
import type { CellRule, Operation, Param } from "./types"
import { about } from "./instructions"

// Gives a moving cell the given values, keeping its direction. A single value
// is given as it is. With more than one, a bang or an array arriving gets the
// array of them, and a number gets the value at its index, rounded and
// wrapped to the array's length. With none at all the cell is left alone
export const createValues = (values: number[]): CellRule => cell => {
    if (!cell.direction || cell.value === undefined || !values.length) return cell
    if (values.length === 1) return { ...cell, value: values[0] }
    if (cell.value === BANG || Array.isArray(cell.value)) return { ...cell, value: values }
    const index = ((Math.round(cell.value) % values.length) + values.length) % values.length
    return { ...cell, value: values[index] }
}

const isNumber = (text: string) => text !== "" && Number.isFinite(Number(text))

const value: Param = {
    name: "value",
    about: about.values.params.value,
    fallback: "",
    accepts: text => text === "" || isNumber(text),
}

export const values: Operation = {
    name: "values",
    about: about.values.about,
    params: [],
    rest: value,
    rule: (...given) => createValues(given.filter(isNumber).map(Number)),
}
