import { get } from "svelte/store"
import { q } from "../stores/global"
import type { Cell } from "../stores/cells"
import type { CellRule, Operation, Param } from "./types"
import { isMoving, isNumber, resetParam, resets } from "./shared"
import { about } from "./instructions"

// The cells recorded, by the tick of the loop they arrived on
type Cache = Map<number, Cell>

// Plays back the cells it has recorded on the ticks of the loop they arrived
// on, the loop lasting length cycles. While record is 1 it lets the cells
// arriving through and records them, each over whatever it held on that tick,
// and while it's 0 it lets nothing through. It forgets everything it
// recorded every reset cycles, on the first division of the cycle, and when a
// bang arrives on its reset input, before it records what arrives. It carries on from what it recorded when its
// arguments change, and is emptied when the transport stops
const createLoop = (record: boolean, every: number, length: number): CellRule => {
    let cache: Cache = new Map()
    const rule: CellRule = (cell, tick, bangs) => {
        if (resets(every, tick, bangs)) cache.clear()
        const ticks = Math.max(1, Math.round(length * get(q)))
        const position = tick % ticks
        if (record && isMoving(cell)) {
            cache.set(position, cell)
            return cell
        }
        return cache.get(position) ?? {}
    }
    rule.keep = () => cache
    rule.carry = kept => {
        if (kept instanceof Map) cache = kept as Cache
    }
    // The loop is emptied when the transport stops
    rule.stop = () => cache.clear()
    return rule
}

const record: Param = {
    name: "record",
    about: about.o.params.record,
    fallback: "0",
    accepts: text => text === "0" || text === "1",
    options: ["0", "1"],
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
