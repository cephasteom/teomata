import type { CellRule, Operation } from "./_types"
import { aim, headingOf, type heading } from "../lib/utils"
import { channelParam, deviceParam, directionParam } from "./_shared"
import { createDelay, delayParam, notesReceived } from "./_midiIn"
import type { NoteIn } from "../lib/midi"
import { about } from "./_instructions"

// Puts out the notes played on the MIDI input that are due on the tick, a
// number for one note or an array for several, each once
const createNoteIn = (device: number, channel: number, to: heading, delay: number): CellRule => {
    const { take, keep, carry, stop } = createDelay<NoteIn>(delay)
    const rule: CellRule = (_, tick) => {
        const notes = [...new Set(take(notesReceived(device, channel), tick).map(({ note }) => note))]
        if (!notes.length) return {}
        return { value: notes.length === 1 ? notes[0] : notes, ...aim(to) }
    }
    return Object.assign(rule, { keep, carry, stop })
}

export const noteIn: Operation = {
    name: "note",
    kind: "generator",
    about: about.N.about,
    params: [
        deviceParam(about.N.params.device),
        channelParam(about.N.params.channel),
        delayParam(about.N.params.delay),
        directionParam(about.N.params.direction),
    ],
    rule: (device, channel, delay, to) =>
        createNoteIn(Number(device), Number(channel), headingOf(to) as heading, Number(delay)),
}
