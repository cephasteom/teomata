import { aim, headingOf, type heading } from "../lib/utils"
import type { CellRule, Operation } from "./types"
import { directionParam } from "./shared"
import { about } from "./instructions"

// Turns a moving cell to face the given direction, or every one along an
// axis, splitting it on its next step, or a random one along an axis with a ?
const createRotate = (to: heading): CellRule => ({ split: _, ...cell }) =>
    cell.direction ? { ...cell, ...aim(to) } : cell

export const rotate: Operation = {
    name: "rotate",
    kind: "operator",
    about: about.r.about,
    params: [directionParam(about.r.params.direction, "n")],
    label: to => headingOf(to),
    rule: to => createRotate(headingOf(to) as heading),
}
