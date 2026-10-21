import { writable } from "svelte/store"

export const isPlaying = writable<boolean>(false)
export const gridSize = writable<number>(16)

export const showControls = writable<boolean>(true)

// The tempo in cycles (bars) per second, which the scheduler keeps Tone in step with
export const MIN_CPS = 0.05
export const MAX_CPS = 2
export const cps = writable<number>(0.5)

// How many times the grid ticks a cycle, so 8 is a tick every eighth note
export const MIN_Q = 1
export const MAX_Q = 64
export const q = writable<number>(8)
