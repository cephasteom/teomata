import { writable } from "svelte/store"

export const isPlaying = writable<boolean>(false)

// Squares per side of the grid
export const SIZE = 64

// Squares per side the grid's window shows, zoomed in and out on the grid
export const MIN_ZOOM = 4
export const MAX_ZOOM = SIZE
export const DEFAULT_ZOOM = 16
export const zoom = writable<number>(DEFAULT_ZOOM)

// The tempo in cycles (bars) per second, which the scheduler keeps Tone in step with
export const MIN_CPS = 0.05
export const MAX_CPS = 2
export const cps = writable<number>(0.5)

// How many times the grid ticks a cycle, so 8 is a tick every eighth note
export const MIN_Q = 1
export const MAX_Q = 64
export const q = writable<number>(8)

// Whether the console and the instructions show beside the grid
export const showConsole = writable<boolean>(true)
export const showInstructions = writable<boolean>(true)
