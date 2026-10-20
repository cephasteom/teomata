import { writable, get } from "svelte/store"
import { gridSize } from "./global"
import { rules } from "./rules"

export type direction = 'n' | 's' | 'e' | 'w' 
export interface Cell {
    value?: number
    direction?: direction
}

const randomDirection = () : direction => ['n', 's', 'e', 'w'][Math.floor(Math.random() * 4)] as direction

const randomCell = (): Cell => ({
    value: 1, 
    direction: randomDirection()
})

export const cells = writable<Cell[]>(Array.from(
    { length: Math.pow(get(gridSize), 2) },
    () => (Math.random() > .95 ? randomCell() : {})
))

// Runs the cells through each rule in order
export const updateCells = () => {
    const size = get(gridSize)
    cells.update(cells => get(rules).reduce((cells, rule) => rule(cells, size), cells))
}
