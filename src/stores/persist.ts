import { get, type Writable } from "svelte/store"
import { cps, q, gridSize, showConsole, showInstructions, MIN_CPS, MAX_CPS, MIN_Q, MAX_Q, MIN_SIZE, MAX_SIZE } from "./global"
import { operations, args, muted } from "./operations"
import { resizeGrid } from "./size"

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

// Puts back what was saved last time. The size goes first, so the grid is the
// right size for the operations and arguments, which are only restored when
// they fit it
const restore = () => {
    const savedCps = load("cps")
    if (inRange(savedCps, MIN_CPS, MAX_CPS)) cps.set(savedCps)

    const savedQ = load("q")
    if (inRange(savedQ, MIN_Q, MAX_Q) && Number.isInteger(savedQ)) q.set(savedQ)

    const savedSize = load("s")
    if (inRange(savedSize, MIN_SIZE, MAX_SIZE) && Number.isInteger(savedSize)) resizeGrid(savedSize)

    const savedConsole = load("console")
    if (typeof savedConsole === "boolean") showConsole.set(savedConsole)

    const savedInstructions = load("instructions")
    if (typeof savedInstructions === "boolean") showInstructions.set(savedInstructions)

    const squares = Math.pow(get(gridSize), 2)

    const savedOperations = load("operations")
    const savedArgs = load("args")
    const fits = (value: unknown): value is unknown[] => Array.isArray(value) && value.length === squares
    if (fits(savedOperations) && savedOperations.every(o => typeof o === "string")) {
        operations.set(savedOperations as string[])
        if (fits(savedArgs) && savedArgs.every(a => Array.isArray(a) && a.every(t => typeof t === "string"))) {
            args.set(savedArgs as string[][])
        }
        const savedMuted = load("muted")
        if (fits(savedMuted) && savedMuted.every(m => typeof m === "boolean")) muted.set(savedMuted as boolean[])
    }
}

restore()
save("cps", cps)
save("q", q)
save("s", gridSize)
save("operations", operations)
save("args", args)
save("muted", muted)
save("console", showConsole)
save("instructions", showInstructions)
