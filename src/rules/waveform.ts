import { get } from "svelte/store"
import { q } from "../stores/global"
import { pickDirection, type heading } from "../lib/utils"
import type { CellRule, Operation, Param } from "./types"
import { cyclesParam, directionParam, fires, isMoving, isNumber } from "./shared"
import { about } from "./instructions"

// Each repeating waveform by name, from its phase (0 to 1 through one of its
// cycles) to a value from 0 to 1
const periodic: Record<string, (phase: number) => number> = {
    saw: phase => phase,
    sin: phase => (Math.sin(2 * Math.PI * phase) + 1) / 2,
    cos: phase => (Math.cos(2 * Math.PI * phase) + 1) / 2,
    tri: phase => phase < .5 ? phase * 2 : 2 - phase * 2,
    sqr: phase => phase < .5 ? 1 : 0,
}

// A number from 0 to 1 for each whole number, the same each time it is asked
// for, and different for each seed
const hash = (n: number, seed: number) => {
    let h = Math.imul(n ^ seed, 2654435761)
    h = Math.imul(h ^ (h >>> 16), 2246822507)
    h = Math.imul(h ^ (h >>> 13), 3266489909)
    return ((h ^ (h >>> 16)) >>> 0) / 4294967296
}

// Smoothed randomness: a random value at the start of each of its cycles,
// eased into the next. Each one is seeded afresh, so every square has its own
const createNoise = () => {
    const seed = Math.floor(Math.random() * 2 ** 32)
    return (phase: number) => {
        const n = Math.floor(phase)
        const t = phase - n
        const eased = t * t * (3 - 2 * t)
        const from = hash(n, seed)
        return from + (hash(n + 1, seed) - from) * eased
    }
}

const types = [...Object.keys(periodic), "noi"]

// The waveform of the type, from the time in cycles (bars) to its value,
// freq being its cycles per cycle
const createWave = (type: string, freq: number) => {
    const wave = type === "noi" ? createNoise() : periodic[type]
    return (tick: number) => {
        const phase = tick / get(q) * freq
        return type === "noi" ? wave(phase) : wave(phase - Math.floor(phase))
    }
}

const typeParam = (about: string): Param => ({
    name: "type",
    about,
    fallback: "sin",
    accepts: text => types.includes(text.toLowerCase()),
})

const freqParam = (about: string): Param => ({ name: "freq", about, fallback: "1", accepts: isNumber })

// Puts a new cell with the waveform's value heading in the given direction on
// the square every n cycles. Cells arriving between times pass through
const createWaveformGenerator = (type: string, freq: number, cycles: number, to: heading): CellRule => {
    const wave = createWave(type, freq)
    return (cell, tick) => fires(cycles, tick) ? { value: wave(tick), direction: pickDirection(to) } : cell
}

export const waveformGenerator: Operation = {
    name: "waveform",
    kind: "generator",
    about: about.W.about,
    params: [
        typeParam(about.W.params.type),
        freqParam(about.W.params.freq),
        cyclesParam(about.W.params.n),
        directionParam(about.W.params.direction),
    ],
    rule: (type, freq, cycles, to) =>
        createWaveformGenerator(type.toLowerCase(), Number(freq), Number(cycles), to.toLowerCase() as heading),
}

// Gives each bang or non zero value arriving the waveform's value on the tick
const createWaveform = (type: string, freq: number): CellRule => {
    const wave = createWave(type, freq)
    return (cell, tick) => isMoving(cell) && cell.value !== 0 ? { ...cell, value: wave(tick) } : cell
}

export const waveform: Operation = {
    name: "waveform",
    kind: "operator",
    about: about.w.about,
    params: [typeParam(about.w.params.type), freqParam(about.w.params.freq)],
    label: type => type.toLowerCase(),
    rule: (type, freq) => createWaveform(type.toLowerCase(), Number(freq)),
}
