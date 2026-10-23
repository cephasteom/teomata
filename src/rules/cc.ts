import type { CellRule, Operation, Param } from "./types"
import { BANG } from "../lib/utils"
import { sendControl } from "../lib/midi"
import { printLine } from "../stores/console"
import { channelParam, deviceParam, isMoving, isWhole } from "./shared"
import { toMidi } from "./note"
import { about } from "./instructions"

// Sends each number that arrives as a MIDI CC message on the device, channel
// and controller, printing it to the console. An array sends its first
// number. Bangs are ignored, and the cell is left alone
const createCc = (device: number, channel: number, controller: number): CellRule => cell => {
    const { value } = cell
    if (!isMoving(cell) || value === BANG) return cell
    const first = Array.isArray(value) ? value[0] : value!
    if (first === undefined) return cell
    const n = toMidi(first)
    sendControl(device, channel, controller, n)
    printLine(`cc${controller}: ${n}`, "var(--cell-output)")
    return cell
}

const controller: Param = {
    name: "cc",
    about: about.c.params.cc,
    fallback: "1",
    accepts: text => isWhole(text) && Number(text) <= 127,
}

export const cc: Operation = {
    name: "cc",
    kind: "output",
    about: about.c.about,
    params: [deviceParam(about.c.params.device), channelParam(about.c.params.channel), controller],
    label: (_, __, controller) => `cc${controller}`,
    rule: (device, channel, controller) => createCc(Number(device), Number(channel), Number(controller)),
}
