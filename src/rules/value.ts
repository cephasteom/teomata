import { BANG, pickDirection, type heading } from "../lib/utils"
import type { CellRule, Operation, Param } from "./types"
import { cyclesParam, directionParam, fires, isMoving, isNumber } from "./shared"
import { about } from "./instructions"

// values(): gives each value arriving one of the given values, keeping its
// direction. A single value is given as it is. With more than one, a bang or
// an array arriving gets the array of them, and a number gets the value at
// its index, rounded and wrapped to the array's length
export const createValues = (values: number[]): CellRule => cell => {
    if (!isMoving(cell) || !values.length) return cell
    if (values.length === 1) return { ...cell, value: values[0] }
    if (cell.value === BANG || Array.isArray(cell.value)) return { ...cell, value: values }
    const index = ((Math.round(cell.value!) % values.length) + values.length) % values.length
    return { ...cell, value: values[index] }
}

const valueParam = (about: string): Param => ({ name: "value", about, fallback: "0", accepts: isNumber })

// Puts a new cell with the value heading in the given direction on the
// square every n cycles. Cells arriving between times pass through
const createValueGenerator = (value: number, cycles: number, to: heading): CellRule => (cell, tick) =>
    fires(cycles, tick) ? { value, direction: pickDirection(to) } : cell

export const valueGenerator: Operation = {
    name: "value",
    kind: "generator",
    about: about.V.about,
    params: [valueParam(about.V.params.value), cyclesParam(about.V.params.n), directionParam(about.V.params.direction)],
    rule: (value, cycles, to) => createValueGenerator(Number(value), Number(cycles), to.toLowerCase() as heading),
}

export const value: Operation = {
    name: "value",
    kind: "operator",
    about: about.v.about,
    params: [valueParam(about.v.params.value)],
    label: value => value,
    rule: value => createValues([Number(value)]),
}
