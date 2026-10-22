import type { Cell, direction } from "../stores/cells"
import { BANG, isDirection, opposite, step } from "../lib/utils"
import { playNote } from "../lib/midi"
import { printLine } from "../stores/console"
import type { GridRule, Operation, Param } from "./types"
import { about } from "./instructions"

// The colour of an out's squares on the grid and of the notes it prints
export const OUT_COLOR = "var(--cell-out)"

const isWhole = (text: string) => /^\d+$/.test(text)

const device: Param = {
    name: "device",
    about: about.out.params.device,
    fallback: "0",
    accepts: isWhole,
}

const channel: Param = {
    name: "channel",
    about: about.out.params.channel,
    fallback: "1",
    accepts: text => isWhole(text) && Number(text) >= 1 && Number(text) <= 16,
}

const heading: Param = {
    name: "direction",
    about: about.out.params.direction,
    fallback: "s",
    accepts: text => isDirection(text.toLowerCase()),
}

// An argument as given, or its param's fallback when it's missing or invalid
const argument = (param: Param, given?: string) => given !== undefined && param.accepts(given) ? given : param.fallback

// The three squares the out on square i takes up, the note's own and then
// amp's and dur's, in a line in its direction, wrapping around the edges
const outSquares = (i: number, to: direction, size: number) => {
    const amp = step(i, to, size)
    return [i, amp, step(amp, to, size)]
}

const directionOf = (given?: string[]) => argument(heading, given?.[2]).toLowerCase() as direction

// The sides of each out square that edge its line of three, keyed by square,
// so the grid can draw a border round each line
export const outEdges = (letters: string[], args: string[][], size: number) => {
    const edges = new Map<number, Set<direction>>()
    letters.forEach((letter, i) => {
        if (letter.toLowerCase() !== "o") return
        const to = directionOf(args[i])
        const inside: direction[][] = [[to], [to, opposite[to]], [opposite[to]]]
        outSquares(i, to, size).forEach((square, k) => {
            const sides = edges.get(square) ?? new Set()
            for (const side of ["n", "s", "e", "w"] as direction[]) if (!inside[k].includes(side)) sides.add(side)
            edges.set(square, sides)
        })
    })
    return edges
}

// The numbers of a moving cell that arrives, or undefined for bangs and empty
// or still cells
const arriving = ({ value, direction }: Cell) =>
    direction && value !== undefined && value !== BANG ? (Array.isArray(value) ? value : [value]) : undefined

const toMidi = (n: number) => Math.min(127, Math.max(0, Math.round(n)))

// The amp and dur each out has been given, keyed by its square. They start
// afresh when the transport starts or the grid resizes
let levels = new Map<number, { amp: number, dur: number }>()
let levelsSize = 0

// Plays a note for each moving cell with a number that arrives on an o
// square, on the out's device and channel, with the amp and dur last given
// to its other two squares. Those squares only take the value they're given,
// and every cell is left alone. Amp and dur arriving on the same tick as a
// note are taken first
export const sendNotes: GridRule = (cells, size, letters, args, tick) => {
    if (tick === 0 || size !== levelsSize) levels = new Map()
    levelsSize = size
    letters.forEach((letter, i) => {
        if (letter.toLowerCase() !== "o") {
            levels.delete(i)
            return
        }
        const level = levels.get(i) ?? { amp: 100, dur: 0.5 }
        levels.set(i, level)
        const [note, amp, dur] = outSquares(i, directionOf(args[i]), size).map(square => arriving(cells[square]))
        if (amp?.length) level.amp = toMidi(amp[0])
        if (dur?.length && dur[0] > 0) level.dur = dur[0]
        if (!note?.length) return
        const notes = note.map(toMidi)
        playNote(Number(argument(device, args[i]?.[0])), Number(argument(channel, args[i]?.[1])), notes, level.amp, level.dur)
        printLine(`${notes.join(", ")} ${level.amp} ${level.dur}s`, OUT_COLOR)
    })
    return cells
}

// The notes are played by sendNotes in the rules chain, as an out reads
// three squares, and the rule for the square itself leaves the cell alone
export const out: Operation = {
    name: "out",
    about: about.out.about,
    params: [device, channel, heading],
    rule: () => cell => cell,
}
