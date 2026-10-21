import type { Cell } from "../stores/cells"

export type GridRule = (cells: Cell[], size: number, operations: string[], args: string[][], tick: number) => Cell[]

export type CellRule = (cell: Cell, tick: number, neighbours: Cell[]) => Cell

export interface Param {
    name: string
    // Short enough to fit in the square beside the argument
    label: string
    about: string
    fallback: string
    accepts: (text: string) => boolean
}

// An operation's params, and how to build its rule from their arguments
export interface Operation {
    params: Param[]
    rule: (...args: string[]) => CellRule
}
