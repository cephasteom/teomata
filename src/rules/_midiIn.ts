import { get } from "svelte/store"
import { q } from "../stores/global"
import type { ControlIn, NoteIn, Received } from "../lib/midi"
import { isNumber } from "./_shared"
import type { CellRule, Param } from "./_types"

// What arrived on the MIDI inputs since the last tick, taken once a tick so
// every square listening to the same device and channel receives the same
let received: Received = { notes: [], controls: [] }

export const receive = (midi: Received) => { received = midi }

// Channel 0 listens on all channels
const on = (channel: number, event: NoteIn | ControlIn) => channel === 0 || event.channel === channel

export const notesReceived = (device: number, channel: number) =>
    received.notes.filter(note => note.device === device && on(channel, note))

export const controlsReceived = (device: number, channel: number, controller: number) =>
    received.controls.filter(control =>
        control.device === device && on(channel, control) && control.controller === controller)

// How many cycles a MIDI input generator holds what arrives. 
// 0 quantizes to the next tick. 
// Above 0 quantizes to the nearest tick, which is more musical
export const delayParam = (about: string): Param => ({
    name: "delay",
    about,
    fallback: "0",
    accepts: text => isNumber(text) && Number(text) >= 0,
})

// Holds what was received until the tick it's due
export const createDelay = <T extends NoteIn | ControlIn>(delay: number) => {
    let due: { tick: number, event: T }[] = []
    const ticks = delay > 0 ? Math.max(1, Math.round(delay * get(q))) : 0
    return {
        // What's due on the tick, given what arrived since the last, in the order it arrived
        take: (received: T[], tick: number): T[] => {
            due.push(...received.map(event => ({ event, tick: Math.round(event.at) + ticks })))
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
