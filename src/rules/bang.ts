import { BANG, headingOf, pickDirection, type heading } from "../lib/utils"
import type { Operation, CellRule } from "./types"
import { cyclesParam, directionParam, fires, isMoving } from "./shared"
import { about } from "./instructions"

// Puts a new cell with a bang heading in the given direction on the square
// every n cycles, for the next move to carry onto the neighbouring square.
// Cells arriving between times pass through
const createBangGenerator = (cycles: number, to: heading): CellRule => (cell, tick) =>
    fires(cycles, tick) ? { value: BANG, direction: pickDirection(to) } : cell

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
