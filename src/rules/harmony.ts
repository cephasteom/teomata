import { createValues } from "./values"
import type { Operation, Param } from "./types"
import { about } from "./instructions"
import { harmonies } from "../lib/harmony"

// Semitones above C for each note name
const notes: Record<string, number> = { c: 0, d: 2, e: 4, f: 5, g: 7, a: 9, b: 11 }

// The root sits in the octave from middle C, so c is 60
const MIDDLE_C = 60

// A note name with an optional # or b, ignoring case, so cb is the B below c
const isRoot = (text: string) => /^[a-g][#b]?$/i.test(text)
const semitones = (root: string) => {
    const [letter, accidental] = root.toLowerCase()
    return notes[letter] + (accidental === "#" ? 1 : accidental === "b" ? -1 : 0)
}

// The harmony's notes, from the root in the octave from middle C upwards
const harmonyNotes = (type: string, root: string) =>
    harmonies[type.toLowerCase()].map(n => MIDDLE_C + semitones(root) + n)

const type: Param = {
    name: "type",
    about: about.harmony.params.type,
    fallback: "ma",
    accepts: text => Object.hasOwn(harmonies, text.toLowerCase()),
}

const root: Param = {
    name: "root",
    about: about.harmony.params.root,
    fallback: "c",
    accepts: isRoot,
}

export const harmony: Operation = {
    name: "harmony",
    about: about.harmony.about,
    params: [type, root],
    rule: (type, root) => createValues(harmonyNotes(type, root)),
}
