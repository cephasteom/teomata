import { BANG, headingOf, aim, type heading } from "../lib/utils"
import type { Operation, CellRule } from "./types"
import { rateParam, directionParam, fires, isMoving } from "./shared"
import { about } from "./instructions"

// Puts out a new cell with a bang heading in the given direction, rate times
// per cycle, for applyRules to put on the neighbouring square
const createBangGenerator = (rate: number, to: heading): CellRule => (_, tick) =>
    fires(rate, tick) ? { value: BANG, ...aim(to) } : {}

export const bangGenerator: Operation = {
    name: "bang",
    kind: "generator",
    about: about.B.about,
    params: [rateParam(about.B.params.rate), directionParam(about.B.params.direction)],
    rule: (rate, to) => createBangGenerator(Number(rate), headingOf(to) as heading),
}

// Turns any value arriving into a bang
const createBang = (): CellRule => cell => isMoving(cell) ? { ...cell, value: BANG } : cell

export const bang: Operation = {
    name: "bang",
    kind: "operator",
    about: about.b.about,
    params: [],
    rule: createBang,
}
