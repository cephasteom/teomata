import type { CellRule, Operation, Param } from "./_types"
import { isWhole } from "./_shared"
import { SIZE } from "../stores/global"
import { about } from "./_instructions"

// A column or row of the grid, counting from 0 at the top left
const coordinateParam = (name: string, about: string): Param => ({
    name,
    about,
    fallback: "0",
    accepts: text => isWhole(text) && Number(text) < SIZE,
})

// Lets what arrives pass. The tick runs a populated entangled square as a
// clone of the square it's entangled with, and copies that square's cell onto it
const createEntangle = (): CellRule => cell => cell

export const entangle: Operation = {
    name: "entangle",
    kind: "operator",
    about: about.e.about,
    params: [coordinateParam("x", about.e.params.x), coordinateParam("y", about.e.params.y)],
    rule: createEntangle,
}
