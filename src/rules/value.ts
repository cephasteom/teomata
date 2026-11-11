import { BANG, headingOf, aim, type heading } from "../lib/utils"
import type { CellRule, Operation, Param } from "./_types"
import { rateParam, directionParam, fires, isMoving, isNumber } from "./_shared"
import { about } from "./_instructions"

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

// Puts out a new cell with the value heading in the given direction, rate times
// per cycle, for applyRules to put on the neighbouring square
const createValueGenerator = (value: number, rate: number, to: heading): CellRule => (_, tick) =>
    fires(rate, tick) ? { value, ...aim(to) } : {}

export const valueGenerator: Operation = {
    name: "value",
    kind: "generator",
    about: about.V.about,
    params: [valueParam(about.V.params.value), rateParam(about.V.params.rate), directionParam(about.V.params.dir)],
    label: value => value,
    rule: (value, rate, to) => createValueGenerator(Number(value), Number(rate), headingOf(to) as heading),
}

export const value: Operation = {
    name: "value",
    kind: "operator",
    about: about.v.about,
    params: [valueParam(about.v.params.value)],
    label: value => value,
    rule: value => createValues([Number(value)]),
}
