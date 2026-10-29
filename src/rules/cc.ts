import type { CellRule, Operation, Param } from "./types"
import { BANG } from "../lib/utils"
import { emit } from "./events"
import { channelParam, deviceParam, isMoving, isWhole } from "./shared"
import { toMidi } from "./note"
import { about } from "./instructions"

// Sends each number that arrives as a MIDI CC message on the device, channel
// and controller. An array sends its first number. Bangs are ignored, and
// every moving cell is absorbed
const createCc = (device: number, channel: number, controller: number): CellRule => cell => {
    const { value } = cell
    if (!isMoving(cell)) return cell
    if (value === BANG) return {}
    const first = Array.isArray(value) ? value[0] : value!
    if (first !== undefined) emit({ type: "cc", device, channel, controller, value: toMidi(first) })
    return {}
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
    params: [controller, deviceParam(about.c.params.device), channelParam(about.c.params.channel)],
    label: controller => `cc${controller}`,
    rule: (controller, device, channel) => createCc(Number(device), Number(channel), Number(controller)),
}
