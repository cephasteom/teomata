import { get } from "svelte/store"
import type { direction } from "../stores/cells"
import { q } from "../stores/global"
import { BANG, axes, isAxis, isDirection } from "../lib/utils"
import type { Operation, CellRule, Param } from "./types"
import { about } from "./instructions"

// Puts a new cell with a bang heading in the given direction on the square every freq bars
// The next move carries it onto the neighbouring square like any other cell
// freq is in bars, so 1 is once a bar and .5 is twice a bar
// For x or y the bangs take turns heading either way along that axis, east
// then west or north then south
// Fires on the first tick at or after each trigger, and at most once a tick
const createBang = (freq = 1, to = "e"): CellRule => {
    const ways: direction[] = isAxis(to) ? axes[to] : [to as direction]
    let fired = 0
    return (cell, tick) =>
        tick % (freq * get(q)) < 1 ? { value: BANG, direction: ways[fired++ % ways.length] } : cell
}

const bars: Param = {
    name: "n",
    about: about.bang.params.n,
    fallback: "1",
    accepts: text => text !== "" && Number.isFinite(Number(text)) && Number(text) > 0,
}

const heading: Param = {
    name: "direction",
    about: about.bang.params.direction,
    fallback: "e",
    accepts: text => isDirection(text.toLowerCase()) || isAxis(text.toLowerCase()),
}

export const bang: Operation = {
    name: "bang",
    about: about.bang.about,
    params: [bars, heading],
    rule: (freq, to) => createBang(Number(freq), to.toLowerCase()),
}
