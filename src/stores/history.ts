import { get } from "svelte/store"
import { SIZE } from "./global"
import { operations, args, muted } from "./operations"
import { cursor, anchor } from "./cursor"

// How many changes can be undone
export const HISTORY = 4

// The operations, arguments and mutes at one time, with the selection then
export type Snapshot = {
    operations: string[], args: string[][], muted: boolean[], cursor: number, anchor: number,
}

let undos: Snapshot[] = []
let redos: Snapshot[] = []

export const snapshot = (): Snapshot => ({
    operations: get(operations), args: get(args), muted: get(muted), cursor: get(cursor), anchor: get(anchor),
})

// Whether two snapshots have the same operations, arguments and mutes. The
// stores are copied on every change, so they are compared square by square
const same = (a: Snapshot, b: Snapshot) => {
    for (let i = 0; i < SIZE * SIZE; i++) {
        if (a.operations[i] !== b.operations[i] || a.muted[i] !== b.muted[i]) return false
        const [x, y] = [a.args[i], b.args[i]]
        if (x !== y && (x.length !== y.length || x.some((arg, k) => arg !== y[k]))) return false
    }
    return true
}

// Keeps what was there before a change so it can be undone, unless nothing
// changed. A new change can't be redone over
export const record = (before: Snapshot) => {
    if (same(before, snapshot())) return
    undos = [...undos, before].slice(-HISTORY)
    redos = []
}

// Makes a change and keeps what was there before it
export const change = (make: () => void) => {
    const before = snapshot()
    make()
    record(before)
}

const restore = (to: Snapshot) => {
    operations.set(to.operations)
    args.set(to.args)
    muted.set(to.muted)
    cursor.set(to.cursor)
    anchor.set(to.anchor)
}

// Puts back what was there before the last change, keeping what is there now to redo
export const undo = () => {
    const to = undos.pop()
    if (!to) return
    redos = [...redos, snapshot()].slice(-HISTORY)
    restore(to)
}

// Makes the last undone change again
export const redo = () => {
    const to = redos.pop()
    if (!to) return
    undos = [...undos, snapshot()].slice(-HISTORY)
    restore(to)
}
