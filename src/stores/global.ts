import { writable } from "svelte/store"

export const isPlaying = writable<boolean>(false)
export const gridSize = writable<number>(16)

// How many times the grid ticks per bar (4/4), so 8 is a tick every eighth note
export const ticksPerBar = 8
export const showControls = writable<boolean>(true)
