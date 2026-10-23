import type { Cell } from "../stores/cells"
import { pickDirection, type heading } from "../lib/utils"
import type { CellRule, Operation, Param } from "./types"
import { createCount, cyclesParam, directionParam, fires, isMoving, isNumber } from "./shared"
import { about } from "./instructions"

const fromParam = (about: string): Param => ({ name: "from", about, fallback: "0", accepts: isNumber })
const toParam = (about: string): Param => ({ name: "to", about, fallback: "7", accepts: isNumber })

// Puts a new cell with the next count heading in the given direction on the
// square every n cycles. Cells arriving between times pass through
const createIncrementGenerator = (from: number, to: number, cycles: number, heading: heading): CellRule => {
    const count = createCount(from, to)
    return (cell, tick) => fires(cycles, tick) ? { value: count.next(), direction: pickDirection(heading) } : cell
}

export const incrementGenerator: Operation = {
    name: "increment",
    kind: "generator",
    about: about.I.about,
    params: [
        fromParam(about.I.params.from),
        toParam(about.I.params.to),
        cyclesParam(about.I.params.n),
        directionParam(about.I.params.direction),
    ],
    rule: (from, to, cycles, heading) =>
        createIncrementGenerator(Number(from), Number(to), Number(cycles), heading.toLowerCase() as heading),
}

// Gives each value arriving the next count
const createIncrement = (from: number, to: number): CellRule => {
    const count = createCount(from, to)
    return Object.assign(
        (cell: Cell) => isMoving(cell) ? { ...cell, value: count.next() } : cell,
        { label: () => `${count.peek()}` },
    )
}

export const increment: Operation = {
    name: "increment",
    kind: "operator",
    about: about.i.about,
    params: [fromParam(about.i.params.from), toParam(about.i.params.to)],
    label: from => from,
    rule: (from, to) => createIncrement(Number(from), Number(to)),
}
