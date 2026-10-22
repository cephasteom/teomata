import { isValue } from "../lib/utils"
import { createValues } from "./values"
import type { Operation, Param } from "./types"
import { about } from "./instructions"

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

const root: Param = {
    name: "root",
    about: about.harmony.params.root,
    fallback: "c",
    accepts: isRoot,
}

const triad: Param = {
    name: "triad",
    about: about.harmony.params.triad,
    fallback: "ma",
    accepts: text => text.toLowerCase() in triads,
}

const inversion: Param = {
    name: "inversion",
    about: about.harmony.params.inversion,
    fallback: "0",
    accepts: isValue,
}

export const harmony: Operation = {
    name: "harmony",
    about: about.harmony.about,
    params: [root, triad, inversion],
    rule: (root, triad, inversion) => createValues(chordNotes(root, triad, Number(inversion))),
}