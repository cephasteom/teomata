import { BANG, headingOf, pickDirection, type heading } from "../lib/utils"
import type { Operation, CellRule } from "./types"
import { cyclesParam, directionParam, fires, isMoving } from "./shared"
import { about } from "./instructions"

// Puts out a new cell with a bang heading in the given direction every n
// cycles, for applyRules to put on the neighbouring square
const createBangGenerator = (cycles: number, to: heading): CellRule => (_, tick) =>
    fires(cycles, tick) ? { value: BANG, direction: pickDirection(to) } : {}

export const bangGenerator: Operation = {
    name: "bang",
    kind: "generator",
    about: about.B.about,
    params: [cyclesParam(about.B.params.n), directionParam(about.B.params.direction)],
    rule: (cycles, to) => createBangGenerator(Number(cycles), headingOf(to) as heading),
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
