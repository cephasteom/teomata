import { writable } from "svelte/store"
import type { Value } from "./cells"

// The most lines the console keeps, dropping the oldest past it
const MAX_LINES = 500

export interface Line {
    // Counts up with every line printed, so each line keeps its key as old ones drop off
    id: number
    text: string
}

export const lines = writable<Line[]>([])

let printed = 0

// Prints a value to the console, an array as its numbers joined by commas
export const printValue = (value: Value) => {
    const text = Array.isArray(value) ? value.join(", ") : String(value)
    lines.update(lines => [...lines, { id: printed++, text }].slice(-MAX_LINES))
}

// Empties the console
export const clearConsole = () => {
    lines.set([])
}
