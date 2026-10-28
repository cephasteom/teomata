import type { Bang, direction } from "../stores/cells"

const offsets: Record<direction, [number, number]> = {
    n: [0, -1],
    s: [0, 1],
    e: [1, 0],
    w: [-1, 0],
}

export const opposite: Record<direction, direction> = { n: 's', s: 'n', e: 'w', w: 'e' }

export const isDirection = (letter: string): letter is direction => Object.hasOwn(offsets, letter)

// A direction as given to an operation: a compass point, or x, y or xy for a
// random direction along that axis, or along either
export type heading = direction | 'x' | 'y' | 'xy'
const headings: Record<heading, direction[]> = {
    n: ['n'], e: ['e'], s: ['s'], w: ['w'],
    x: ['e', 'w'], y: ['n', 's'], xy: ['n', 'e', 's', 'w'],
}
export const isHeading = (text: string): text is heading => Object.hasOwn(headings, text)

// A direction from the heading, picked at random for an axis
export const pickDirection = (to: heading): direction => {
    const ways = headings[to]
    return ways[Math.floor(Math.random() * ways.length)]
}

// How each heading is shown on the grid
export const arrows: Record<heading, string> = { n: '↑', e: '→', s: '↓', w: '←', x: '↔', y: '↕', xy: '⤡' }

// Cells hold a number, usually whole, which can go past MIDI's 0 to 127, or below 0
// Random cells start inside that range
export const MAX_VALUE = 127

export const isValue = (text: string) => /^-?\d+$/.test(text)

export const BANG: Bang = 'b'

// A bang counts as a 1 wherever a number is needed
export const toNumber = (value: number | Bang) => value === BANG ? 1 : value

export const randomValue = () => Math.floor(Math.random() * (MAX_VALUE + 1))

export const randomDirection = () => pickDirection('xy')

// Index of the square one step from i in the given direction, or undefined
// when that would go past the edge of the grid
export const step = (i: number, direction: direction, size: number) => {
    const [dx, dy] = offsets[direction]
    const x = i % size + dx
    const y = Math.floor(i / size) + dy
    return x < 0 || x >= size || y < 0 || y >= size ? undefined : y * size + x
}

// Copies a grid's squares onto a grid of a new size, for operations saved
// when the grid's size could change, keeping each at the same
// column and row. Squares past the old edges come in empty, and those past
// the new edges are cut off
export const resize = <T>(values: T[], from: number, to: number, empty: () => T) =>
    Array.from({ length: to * to }, (_, i) => {
        const [x, y] = [i % to, Math.floor(i / to)]
        return x < from && y < from ? values[y * from + x] : empty()
    })