import type { direction } from "../stores/cells"
import type { CellRule, Operation } from "./types"

// Turns a moving cell to face the given direction
const turn = (to: direction): CellRule => cell =>
    cell.direction ? { ...cell, direction: to } : cell

export const north: Operation = {
    name: "north",
    about: "Turns a moving cell to head north.",
    params: [],
    rule: () => turn("n"),
}
export const south: Operation = {
    name: "south",
    about: "Turns a moving cell to head south.",
    params: [],
    rule: () => turn("s"),
}
export const east: Operation = {
    name: "east",
    about: "Turns a moving cell to head east.",
    params: [],
    rule: () => turn("e"),
}
export const west: Operation = {
    name: "west",
    about: "Turns a moving cell to head west.",
    params: [],
    rule: () => turn("w"),
}
