import type { CellRule, Operation } from "./types"
import { BANG } from "../lib/utils"
import { playNote } from "../lib/midi"
import { printLine } from "../stores/console"
import { channelParam, deviceParam, isMoving } from "./shared"
import { about } from "./instructions"

// Every note plays at the same velocity and length for now
const AMP = 100
const DUR = 0.5

// Rounds a number and wraps it into MIDI's 0 to 127, so 128 is 0 and -1 is 127
export const toMidi = (n: number) => ((Math.round(n) % 128) + 128) % 128

// Plays each number that arrives as a MIDI note, or an array as a chord, on
// the device and channel, printing it to the console
// Bangs are ignored, and the cell is left alone
const createNote = (device: number, channel: number): CellRule => cell => {
    const { value } = cell
    if (!isMoving(cell) || value === BANG) return cell
    const notes = (Array.isArray(value) ? value : [value!]).map(toMidi)
    if (!notes.length) return cell
    playNote(device, channel, notes, AMP, DUR)
    printLine(notes.join(", "), "var(--cell-output)")
    return cell
}

export const note: Operation = {
    name: "note",
    kind: "output",
    about: about.n.about,
    params: [deviceParam(about.n.params.device), channelParam(about.n.params.channel)],
    rule: (device, channel) => createNote(Number(device), Number(channel)),
}
