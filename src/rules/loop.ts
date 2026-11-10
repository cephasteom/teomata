import { get } from "svelte/store"
import { q } from "../stores/global"
import type { Cell } from "../stores/cells"
import type { CellRule, Operation, Param } from "./_types"
import { isMoving, isNumber, resetParam, resets } from "./_shared"
import { about } from "./_instructions"
import { BANG, isDirection } from "../lib/utils"

// The cells recorded, by the tick of the loop they arrived on
type Cache = Map<number, Cell>

// Whether a saved entry is a tick of the loop and the moving cell recorded on it
const isRecorded = (entry: unknown): entry is [number, Cell] => {
    if (!Array.isArray(entry) || entry.length !== 2) return false
    const [position, cell] = entry
    if (!Number.isInteger(position) || position < 0 || typeof cell !== "object" || cell === null) return false
    const { value, direction, split } = cell as Cell
    const isNumber = (n: unknown) => typeof n === "number" && Number.isFinite(n)
    const isHeading = (d: unknown) => typeof d === "string" && isDirection(d)
    return isHeading(direction) &&
        (value === BANG || isNumber(value) || (Array.isArray(value) && value.every(isNumber))) &&
        (split === undefined || (Array.isArray(split) && split.every(isHeading)))
}

// Plays back the cells it has recorded on the ticks of the loop they arrived
// on, the loop lasting length cycles. While record is 1 it lets the cells
// arriving through and records them, each over whatever it held on that tick,
// and while it's 0 it lets nothing through. It forgets everything it
// recorded every reset cycles, on the first division of the cycle, and when a
// bang arrives on its reset input, before it records what arrives. A bang on
// its record input sets record to 1 for the length of the loop from that
// tick, then sets it back to 0, unless record was set to 0 in between. It
// carries on from what it recorded, and any recording a bang started, when
// its arguments change. A recording a bang started stops with the transport
const createLoop = (record: boolean, every: number, length: number): CellRule => {
    let cache: Cache = new Map()
    // The tick a recording started by a bang stops on, or 0 for none
    let until = 0
    const rule: CellRule = (cell, tick, context) => {
        if (resets(every, tick, context)) cache.clear()
        const ticks = Math.max(1, Math.round(length * get(q)))
        if (context.bangs.has("record")) until = tick + ticks
        // Record set back to 0 by hand ends a recording a bang started
        else if (!record) until = 0
        let recording = record
        if (until && tick >= until) {
            context.set("record", "0")
            until = 0
            recording = false
        }
        const position = tick % ticks
        if (recording && isMoving(cell)) {
            cache.set(position, cell)
            return cell
        }
        return cache.get(position) ?? {}
    }
    rule.keep = () => ({ cache, until })
    rule.carry = kept => {
        const { cache: c, until: u } = (kept ?? {}) as { cache?: unknown, until?: unknown }
        if (c instanceof Map) cache = c as Cache
        if (typeof u === "number") until = u
    }
    // A recording a bang started stops when the transport stops, but the loop is kept
    rule.stop = () => { until = 0 }
    // The loop outlasts the transport stopping, the page reloading, and is
    // saved in the patch
    rule.save = () => [...cache]
    rule.load = saved => {
        if (Array.isArray(saved)) cache = new Map(saved.filter(isRecorded))
    }
    return rule
}

const record: Param = {
    name: "record",
    about: about.o.params.record,
    fallback: "0",
    accepts: text => text === "0" || text === "1",
    options: ["0", "1"],
    bang: true,
    fromBang: "1",
}

const length: Param = {
    name: "length",
    about: about.o.params.length,
    fallback: "1",
    accepts: text => isNumber(text) && Number(text) > 0,
}

export const loop: Operation = {
    name: "loop",
    kind: "operator",
    about: about.o.about,
    params: [record, resetParam(about.o.params.reset), length],
    rule: (record, reset, length) => createLoop(record === "1", Number(reset), Number(length)),
}
