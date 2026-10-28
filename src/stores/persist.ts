import type { Writable } from "svelte/store"
import { cps, q, zoom, showConsole, showInstructions, SIZE, MIN_CPS, MAX_CPS, MIN_Q, MAX_Q, MIN_ZOOM, MAX_ZOOM } from "./global"
import { operations, args, muted } from "./operations"
import { resize } from "../lib/utils"

const PREFIX = "teomata:"

// Reads a saved value, or undefined when there is none, it can't be parsed, or
// storage is unavailable
const load = (key: string): unknown => {
    try {
        const text = localStorage.getItem(PREFIX + key)
        return text === null ? undefined : JSON.parse(text)
    } catch {
        return undefined
    }
}

// Saves the store's value every time it changes
const save = <T>(key: string, store: Writable<T>) => {
    store.subscribe(value => {
        try {
            localStorage.setItem(PREFIX + key, JSON.stringify(value))
        } catch {
            // Storage is full or blocked, so the value just isn't kept
        }
    })
}

const inRange = (value: unknown, min: number, max: number): value is number =>
    typeof value === "number" && Number.isFinite(value) && value >= min && value <= max

// Puts back what was saved last time. Operations saved when the grid could
// be resized, with its size saved as s, are copied onto the top left of the
// grid. Operations and arguments are only restored when they fit it
const restore = () => {
    const savedCps = load("cps")
    if (inRange(savedCps, MIN_CPS, MAX_CPS)) cps.set(savedCps)

    const savedQ = load("q")
    if (inRange(savedQ, MIN_Q, MAX_Q) && Number.isInteger(savedQ)) q.set(savedQ)

    const savedZoom = load("zoom")
    if (inRange(savedZoom, MIN_ZOOM, MAX_ZOOM)) zoom.set(Math.round(savedZoom))

    const savedConsole = load("console")
    if (typeof savedConsole === "boolean") showConsole.set(savedConsole)

    const savedInstructions = load("instructions")
    if (typeof savedInstructions === "boolean") showInstructions.set(savedInstructions)

    const savedSize = load("s")
    const from = inRange(savedSize, 1, SIZE) && Number.isInteger(savedSize) ? savedSize : SIZE
    const fits = (value: unknown): value is unknown[] =>
        Array.isArray(value) && (value.length === SIZE * SIZE || value.length === from * from)
    const fitted = <T>(values: T[], empty: () => T) =>
        values.length === SIZE * SIZE ? values : resize(values, from, SIZE, empty)

    const savedOperations = load("operations")
    const savedArgs = load("args")
    if (fits(savedOperations) && savedOperations.every(o => typeof o === "string")) {
        operations.set(fitted(savedOperations as string[], () => ""))
        if (fits(savedArgs) && savedArgs.every(a => Array.isArray(a) && a.every(t => typeof t === "string"))) {
            args.set(fitted(savedArgs as string[][], () => []))
        }
        const savedMuted = load("muted")
        if (fits(savedMuted) && savedMuted.every(m => typeof m === "boolean")) {
            muted.set(fitted(savedMuted as boolean[], () => false))
        }
    }
    // The size is no longer saved, as the grid's is fixed
    try {
        localStorage.removeItem(PREFIX + "s")
    } catch {
        // Storage is blocked, so there's nothing to remove
    }
}

restore()
save("cps", cps)
save("q", q)
save("zoom", zoom)
save("operations", operations)
save("args", args)
save("muted", muted)
save("console", showConsole)
save("instructions", showInstructions)
