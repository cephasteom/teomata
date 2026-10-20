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
