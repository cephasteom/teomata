import { createValues } from "./value"
import type { Operation, Param } from "./types"
import { isWhole } from "./shared"
import { about } from "./instructions"
import { harmonies } from "../lib/harmony"

// Semitones above C for each note name
const notes: Record<string, number> = { c: 0, d: 2, e: 4, f: 5, g: 7, a: 9, b: 11 }

// The root sits in the octave from middle C, so c is 60
const MIDDLE_C = 60

const MAX_OCTAVES = 8

// A note name with an optional # or b, ignoring case, so cb is the B below c
const isRoot = (text: string) => /^[a-g][#b]?$/i.test(text)
const semitones = (root: string) => {
    const [letter, accidental] = root.toLowerCase()
    return notes[letter] + (accidental === "#" ? 1 : accidental === "b" ? -1 : 0)
}

// The harmony's notes, from the root in the octave from middle C upwards,
// repeated an octave higher for each octave after the first
const harmonyNotes = (root: string, type: string, octaves: number) =>
    Array.from({ length: octaves }, (_, octave) =>
        harmonies[type.toLowerCase()].map(n => MIDDLE_C + semitones(root) + 12 * octave + n)
    ).flat()

const root: Param = {
    name: "root",
    about: about.h.params.root,
    fallback: "c",
    accepts: isRoot,
}

const type: Param = {
    name: "type",
    about: about.h.params.type,
    fallback: "ma",
    accepts: text => Object.hasOwn(harmonies, text.toLowerCase()),
}

const octaves: Param = {
    name: "octaves",
    about: about.h.params.octaves,
    fallback: "1",
    accepts: text => isWhole(text) && Number(text) >= 1 && Number(text) <= MAX_OCTAVES,
}

export const harmony: Operation = {
    name: "harmony",
    kind: "operator",
    about: about.h.about,
    params: [root, type, octaves],
    // The root's letter in capitals, then the type, cut to 3 letters, such as Cma or F#d
    label: (root, type) => (root[0].toUpperCase() + root.slice(1).toLowerCase() + type.toLowerCase()).slice(0, 3),
    rule: (root, type, octaves) => createValues(harmonyNotes(root, type, Number(octaves))),
}
