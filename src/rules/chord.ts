import { isValue } from "../lib/utils"
import type { CellRule, Operation, Param } from "./types"

// Semitones above C for each note name, and for each triad's notes above its root
const notes: Record<string, number> = { c: 0, d: 2, e: 4, f: 5, g: 7, a: 9, b: 11 }
const triads: Record<string, number[]> = {
    ma: [0, 4, 7],
    mi: [0, 3, 7],
    au: [0, 4, 8],
    di: [0, 3, 6],
}

// The root sits in the octave from middle C, so c is 60
const MIDDLE_C = 60

// A note name with an optional # or b, ignoring case, so cb is the B below c
const isRoot = (text: string) => /^[a-g][#b]?$/i.test(text)
const semitones = (root: string) => {
    const [letter, accidental] = root.toLowerCase()
    return notes[letter] + (accidental === "#" ? 1 : accidental === "b" ? -1 : 0)
}

// Builds the chord's notes, then inverts it by moving its bottom note up an
// octave once for each inversion. The inversion wraps, so 3 is the root position
const chordNotes = (root: string, triad: string, inversion: number) => {
    const chord = triads[triad.toLowerCase()].map(n => MIDDLE_C + semitones(root) + n)
    for (let k = 0; k < ((inversion % 3) + 3) % 3; k++) chord.push(chord.shift()! + 12)
    return chord
}

// Gives a moving cell with any value but 0 the chord's notes as an array,
// keeping its direction
const createChord = (chord: number[]): CellRule => cell =>
    cell.direction && cell.value !== undefined && cell.value !== 0
        ? { ...cell, value: chord }
        : cell

const root: Param = {
    name: "root",
    about: "A note from a to g, with an optional # or b, such as c#.",
    fallback: "c",
    accepts: isRoot,
}

const triad: Param = {
    name: "triad",
    about: "ma, mi, au or di, for major, minor, augmented or diminished.",
    fallback: "ma",
    accepts: text => text.toLowerCase() in triads,
}

const inversion: Param = {
    name: "inversion",
    about: "0, 1 or 2. Other whole numbers wrap around.",
    fallback: "0",
    accepts: isValue,
}

export const chord: Operation = {
    name: "chord",
    about: "Output an array of a chord's notes when a non zero value arrives.",
    params: [root, triad, inversion],
    rule: (root, triad, inversion) => createChord(chordNotes(root, triad, Number(inversion))),
}
