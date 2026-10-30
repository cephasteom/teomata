import { get } from "svelte/store"
import { q } from "../stores/global"
import { arrows, headingOf, isHeading } from "../lib/utils"
import { formatArg } from "../lib/arithmetic"
import type { Param } from "./types"

export const isNumber = (text: string) => text !== "" && Number.isFinite(Number(text))

export const isWhole = (text: string) => /^\d+$/.test(text)

// The item of the list at the number, rounded and wrapped to the list's length
export const wrapped = <T>(list: T[], n: number) =>
    list[((Math.round(n) % list.length) + list.length) % list.length]

// For a param taking one of a list of names, ignoring case, or a whole number
// for its index in the list, which is kept as its name. A number arriving on
// its input picks by index too, rounded and wrapped to the list's length
export const named = (list: string[]) => {
    const nameOf = (text: string) => isWhole(text) ? list[Number(text)] ?? text : text.toLowerCase()
    return {
        nameOf,
        accepts: (text: string) => list.includes(nameOf(text)),
        settle: nameOf,
        fromNumber: (n: number) => wrapped(list, n),
        options: list,
    }
}

// The argument a number arriving on a param's input gives it, or undefined
// when the param doesn't take it. An array gives its first number
export const argFrom = (param: Param, value: number | number[]) => {
    const n = Array.isArray(value) ? value[0] : value
    if (n === undefined || !Number.isFinite(n)) return undefined
    if (param.fromNumber) return param.fromNumber(n)
    // Tidies away floating point noise, as arithmetic typed in does
    return [Number(n.toPrecision(12)), Math.round(n)].map(formatArg).find(param.accepts)
}

// The params several operations share, each with its own about text

// A direction: n, e, s or w, or x, y or xy for a random one along that axis or
// either, or its number from 0 to 6
export const directionParam = (about: string, fallback = "e"): Param => ({
    name: "direction",
    about,
    fallback,
    accepts: text => isHeading(headingOf(text)),
    settle: headingOf,
    fromNumber: n => wrapped(Object.keys(arrows), n),
    options: Object.keys(arrows),
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

// Whether a cell is moving with a value, which is what operators and outputs act on
export const isMoving = (cell: { direction?: unknown, value?: unknown }) =>
    cell.direction !== undefined && cell.value !== undefined
