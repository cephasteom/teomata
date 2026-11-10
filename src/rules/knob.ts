import type { CellRule, Operation, Param } from "./_types"
import { BANG } from "../lib/utils"
import { emit } from "./_events"
import { channelParam, deviceParam, isMoving, isWhole } from "./_shared"
import { toMidi } from "./note"
import { about } from "./_instructions"

// Sends each number that arrives as a MIDI CC message on the device, channel
// and controller. An array sends its first number. Bangs are ignored, and
// every moving cell is absorbed
const createKnob = (device: number, channel: number, controller: number): CellRule => cell => {
    const { value } = cell
    if (!isMoving(cell)) return cell
    if (value === BANG) return {}
    const first = Array.isArray(value) ? value[0] : value!
    if (first !== undefined) emit({ type: "cc", device, channel, controller, value: toMidi(first) })
    return {}
}

const controller: Param = {
    name: "cc",
    about: about.k.params.cc,
    fallback: "1",
    accepts: text => isWhole(text) && Number(text) <= 127,
}

export const knob: Operation = {
    name: "knob",
    kind: "destination",
    about: about.k.about,
    params: [controller, deviceParam(about.k.params.device), channelParam(about.k.params.channel)],
    label: controller => `cc${controller}`,
    rule: (controller, device, channel) => createKnob(Number(device), Number(channel), Number(controller)),
}
