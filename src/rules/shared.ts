import { get } from "svelte/store"
import { q } from "../stores/global"
import { isHeading } from "../lib/utils"
import type { Param } from "./types"

export const isNumber = (text: string) => text !== "" && Number.isFinite(Number(text))

export const isWhole = (text: string) => /^\d+$/.test(text)

// The params several operations share, each with its own about text

// A direction: n, e, s or w, or x, y or xy for a random one along that axis or either
export const directionParam = (about: string, fallback = "e"): Param => ({
    name: "direction",
    about,
    fallback,
    accepts: text => isHeading(text.toLowerCase()),
})

// How many cycles between a generator's outputs, so 1 is once a cycle and .5 twice
export const cyclesParam = (about: string): Param => ({
    name: "n",
    about,
    fallback: "1",
    accepts: text => isNumber(text) && Number(text) > 0,
})

export const deviceParam = (about: string): Param => ({
    name: "device",
    about,
    fallback: "0",
    accepts: isWhole,
})

export const channelParam = (about: string): Param => ({
    name: "channel",
    about,
    fallback: "1",
    accepts: text => isWhole(text) && Number(text) >= 1 && Number(text) <= 16,
})

// Whether a generator fires on the tick, given the cycles between its outputs
// It fires on the first tick at or after each trigger, and at most once a tick
export const fires = (cycles: number, tick: number) => tick % (cycles * get(q)) < 1

// A count from one number to another, stepping by 1 towards to, or down by 1
// when to is below from. Once the count would pass to it wraps back to from
export const createCount = (from: number, to: number) => {
    const by = to < from ? -1 : 1
    let count = from
    return {
        // The count the next call to next gives
        peek: () => count,
        next: () => {
            const value = count
            const after = count + by
            count = (by > 0 ? after > to : after < to) ? from : after
            return value
        },
    }
}

// Whether a cell is moving with a value, which is what operators and outputs act on
export const isMoving = (cell: { direction?: unknown, value?: unknown }) =>
    cell.direction !== undefined && cell.value !== undefined
