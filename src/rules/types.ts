import type { Cell } from "../stores/cells"

// Muted squares keep their operations, but their rules don't run
export type GridRule = (cells: Cell[], size: number, operations: string[], args: string[][], muted: boolean[], tick: number) => Cell[]

// A square's rule, which can say how its square shows on the grid from what
// it remembers, such as a count's next number
export type CellRule = ((cell: Cell, tick: number) => Cell) & { label?: () => string }

export interface Param {
    name: string
    about: string
    fallback: string
    accepts: (text: string) => boolean
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
    rule: (...args: string[]) => CellRule
}
