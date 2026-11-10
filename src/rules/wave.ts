import { get } from "svelte/store"
import { q } from "../stores/global"
import { headingOf, aim, type heading } from "../lib/utils"
import type { CellRule, Operation, Param } from "./_types"
import { rateParam, directionParam, fires, isMoving, isNumber, named } from "./_shared"
import { about } from "./_instructions"

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
// eased into the next, from its seed. Each one is seeded afresh, so every
// square has its own
const createNoise = () => {
    const noise = {
        seed: Math.floor(Math.random() * 2 ** 32),
        at: (phase: number) => {
            const n = Math.floor(phase)
            const t = phase - n
            const eased = t * t * (3 - 2 * t)
            const from = hash(n, noise.seed)
            return from + (hash(n + 1, noise.seed) - from) * eased
        },
    }
    return noise
}

// A type by name, ignoring case, or by its index, so 0 is saw and 1 sin
const types = named([...Object.keys(periodic), "noi"])
const typeOf = types.nameOf

// The waveform of the type, from the time in cycles (bars) to its value,
// freq being its cycles per cycle. Noise has its seed, which a rule built
// in the wave's place carries on with, so it keeps the same shape
const createWave = (type: string, freq: number) => {
    const noise = type === "noi" ? createNoise() : undefined
    const value = (tick: number) => {
        const phase = tick / get(q) * freq
        return noise ? noise.at(phase) : periodic[type](phase - Math.floor(phase))
    }
    const remembered = {
        keep: () => noise?.seed,
        carry: (seed: unknown) => {
            if (noise && typeof seed === "number") noise.seed = seed
        },
    }
    return { value, remembered }
}

const typeParam = (about: string): Param => ({
    name: "type",
    about,
    fallback: "sin",
    accepts: types.accepts,
    settle: types.settle,
    fromNumber: types.fromNumber,
    options: types.options,
})

const freqParam = (about: string): Param => ({ name: "freq", about, fallback: "1", accepts: isNumber })

const createWaveGenerator = (type: string, freq: number, rate: number, to: heading): CellRule => {
    const wave = createWave(type, freq)
    const rule: CellRule = (_, tick) =>
        fires(rate, tick) ? { value: wave.value(tick), ...aim(to) } : {}
    return Object.assign(rule, wave.remembered)
}

export const waveGenerator: Operation = {
    name: "wave",
    kind: "generator",
    about: about.W.about,
    params: [
        typeParam(about.W.params.type),
        freqParam(about.W.params.freq),
        rateParam(about.W.params.rate),
        directionParam(about.W.params.direction),
    ],
    rule: (type, freq, rate, to) =>
        createWaveGenerator(typeOf(type), Number(freq), Number(rate), headingOf(to) as heading),
}

// Gives each value arriving the waveform's value on the tick
const createWaveform = (type: string, freq: number): CellRule => {
    const wave = createWave(type, freq)
    const rule: CellRule = (cell, tick) =>
        isMoving(cell) ? { ...cell, value: wave.value(tick) } : cell
    return Object.assign(rule, wave.remembered)
}

export const wave: Operation = {
    name: "wave",
    kind: "operator",
    about: about.w.about,
    params: [typeParam(about.w.params.type), freqParam(about.w.params.freq)],
    label: type => typeOf(type),
    rule: (type, freq) => createWaveform(typeOf(type), Number(freq)),
}
