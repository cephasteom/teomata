import { get } from "svelte/store"
import { q } from "../stores/global"
import { headings, headingOf, isHeading } from "../lib/utils"
import { formatArg } from "../lib/arithmetic"
import { mode, destinationMode } from "./instructions"
import type { Context, Param } from "./types"

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

// A direction: n, e, s or w, or x, y or xy for every one along that axis or
// both, or with a ? for a random one of them, or its number from 0 to 9
export const directionParam = (about: string, fallback = "e"): Param => ({
    name: "direction",
    about,
    fallback,
    accepts: text => isHeading(headingOf(text)),
    settle: headingOf,
    fromNumber: n => wrapped(headings, n),
    options: headings,
})

// How many times a generator outputs per cycle, so 1 is once a cycle and 2 twice
export const rateParam = (about: string): Param => ({
    name: "rate",
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

// How many cycles between resets, from the first division of the cycle, or 0
// for none. A bang on its input resets on the tick it arrives
export const resetParam = (about: string): Param => ({
    name: "reset",
    about,
    fallback: "0",
    accepts: text => isNumber(text) && Number(text) >= 0,
    bang: true,
})

// Whether a rule resets on the tick, every so many cycles from the first
// division of the cycle, or when a bang arrives on its reset input
export const resets = (every: number, tick: number, { bangs }: Context) =>
    bangs.has("reset") || (every > 0 && tick % Math.max(1, Math.round(every * get(q))) === 0)

// The final param of every operation, for how it treats the values that
// arrive. A number on its input picks by index, so one operation can turn
// another on and off
const createModeParam = (modes: string[], about: string): Param => {
    const { accepts, settle, fromNumber, options } = named(modes)
    return { name: "mode", about, fallback: "on", accepts, settle, fromNumber, options }
}

// On does what it does, and off lets values pass without running
export const modeParam = createModeParam(["on", "off"], mode)

// Only a destination absorbs what arrives, so only it has thru, which does what it
// does but lets the values carry on
export const destinationModeParam = createModeParam(["on", "off", "thru"], destinationMode)

export const isModeParam = (param: Param) => param === modeParam || param === destinationModeParam

// Whether a generator fires on the tick, given its outputs per cycle
// It fires on the first tick at or after each trigger, and at most once a tick
// It counts the triggers up to a tick, tidied of floating point noise so one
// landing exactly on a tick is neither missed nor counted twice
export const fires = (rate: number, tick: number) => {
    const triggers = (t: number) => Math.floor(Number((t * rate / get(q)).toPrecision(12)))
    return triggers(tick) > triggers(tick - 1)
}

// Whether a cell is moving with a value, which is what operators and destinations act on
export const isMoving = (cell: { direction?: unknown, value?: unknown }) =>
    cell.direction !== undefined && cell.value !== undefined
