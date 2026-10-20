import { writable, get } from "svelte/store"
import { gridSize } from "./global"

// One letter per square, or "" for none. Letters belong to the square rather
// than the cell on it, so they stay put while cells move over them.
export const letters = writable<string[]>(
    Array.from({ length: Math.pow(get(gridSize), 2) }, () => "")
)

export const setLetter = (i: number, letter: string) => {
    letters.update(letters => letters.with(i, letter))
}

export const clearLetters = () => {
    letters.set(Array.from({ length: Math.pow(get(gridSize), 2) }, () => ""))
}

// What each letter's rule does. Letters missing here have no rule yet.
// Keys are lowercase because rules ignore the letter's case.
export const explanations: Record<string, string> = {
    n: "Cells passing over this square turn to face north.",
    s: "Cells passing over this square turn to face south.",
    e: "Cells passing over this square turn to face east.",
    w: "Cells passing over this square turn to face west.",
    r: "Cells passing over this square turn around and head back the way they came.",
}

// The Font Awesome icon each letter is drawn as. Letters missing here have no
// rule yet, so they fall back to Font Awesome's icon of the letter itself.
const icons: Record<string, string> = {
    n: "fa-arrow-up",
    s: "fa-arrow-down",
    e: "fa-arrow-right",
    w: "fa-arrow-left",
    r: "fa-rotate",
}

export const iconFor = (letter: string) => {
    const key = letter.toLowerCase()
    return icons[key] ?? `fa-${key}`
}
