import { writable, get } from "svelte/store"
import { gridSize } from "./global"

// One letter per square, or "" for none. Letters belong to the square rather
// than the cell on it, so they stay put while cells move over them.
export const letters = writable<string[]>(
    Array.from({ length: Math.pow(get(gridSize), 2) }, () => "")
)

// The arguments typed in for each square's letter, as text. A square's
// arguments are cleared when its letter changes
export const args = writable<string[][]>(
    Array.from({ length: Math.pow(get(gridSize), 2) }, () => [])
)

// Puts the same letter, or "" to clear them, on every one of the squares
// Typing the letter a square already has keeps its arguments
export const setLetters = (squares: Iterable<number>, letter: string) => {
    const list = [...squares]
    const current = get(letters)
    const changed = list.filter(i => current[i].toLowerCase() !== letter.toLowerCase())
    letters.update(letters => {
        const next = [...letters]
        for (const i of list) next[i] = letter
        return next
    })
    args.update(args => {
        const next = [...args]
        for (const i of changed) next[i] = []
        return next
    })
}

// Sets the same argument for the letter on every one of the squares
export const setArg = (squares: Iterable<number>, k: number, text: string) => {
    args.update(args => {
        const next = [...args]
        for (const square of squares) {
            next[square] = [...next[square]]
            next[square][k] = text
        }
        return next
    })
}

export const clearLetters = () => {
    letters.set(Array.from({ length: Math.pow(get(gridSize), 2) }, () => ""))
    args.set(Array.from({ length: Math.pow(get(gridSize), 2) }, () => []))
}

// The Font Awesome icon each letter is drawn as. Letters missing here have no
// rule yet, so they fall back to Font Awesome's icon of the letter itself.
const icons: Record<string, string> = {
    n: "fa-arrow-up",
    s: "fa-arrow-down",
    e: "fa-arrow-right",
    w: "fa-arrow-left",
    r: "fa-rotate",
    b: "fa-burst",
    d: "fa-skull",
    g: "fa-seedling",
}

export const iconFor = (letter: string) => {
    const key = letter.toLowerCase()
    return icons[key] ?? `fa-${key}`
}
