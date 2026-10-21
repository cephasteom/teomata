import type { direction } from "../stores/cells"
import { isDirection, opposite } from "../lib/utils"
import type { CellRule, Operation, Param } from "./types"

// The axis each direction travels along
const axis: Record<direction, "x" | "y"> = { n: "y", s: "y", e: "x", w: "x" }

const flip: Record<"x" | "y", [direction, direction]> = { x: ["e", "w"], y: ["n", "s"] }

// Turns a moving cell to face the given direction. x and y reverse a cell
// travelling along that axis, and send a cell travelling across it either way
// along it at random
const createRotate = (to: string): CellRule => cell => {
    if (!cell.direction) return cell
    if (isDirection(to)) return { ...cell, direction: to }
    const along = to as "x" | "y"
    const direction = axis[cell.direction] === along
        ? opposite[cell.direction]
        : flip[along][Math.floor(Math.random() * 2)]
    return { ...cell, direction }
}

const heading: Param = {
    name: "direction",
    about: "n, s, e or w to face that way. x or y to reverse along that axis, or turn either way along it at random when crossing it.",
    fallback: "x",
    accepts: text => isDirection(text.toLowerCase()) || /^[xy]$/i.test(text),
}

export const rotate: Operation = {
    name: "rotate",
    about: "Rotate moving cell.",
    params: [heading],
    rule: to => createRotate(to.toLowerCase()),
}
