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

// Ramping controllers

// A controller gliding a step at a time from one value to another, over
// WebMidi times start to end. sent counts the steps sent so far
type Ramp = { device: number, channel: number, controller: number, from: number, to: number, start: number, end: number, sent: number }

const ramps = new Map<string, Ramp>()

const stepsOf = ({ from, to }: Ramp) => Math.abs(to - from)
const valueOf = (ramp: Ramp) => ramp.from + Math.sign(ramp.to - ramp.from) * ramp.sent

// Sends a controller value at WebMidi time at, ramping to it over duration
// milliseconds from the last value sent. A duration of 0, or a controller not
// yet sent, snaps to it. The steps are sent by sendRamps
export const rampControl = (device: number, channel: number, controller: number, value: number, at: number, duration: number) => {
    const key = `${device}:${channel}:${controller}`
    const last = ramps.get(key)
    if (duration <= 0 || !last) {
        sendControl(device, channel, controller, value, at)
        ramps.set(key, { device, channel, controller, from: value, to: value, start: at, end: at, sent: 0 })
        return
    }
    ramps.set(key, { device, channel, controller, from: valueOf(last), to: value, start: at, end: at + duration, sent: 0 })
}

// Sends the ramps' steps due before WebMidi time until, a value at a time
export const sendRamps = (until: number) => {
    for (const ramp of ramps.values()) {
        const steps = stepsOf(ramp)
        while (ramp.sent < steps) {
            const at = ramp.start + (ramp.sent + 1) / steps * (ramp.end - ramp.start)
            if (at >= until) break
            ramp.sent++
            sendControl(ramp.device, ramp.channel, ramp.controller, valueOf(ramp), at)
        }
    }
}

// Forgets the ramps and the values sent, so the next value snaps
export const stopRamps = () => ramps.clear()
