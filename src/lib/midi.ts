import { writable, get } from "svelte/store"
import { WebMidi, type Input, type Output } from "webmidi"

// The MIDI devices plugged in now, kept up to date as they come and go
export const inputs = writable<Input[]>([])
export const outputs = writable<Output[]>([])

const listDevices = () => {
    inputs.set([...WebMidi.inputs])
    outputs.set([...WebMidi.outputs])
}

// Asks the browser for MIDI access once, at import time. Browsers without
// Web MIDI, or a refused permission, leave the lists empty
WebMidi.enable()
    .then(() => {
        listDevices()
        WebMidi.addListener("connected", listDevices)
        WebMidi.addListener("disconnected", listDevices)
    })
    .catch(error => console.warn("MIDI is unavailable", error))

// Plays the notes on the output at that index, from 0, and channel, from 1
// to 16, at a velocity from 0 to 127 for dur seconds. A missing output
// plays nothing
export const playNote = (device: number, channel: number, notes: number[], amp: number, dur: number) => {
    get(outputs)[device]?.channels[channel]?.playNote(notes, { rawAttack: amp, duration: dur * 1000 })
}

// Sends a control change, a value from 0 to 127 for a controller from 0 to
// 127, on the output at that index, from 0, and channel, from 1 to 16. A
// missing output sends nothing
export const sendControl = (device: number, channel: number, controller: number, value: number) => {
    get(outputs)[device]?.channels[channel]?.sendControlChange(controller, value)
}
