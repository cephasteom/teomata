import { writable, get } from "svelte/store"
import { WebMidi, type Input, type Output, type MessageEvent } from "webmidi"
import { getTransport, immediate } from "tone"
import { q } from "../stores/global"

// Devices

export const inputs = writable<Input[]>([])
export const outputs = writable<Output[]>([])

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

// Receiving

export type NoteIn = { device: number, channel: number, note: number, at: number }
export type ControlIn = { device: number, channel: number, controller: number, value: number, at: number }
export type Received = { notes: NoteIn[], controls: ControlIn[] }

let received: Received = { notes: [], controls: [] }

// Hands over what was received since the last call, and starts afresh
export const drainReceived = () => {
    const drained = received
    received = { notes: [], controls: [] }
    return drained
}

export const discardReceived = () => { received = { notes: [], controls: [] } }

// WebMidi timestamp to a tick of the current q, or undefined while the transport is stopped
const tickAt = (timestamp: number) => {
    const transport = getTransport()
    if (transport.state !== "started") return undefined
    const time = immediate() - (WebMidi.time - timestamp) / 1000
    return transport.getTicksAtTime(time) / (transport.PPQ * 4 / get(q))
}

const record = <T>(list: T[], timestamp: number, event: (at: number) => T) => {
    const at = tickAt(timestamp)
    if (at !== undefined) list.push(event(at))
}

const listening = new WeakSet<Input>()

// WebMidi reports note on with velocity 0 as note off, so it isn't recorded
const listen = (input: Input) => {
    if (listening.has(input)) return
    listening.add(input)
    const device = () => get(inputs).indexOf(input)
    input.addListener("noteon", ({ message, timestamp }: MessageEvent) => {
        const [note] = message.dataBytes
        record(received.notes, timestamp, at => ({ device: device(), channel: message.channel, note, at }))
    })
    input.addListener("controlchange", ({ message, timestamp }: MessageEvent) => {
        const [controller, value] = message.dataBytes
        record(received.controls, timestamp, at => ({ device: device(), channel: message.channel, controller, value, at }))
    })
}

// Sending

// Tone time to WebMidi time
export const midiTime = (time: number) => WebMidi.time + (time - immediate()) * 1000

// The output channels to send on: channel 0 sends on all of them
const channelsOf = (device: number, channel: number) => {
    const channels = get(outputs)[device]?.channels ?? []
    return channel === 0 ? channels.slice(1, 17) : [channels[channel]]
}

export const playNote = (device: number, channel: number, notes: number[], amp: number, dur: number, at?: number) => {
    for (const out of channelsOf(device, channel)) out?.playNote(notes, { rawAttack: amp, duration: dur * 1000, time: at })
}

export const sendControl = (device: number, channel: number, controller: number, value: number, at?: number) => {
    for (const out of channelsOf(device, channel)) out?.sendControlChange(controller, value, { time: at })
}
