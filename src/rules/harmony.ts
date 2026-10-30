import { createValues } from "./value"
import type { Operation, Param } from "./types"
import { isWhole, named, wrapped } from "./shared"
import { about } from "./instructions"
import { harmonies } from "../lib/harmony"

// Semitones above C for each note name
const notes: Record<string, number> = { c: 0, d: 2, e: 4, f: 5, g: 7, a: 9, b: 11 }

// The root sits in the octave from middle C, so c is 60
const MIDDLE_C = 60

const MAX_OCTAVES = 8

// A note name with an optional # or b, ignoring case, so cb is the B below c
const isRoot = (text: string) => /^[a-g][#b]?$/i.test(text)

// Each note of the octave by its semitones above c, so a root can be given as
// a number, which is kept as its name
const chromatic = ["c", "c#", "d", "d#", "e", "f", "f#", "g", "g#", "a", "a#", "b"]
const rootOf = (text: string) => isWhole(text) ? chromatic[Number(text)] ?? text : text
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
    accepts: text => isRoot(rootOf(text)),
    settle: rootOf,
    fromNumber: n => wrapped(chromatic, n),
    options: chromatic,
}

// A harmony by name, ignoring case, or by its index in harmonies
const types = named(Object.keys(harmonies))

const type: Param = {
    name: "type",
    about: about.h.params.type,
    fallback: "ma",
    accepts: types.accepts,
    settle: types.settle,
    fromNumber: types.fromNumber,
    options: types.options,
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
    label: (root, type) => {
        const [name, kind] = [rootOf(root), types.nameOf(type)]
        return (name[0].toUpperCase() + name.slice(1).toLowerCase() + kind).slice(0, 3)
    },
    rule: (root, type, octaves) => createValues(harmonyNotes(rootOf(root), types.nameOf(type), Number(octaves))),
}
