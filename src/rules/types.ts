import type { Cell } from "../stores/cells"

export type GridRule = (cells: Cell[], size: number, operations: string[], args: string[][], tick: number) => Cell[]

export type CellRule = (cell: Cell, tick: number) => Cell

export interface Param {
    name: string
    about: string
    fallback: string
    accepts: (text: string) => boolean
}

// An operation's params, and how to build its rule from their arguments
export interface Operation {
    // Shown beside the operation's letter in the instructions
    name: string
    // Shown under the operation in the instructions when it is the only one shown
    about: string
    params: Param[]
    // A param that repeats after the others, filling the rest of the row
    rest?: Param
    rule: (...args: string[]) => CellRule
}
