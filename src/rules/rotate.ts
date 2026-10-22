import { axes, isAxis, isDirection, opposite, type axis } from "../lib/utils"
import type { direction } from "../stores/cells"
import type { CellRule, Operation, Param } from "./types"
import { about } from "./instructions"

// The axis each direction travels along
const axisOf: Record<direction, axis> = { n: "y", s: "y", e: "x", w: "x" }

// Turns a moving cell to face the given direction. x and y reverse a cell
// travelling along that axis, and send the cells travelling across it either
// way along it, taking turns, east then west or north then south
const createRotate = (to: string): CellRule => {
    let crossed = 0
    return cell => {
        if (!cell.direction) return cell
        if (isDirection(to)) return { ...cell, direction: to }
        const along = to as axis
        const direction = axisOf[cell.direction] === along
            ? opposite[cell.direction]
            : axes[along][crossed++ % 2]
        return { ...cell, direction }
    }
}

const heading: Param = {
    name: "direction",
    about: about.rotate.params.direction,
    fallback: "x",
    accepts: text => isDirection(text.toLowerCase()) || isAxis(text.toLowerCase()),
}

export const rotate: Operation = {
    name: "rotate",
    about: about.rotate.about,
    params: [heading],
    rule: to => createRotate(to.toLowerCase()),
}
