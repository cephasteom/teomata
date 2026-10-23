import { arrows, pickDirection, type heading } from "../lib/utils"
import type { CellRule, Operation } from "./types"
import { directionParam } from "./shared"
import { about } from "./instructions"

// Turns a moving cell to face the given direction, or a random one along an axis
const createRotate = (to: heading): CellRule => cell =>
    cell.direction ? { ...cell, direction: pickDirection(to) } : cell

export const rotate: Operation = {
    name: "rotate",
    kind: "operator",
    about: about.r.about,
    params: [directionParam(about.r.params.direction, "x")],
    label: to => arrows[to.toLowerCase() as heading],
    rule: to => createRotate(to.toLowerCase() as heading),
}
