import type { Cell } from "../stores/cells"

// What the rules want sent or printed on a tick. The rules run ahead of the
// tick being heard, so they queue these for the scheduler, which sends the
// MIDI at the tick's time and prints the lines when the tick is drawn
export type Event =
    | { type: "note", device: number, channel: number, notes: number[], amp: number, dur: number }
    | { type: "cc", device: number, channel: number, controller: number, value: number }
    | { type: "print", text: string }
    // A value arrived on an input, setting the kth argument of the operation on the square
    | { type: "arg", square: number, k: number, text: string }
    // An input or output on the square absorbed the cell, which still shows there for the tick
    | { type: "absorb", square: number, cell: Cell }

let queue: Event[] = []

// Queues an event for the tick being worked out
export const emit = (event: Event) => {
    queue.push(event)
}

// The events queued since the last drain, emptying the queue
export const drain = () => {
    const events = queue
    queue = []
    return events
}
