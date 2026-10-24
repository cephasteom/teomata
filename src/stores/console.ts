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

// Prints a line of text to the console
export const printLine = (text: string) => {
    lines.update(lines => [...lines, { id: printed++, text }].slice(-MAX_LINES))
}

// A value as the console shows it, an array as its numbers joined by commas
export const formatValue = (value: Value) =>
    Array.isArray(value) ? value.join(", ") : String(value)

// Empties the console
export const clearConsole = () => {
    lines.set([])
}
