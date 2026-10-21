import { writable, get } from "svelte/store"
import { gridSize } from "./global"

// One operation per square, or "" for none. Operations belong to the square rather
// than the cell on it, so they stay put while cells move over them.
export const operations = writable<string[]>(
    Array.from({ length: Math.pow(get(gridSize), 2) }, () => "")
)

// The arguments typed in for each square's operation, as text. A square's
// arguments are cleared when its operation changes
export const args = writable<string[][]>(
    Array.from({ length: Math.pow(get(gridSize), 2) }, () => [])
)

// Puts the same operation, or "" to clear them, on every one of the squares
// Typing the operation a square already has keeps its arguments
export const setOperations = (squares: Iterable<number>, operation: string) => {
    const list = [...squares]
    const current = get(operations)
    const changed = list.filter(i => current[i].toLowerCase() !== operation.toLowerCase())
    operations.update(operations => {
        const next = [...operations]
        for (const i of list) next[i] = operation
        return next
    })
    args.update(args => {
        const next = [...args]
        for (const i of changed) next[i] = []
        return next
    })
}

// Sets the same argument for the operation on every one of the squares
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

export const clearOperations = () => {
    operations.set(Array.from({ length: Math.pow(get(gridSize), 2) }, () => ""))
    args.set(Array.from({ length: Math.pow(get(gridSize), 2) }, () => []))
}

// The Font Awesome icon each operation is drawn as. Operations missing here have no
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

export const iconFor = (operation: string) => {
    const key = operation.toLowerCase()
    return icons[key] ?? `fa-${key}`
}
