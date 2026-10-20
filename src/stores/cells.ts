import { writable } from "svelte/store"

interface Cell {
    value?: number
    direction?: 'n' | 's' | 'e' | 'w'
}

const size = 16

const cells = writable<Cell[]>(Array.from(
    { length: size * size },
    () => ({})
))