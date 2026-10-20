import { writable } from "svelte/store"

export const isPlaying = writable<boolean>(false)
export const gridSize = writable<number>(16)