import { writable, get } from "svelte/store"
import { WebMidi, type Input, type Output, type MessageEvent } from "webmidi"
import { getTransport, immediate } from "tone"
import { q } from "../stores/global"

export const inputs = writable<Input[]>([])
export const outputs = writable<Output[]>([])

// What arrived on the inputs since the rules last took it, in the order it
// arrived. Devices count from 0 in the inputs list, as outputs do. `at` is
// where it arrived on the transport, in ticks, with a fraction
export type NoteIn = { device: number, channel: number, note: number, at: number }
export type ControlIn = { device: number, channel: number, controller: number, value: number, at: number }
export type MidiIn = { notes: NoteIn[], controls: ControlIn[] }

const emptyMidiIn = (): MidiIn => ({ notes: [], controls: [] })

let heard = emptyMidiIn()

// Hands over what arrived since the last call, emptying it
export const takeMidiIn = () => {
    const taken = heard
    heard = emptyMidiIn()
    return taken
}

export const clearMidiIn = () => { heard = emptyMidiIn() }

// Where a WebMidi timestamp falls on the transport, in ticks of the current q,
// as the scheduler counts them, or undefined while it's stopped
const tickAt = (timestamp: number) => {
    const transport = getTransport()
    if (transport.state !== "started") return undefined
    const time = immediate() - (WebMidi.time - timestamp) / 1000
    return transport.getTicksAtTime(time) / (transport.PPQ * 4 / get(q))
}

const listening = new WeakSet<Input>()

// WebMidi reports a note on with velocity 0 as a note off, so it isn't heard
const listen = (input: Input) => {
    if (listening.has(input)) return
    listening.add(input)
    const device = () => get(inputs).indexOf(input)
    input.addListener("noteon", ({ message, timestamp }: MessageEvent) => {
        const at = tickAt(timestamp)
        const [note] = message.dataBytes
        if (at !== undefined) heard.notes.push({ device: device(), channel: message.channel, note, at })
    })
    input.addListener("controlchange", ({ message, timestamp }: MessageEvent) => {
        const at = tickAt(timestamp)
        const [controller, value] = message.dataBytes
        if (at !== undefined) heard.controls.push({ device: device(), channel: message.channel, controller, value, at })
    })
}

const listDevices = () => {
    inputs.set([...WebMidi.inputs])
    outputs.set([...WebMidi.outputs])
    WebMidi.inputs.forEach(listen)
}

WebMidi.enable()
    .then(() => {
        listDevices()
        WebMidi.addListener("connected", listDevices)
        WebMidi.addListener("disconnected", listDevices)
    })
    .catch(error => console.warn("MIDI is unavailable", error))

// Tone.js time to Midi.js time
export const midiTime = (time: number) => WebMidi.time + (time - immediate()) * 1000

export const playNote = (device: number, channel: number, notes: number[], amp: number, dur: number, at?: number) => {
    get(outputs)[device]?.channels[channel]?.playNote(notes, { rawAttack: amp, duration: dur * 1000, time: at })
}

export const sendControl = (device: number, channel: number, controller: number, value: number, at?: number) => {
    get(outputs)[device]?.channels[channel]?.sendControlChange(controller, value, { time: at })
}
