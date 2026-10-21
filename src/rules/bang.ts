import { get } from "svelte/store"
import type { direction } from "../stores/cells"
import { q } from "../stores/global"
import { isDirection } from "../lib/utils"
import type { Operation, CellRule, Param } from "./types"

// Puts a new cell heading in the given direction on the square every freq bars
// The next move carries it onto the neighbouring square like any other cell
// freq is in bars, so 1 is once a bar and .5 is twice a bar
// Fires on the first tick at or after each trigger, and at most once a tick
const createBang = (freq = 1, to: direction = "e"): CellRule => (cell, tick) =>
    tick % (freq * get(q)) < 1 ? { value: 1, direction: to } : cell

const bars: Param = {
    name: "freq",
    label: "f",
    about: "Frequency of bangs. 1 is once per cycle and .5 is twice a bar.",
    fallback: "1",
    accepts: text => text !== "" && Number.isFinite(Number(text)) && Number(text) > 0,
}

const heading: Param = {
    name: "direction",
    label: "dir",
    about: "Which way the new cell heads: n, s, e or w.",
    fallback: "e",
    accepts: text => isDirection(text.toLowerCase()),
}

export const bang: Operation = {
    params: [bars, heading],
    rule: (freq, to) => createBang(Number(freq), to.toLowerCase() as direction),
}
