import type { CellRule, Operation, Param } from "./types"
import { BANG } from "../lib/utils"
import { playNote } from "../lib/midi"
import { printLine } from "../stores/console"
import { about } from "./instructions"

// Every note plays at the same velocity and length for now
const AMP = 100
const DUR = 0.5

const toMidi = (n: number) => Math.min(127, Math.max(0, Math.round(n)))

// Plays each moving cell with a number that arrives as a MIDI note, or an
// array as a chord, on the device and channel, printing it to the console
// Bangs are ignored, and the cell is left alone
const createOut = (device: number, channel: number): CellRule => cell => {
    const { value, direction } = cell
    if (!direction || value === undefined || value === BANG) return cell
    const notes = (Array.isArray(value) ? value : [value]).map(toMidi)
    if (!notes.length) return cell
    playNote(device, channel, notes, AMP, DUR)
    printLine(notes.join(", "), "var(--cell-out)")
    return cell
}

const isWhole = (text: string) => /^\d+$/.test(text)

const device: Param = {
    name: "device",
    about: about.out.params.device,
    fallback: "0",
    accepts: isWhole,
}

const channel: Param = {
    name: "channel",
    about: about.out.params.channel,
    fallback: "1",
    accepts: text => isWhole(text) && Number(text) >= 1 && Number(text) <= 16,
}

export const out: Operation = {
    name: "out",
    about: about.out.about,
    params: [device, channel],
    rule: (device, channel) => createOut(Number(device), Number(channel)),
}
