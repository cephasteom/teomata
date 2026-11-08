import type { CellRule, Operation, Param } from "./types"
import { isWhole } from "./shared"
import { SIZE } from "../stores/global"
import { about } from "./instructions"

// A column or row of the grid, counting from 0 at the top left
const coordinateParam = (name: string, about: string): Param => ({
    name,
    about,
    fallback: "0",
    accepts: text => isWhole(text) && Number(text) < SIZE,
})

// Lets what arrives pass, and names the square it's entangled with, whose
// cell applyRules copies onto it once every other square's rule has run
const createEntangle = (x: number, y: number): CellRule =>
    Object.assign((cell: Parameters<CellRule>[0]) => cell, { entangled: (size: number) => y * size + x })

export const entangle: Operation = {
    name: "entangle",
    kind: "operator",
    about: about.e.about,
    params: [coordinateParam("x", about.e.params.x), coordinateParam("y", about.e.params.y)],
    rule: (x, y) => createEntangle(Number(x), Number(y)),
}
