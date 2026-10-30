import type { Cell } from "../stores/cells"

// The operation an input square belongs to, and the index of the param it
// sets among all its params
export type Input = { owner: number, k: number }

// Muted squares keep their operations, but their rules don't run. Inputs are
// keyed by the square they sit on
export type GridRule = (
    cells: Cell[], size: number, operations: string[], args: string[][], muted: boolean[],
    inputs: Map<number, Input>, tick: number,
) => Cell[]

// A square's rule, which can say how its square shows on the grid from what
// it remembers, such as a count's next number. When its arguments change, the
// rule built in its place carries on from what the old one kept. A
// generator's rule is given an empty cell and gives the cell it puts out
export type CellRule = ((cell: Cell, tick: number) => Cell) & {
    label?: () => string
    keep?: () => unknown
    carry?: (kept: unknown) => void
}

export interface Param {
    name: string
    about: string
    fallback: string
    accepts: (text: string) => boolean
    // How an argument it takes is kept once the editor leaves it, such as a
    // direction typed as a number kept as its name. Kept as typed when it's left out
    settle?: (text: string) => string
    // The argument a number arriving on its input gives it, or undefined to
    // leave the argument as it is. A number param takes the number itself
    // when it accepts it, rounded when it only accepts whole numbers
    fromNumber?: (n: number) => string | undefined
    // The names it takes, in order, which up and down step through in the
    // argument editor
    options?: string[]
    // Set only in the argument editor, without an input square of its own,
    // such as math's operator
    editorOnly?: boolean
}

// Generators (uppercase) put out values on their own schedule, operators
// (lowercase) change the values that arrive, and outputs (lowercase) send
// them on as MIDI
export type Kind = "generator" | "operator" | "output"

// An operation's params, and how to build its rule from their arguments
export interface Operation {
    // Shown beside the operation's letter in the instructions
    name: string
    kind: Kind
    // Shown under the operation in the instructions when it is the only one shown
    about: string
    params: Param[]
    // A param that repeats after the others, filling the rest of the row
    rest?: Param
    // How many of the params show while the arguments are open, given what
    // they are now. All of them show when it's left out
    shown?: (args: string[]) => number
    // How the square shows on the grid, given its arguments, until its rule
    // gives a label of its own. The letter shows when it's left out
    label?: (...args: string[]) => string
    // How the square shows while it has inputs, which show its arguments
    // themselves. The letter shows when it's left out
    expandedLabel?: (...args: string[]) => string
    rule: (...args: string[]) => CellRule
}
