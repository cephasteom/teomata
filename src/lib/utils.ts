import type { Bang, direction } from "../stores/cells"

const offsets: Record<direction, [number, number]> = {
    n: [0, -1],
    s: [0, 1],
    e: [1, 0],
    w: [-1, 0],
}

export const opposite: Record<direction, direction> = { n: 's', s: 'n', e: 'w', w: 'e' }

export const isDirection = (letter: string): letter is direction => letter in offsets

// x and y stand for both ways along an axis, east then west or north then south
export type axis = 'x' | 'y'
export const axes: Record<axis, [direction, direction]> = { x: ['e', 'w'], y: ['n', 's'] }
export const isAxis = (letter: string): letter is axis => letter in axes

// Cells hold a number, usually whole, which can go past MIDI's 0 to 127, or below 0
// Random cells start inside that range
export const MAX_VALUE = 127

export const isValue = (text: string) => /^-?\d+$/.test(text)

export const BANG: Bang = 'b'

// A bang counts as a 1 wherever a number is needed
export const toNumber = (value: number | Bang) => value === BANG ? 1 : value

export const randomValue = () => Math.floor(Math.random() * (MAX_VALUE + 1))

export const randomDirection = (): direction => ['n', 's', 'e', 'w'][Math.floor(Math.random() * 4)] as direction

// Index of the square one step from i in the given direction
// Wraps around the edges of the grid
export const step = (i: number, direction: direction, size: number) => {
    const [dx, dy] = offsets[direction]
    const x = (i % size + dx + size) % size
    const y = (Math.floor(i / size) + dy + size) % size
    return y * size + x
}

// Copies a grid's squares onto a grid of a new size, keeping each at the same
// column and row. Squares past the old edges come in empty, and those past
// the new edges are cut off
export const resize = <T>(values: T[], from: number, to: number, empty: () => T) =>
    Array.from({ length: to * to }, (_, i) => {
        const [x, y] = [i % to, Math.floor(i / to)]
        return x < from && y < from ? values[y * from + x] : empty()
    })

export const isLetter = (key: string) => /^[a-z]$/.test(key)