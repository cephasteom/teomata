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

// A number cut to 2 decimal places, followed by .. when it had more, so 0.123765 shows as 0.12..
const truncated = (n: number) => {
    // Written out in full, as a small number would otherwise show as an exponent (1e-7)
    const text = Math.abs(n) < 1e21 && String(n).includes("e") ? n.toFixed(20) : String(n)
    return text.replace(/^(-?\d+\.\d{2})\d+$/, "$1..")
}

// A value as the console shows it, an array as its numbers joined by commas, each number
// with more than 2 decimal places cut to 2 and followed by ..
export const formatValue = (value: Value) =>
    Array.isArray(value)
        ? value.map(truncated).join(", ")
        : typeof value === "number" ? truncated(value) : String(value)

// Empties the console
export const clearConsole = () => {
    lines.set([])
}
