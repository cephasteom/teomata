import type { direction } from "../stores/cells"

const offsets: Record<direction, [number, number]> = {
    n: [0, -1],
    s: [0, 1],
    e: [1, 0],
    w: [-1, 0],
}

export const opposite: Record<direction, direction> = { n: 's', s: 'n', e: 'w', w: 'e' }

export const isDirection = (letter: string): letter is direction => letter in offsets

export const randomDirection = (): direction => ['n', 's', 'e', 'w'][Math.floor(Math.random() * 4)] as direction

// Index of the square one step from i in the given direction
// Wraps around the edges of the grid
export const step = (i: number, direction: direction, size: number) => {
    const [dx, dy] = offsets[direction]
    const x = (i % size + dx + size) % size
    const y = (Math.floor(i / size) + dy + size) % size
    return y * size + x
}

// Indices of the eight squares around i
// Wraps around the edges of the grid
export const neighbours = (i: number, size: number) => {
    const [n, s] = [step(i, "n", size), step(i, "s", size)]
    return [n, s, ...[n, i, s].flatMap(j => [step(j, "e", size), step(j, "w", size)])]
}
