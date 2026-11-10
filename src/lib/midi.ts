import { writable, get } from "svelte/store"
import { WebMidi, type Input, type Output } from "webmidi"
import { immediate } from "tone"

export const inputs = writable<Input[]>([])
export const outputs = writable<Output[]>([])

const listDevices = () => {
    inputs.set([...WebMidi.inputs])
    outputs.set([...WebMidi.outputs])
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
