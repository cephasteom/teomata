import { writable } from "svelte/store"
import type { Value } from "./cells"

// The most lines the console keeps, dropping the oldest past it
const MAX_LINES = 500

export interface Line {
    // Counts up with every line printed, so each line keeps its key as old ones drop off
    id: number
    text: string
    // A CSS colour for the line, or the console's own when it's left out
    color?: string
}

export const lines = writable<Line[]>([])

let printed = 0

// Prints a line of text to the console, in the given colour
export const printLine = (text: string, color?: string) => {
    lines.update(lines => [...lines, { id: printed++, text, color }].slice(-MAX_LINES))
}

// Prints a value to the console, an array as its numbers joined by commas
export const printValue = (value: Value) => {
    printLine(Array.isArray(value) ? value.join(", ") : String(value))
}

// Empties the console
export const clearConsole = () => {
    lines.set([])
}
