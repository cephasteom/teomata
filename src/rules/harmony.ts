import { createValues } from "./value"
import type { Operation, Param } from "./_types"
import { isWhole, named, wrapped } from "./_shared"
import { about } from "./_instructions"
import { harmonies } from "../lib/harmony"

// Semitones above C for each note name
const notes: Record<string, number> = { c: 0, d: 2, e: 4, f: 5, g: 7, a: 9, b: 11 }

// Each octave runs from its C upwards, so octave 3 is C3 (48) to B3
const C0 = 12

const MAX_OCTAVE = 8
const MAX_DEGREE = 32
const MAX_LENGTH = 32

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

// length notes of the harmony, starting on its degree (0 is the root) above the
// root in the given octave, carrying on into the octaves above. A length of 0
// plays as many notes as the harmony has, so degree 1 of ma is 3, 5, 8
const harmonyNotes = (root: string, type: string, degree: number, start: number, length: number) => {
    const base = C0 + 12 * start + semitones(root)
    const steps = harmonies[type.toLowerCase()]
    return Array.from({ length: length || steps.length }, (_, i) => {
        const k = degree + i
        return base + 12 * Math.floor(k / steps.length) + steps[k % steps.length]
    })
}

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

const deg: Param = {
    name: "deg",
    about: about.h.params.deg,
    fallback: "0",
    accepts: text => isWhole(text) && Number(text) <= MAX_DEGREE,
}

const len: Param = {
    name: "len",
    about: about.h.params.len,
    fallback: "0",
    accepts: text => isWhole(text) && Number(text) <= MAX_LENGTH,
}

const oct: Param = {
    name: "oct",
    about: about.h.params.oct,
    fallback: "3",
    accepts: text => isWhole(text) && Number(text) <= MAX_OCTAVE,
}

export const harmony: Operation = {
    name: "harmony",
    kind: "operator",
    about: about.h.about,
    params: [root, type, deg, oct, len],
    // The root's letter in capitals, then the type, cut to 3 letters, such as Cma or F#d
    label: (root, type) => {
        const [name, kind] = [rootOf(root), types.nameOf(type)]
        return (name[0].toUpperCase() + name.slice(1).toLowerCase() + kind).slice(0, 3)
    },
    rule: (root, type, deg, oct, len) =>
        createValues(harmonyNotes(rootOf(root), types.nameOf(type), Number(deg), Number(oct), Number(len))),
}
