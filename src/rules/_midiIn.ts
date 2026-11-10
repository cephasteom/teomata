import { get } from "svelte/store"
import { q } from "../stores/global"
import type { ControlIn, MidiIn, NoteIn } from "../lib/midi"
import { isNumber } from "./_shared"
import type { CellRule, Param } from "./_types"

// What arrived on the MIDI inputs since the last tick, taken once a tick so
// every square listening to the same device and channel hears the same
let heard: MidiIn = { notes: [], controls: [] }

export const hear = (midiIn: MidiIn) => { heard = midiIn }

export const notesHeard = (device: number, channel: number) =>
    heard.notes.filter(note => note.device === device && note.channel === channel)

export const controlsHeard = (device: number, channel: number, controller: number) =>
    heard.controls.filter(control =>
        control.device === device && control.channel === channel && control.controller === controller)

// How many cycles a MIDI input generator holds what arrives. 0 puts it out on
// the next tick. Above 0 it goes to the nearest tick, put out that much later
export const lookaheadParam = (about: string): Param => ({
    name: "lookahead",
    about,
    fallback: "0",
    accepts: text => isNumber(text) && Number(text) >= 0,
})

// Holds what a generator heard until the tick it's due, the nearest tick to
// when it arrived, delayed by the lookahead, or at once with none. Anything
// due on a tick already worked out is put out on the tick being worked out
export const createDelay = <T extends NoteIn | ControlIn>(lookahead: number) => {
    let due: { tick: number, event: T }[] = []
    const delay = lookahead > 0 ? Math.max(1, Math.round(lookahead * get(q))) : 0
    return {
        // What's due on the tick, given what arrived since the last, in the order it arrived
        take: (heard: T[], tick: number): T[] => {
            due.push(...heard.map(event => ({ event, tick: Math.round(event.at) + delay })))
            const now = due.filter(held => held.tick <= tick).map(held => held.event)
            due = due.filter(held => held.tick > tick)
            return now.sort((a, b) => a.at - b.at)
        },
        // What's held carries over to a rule rebuilt with new arguments
        keep: () => due,
        carry: (kept: unknown) => { due = kept as typeof due },
        stop: () => { due = [] },
    } satisfies Partial<CellRule> & { take: unknown }
}
