import { get, type Writable } from "svelte/store"
import { cps, q, zoom, isPlaying, showConsole, showInstructions, SIZE, MIN_CPS, MAX_CPS, MIN_Q, MAX_Q, MIN_ZOOM, MAX_ZOOM } from "./global"
import { operations, args, expansions, fitExpansions, type Expansion } from "./operations"
import { isDirection } from "../lib/utils"
import { savedRules, loadRules, type Saved } from "../rules"

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

export const inRange = (value: unknown, min: number, max: number): value is number =>
    typeof value === "number" && Number.isFinite(value) && value >= min && value <= max

// Whether a saved value is an operation's inputs, or null for none
export const isExpansion = (e: unknown): e is Expansion | null => e === null || (
    typeof e === "object" && "direction" in e && "length" in e &&
    typeof e.direction === "string" && isDirection(e.direction) &&
    typeof e.length === "number" && Number.isInteger(e.length) && e.length > 0
)

// What the rules on squares saved, such as a loop's recording, by square, for
// squares still holding the operation that saved it
export const rulesToSave = () => {
    const $operations = get(operations)
    return [...savedRules()].filter(([square, { letter }]) => $operations[square] === letter)
}

const isSaved = (entry: unknown): entry is [number, Saved] => {
    if (!Array.isArray(entry) || entry.length !== 2) return false
    const [square, saved] = entry
    return Number.isInteger(square) && square >= 0 && square < SIZE * SIZE &&
        typeof saved === "object" && saved !== null && typeof (saved as Saved).letter === "string"
}

// Puts back what was saved last time. Operations and arguments are only
// restored when they fit the grid
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

    const fits = (value: unknown): value is unknown[] => Array.isArray(value) && value.length === SIZE * SIZE

    const savedOperations = load("operations")
    const savedArgs = load("args")
    if (fits(savedOperations) && savedOperations.every(o => typeof o === "string")) {
        operations.set(savedOperations as string[])
        if (fits(savedArgs) && savedArgs.every(a => Array.isArray(a) && a.every(t => typeof t === "string"))) {
            args.set(savedArgs as string[][])
        }
        const savedExpansions = load("expansions")
        if (fits(savedExpansions) && savedExpansions.every(isExpansion)) {
            expansions.set(savedExpansions as (Expansion | null)[])
            fitExpansions()
        }
        const savedRules = load("rules")
        if (Array.isArray(savedRules)) loadRules(new Map(savedRules.filter(isSaved)))
    }
}

// What the rules saved changes as they run, so it's kept when the transport
// stops and when the page is hidden or closed, rather than on every tick
const saveRules = () => {
    try {
        localStorage.setItem(PREFIX + "rules", JSON.stringify(rulesToSave()))
    } catch {
        // Storage is full or blocked, so it just isn't kept
    }
}

restore()
save("cps", cps)
save("q", q)
save("zoom", zoom)
save("operations", operations)
save("args", args)
save("expansions", expansions)
save("console", showConsole)
save("instructions", showInstructions)
isPlaying.subscribe(playing => { if (!playing) saveRules() })
addEventListener("pagehide", saveRules)
document.addEventListener("visibilitychange", () => { if (document.hidden) saveRules() })
