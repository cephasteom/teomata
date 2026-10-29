import type { CellRule, Operation, Param } from "./types"
import { BANG } from "../lib/utils"
import { emit } from "./events"
import { channelParam, deviceParam, isMoving, isNumber } from "./shared"
import { about } from "./instructions"

// Rounds a number and wraps it into MIDI's 0 to 127, so 128 is 0 and -1 is 127
export const toMidi = (n: number) => ((Math.round(n) % 128) + 128) % 128

// Plays each number that arrives as a MIDI note, or an array as a chord, at
// the velocity for dur seconds, on the device and channel
// Bangs are ignored, and every moving cell is absorbed
const createNote = (amp: number, dur: number, device: number, channel: number): CellRule => cell => {
    const { value } = cell
    if (!isMoving(cell)) return cell
    if (value === BANG) return {}
    const notes = (Array.isArray(value) ? value : [value!]).map(toMidi)
    if (notes.length) emit({ type: "note", device, channel, notes, amp, dur })
    return {}
}

const velocity: Param = {
    name: "vel",
    about: about.n.params.vel,
    fallback: "100",
    accepts: text => isNumber(text) && Number(text) >= 0 && Number(text) <= 127,
}

const duration: Param = {
    name: "dur",
    about: about.n.params.dur,
    fallback: ".5",
    accepts: text => isNumber(text) && Number(text) > 0,
}

export const note: Operation = {
    name: "note",
    kind: "output",
    about: about.n.about,
    params: [velocity, duration, deviceParam(about.n.params.device), channelParam(about.n.params.channel)],
    rule: (vel, dur, device, channel) =>
        createNote(Math.round(Number(vel)), Number(dur), Number(device), Number(channel)),
}
