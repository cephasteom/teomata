import type { Cell } from "../stores/cells"

// The operation an input square belongs to, and the index of the param it
// sets among all its params
export type Input = { owner: number, k: number }

// Inputs are keyed by the square they sit on
export type GridRule = (
    cells: Cell[], operations: string[], args: string[][],
    inputs: Map<number, Input>, tick: number,
) => Cell[]

// What a square's rule is given beside its cell: the names of its params whose
// inputs took a bang on the tick, and a way to set one of its own arguments
// by its param's name, which shows on the grid and takes effect from the next tick
export interface Context {
    bangs: Set<string>
    set: (name: string, text: string) => void
}

// A square's rule, which can say how its square shows on the grid from what
// it remembers, such as a count. When its arguments change, the
// rule built in its place carries on from what the old one kept. A
// generator's rule is given an empty cell and gives the cell it puts out
export type CellRule = ((cell: Cell, tick: number, context: Context) => Cell) & {
    label?: () => string
    keep?: () => unknown
    carry?: (kept: unknown) => void
    // Called when the transport stops, to put back what the rule remembers
    stop?: () => void
    // The square whose cell is copied onto this one each tick, once every
    // other square's rule has run
    entangled?: () => number
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
    // Whether its input takes a bang, which the rule is told of on the tick
    // it arrives, rather than letting it pass over
    bang?: boolean
    // The argument a bang on its input sets, as a number would. It sets
    // nothing when it's left out
    fromBang?: string
    // Set only in the argument editor, without an input square of its own,
    // such as math's operator
    editorOnly?: boolean
}

// Generators (uppercase) put out values on their own schedule, operators
// (lowercase) change the values that arrive, and destinations (lowercase) send
// them on as MIDI
export type Kind = "generator" | "operator" | "destination"

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
    // they are now, along with the mode. All of them show when it's left out
    shown?: (args: string[]) => number
    // How the square shows on the grid, given its arguments, until its rule
    // gives a label of its own. The letter shows when it's left out
    label?: (...args: string[]) => string
    // How the square shows while it has inputs, which show its arguments
    // themselves. The letter shows when it's left out
    expandedLabel?: (...args: string[]) => string
    rule: (...args: string[]) => CellRule
}
