import type { Cell } from "../stores/cells"

export type GridRule = (cells: Cell[], size: number, letters: string[], args: string[][], tick: number) => Cell[]

export type CellRule = (cell: Cell, tick: number, neighbours: Cell[]) => Cell

export interface Param {
    name: string
    about: string
    fallback: string
    accepts: (text: string) => boolean
}

// A letter's params, and how to build its rule from their arguments
export interface Letter {
    params: Param[]
    rule: (...args: string[]) => CellRule
}

// A letter without params
export const fixed = (rule: CellRule): Letter => ({ params: [], rule: () => rule })
