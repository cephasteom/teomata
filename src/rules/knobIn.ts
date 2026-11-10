import type { CellRule, Operation } from "./_types"
import { aim, headingOf, type heading } from "../lib/utils"
import { channelParam, deviceParam, directionParam } from "./_shared"
import { controller } from "./knob"
import { controlsHeard, createDelay, lookaheadParam } from "./_midiIn"
import type { ControlIn } from "../lib/midi"
import { about } from "./_instructions"

// Puts out the latest value of the MIDI controller due on the tick, so a knob
// turning puts out at most one cell a tick, and none while it's still
const createKnobIn = (controller: number, device: number, channel: number, to: heading, lookahead: number): CellRule => {
    const { take, keep, carry, stop } = createDelay<ControlIn>(lookahead)
    const rule: CellRule = (_, tick) => {
        const latest = take(controlsHeard(device, channel, controller), tick).at(-1)
        return latest ? { value: latest.value, ...aim(to) } : {}
    }
    return Object.assign(rule, { keep, carry, stop })
}

export const knobIn: Operation = {
    name: "knob",
    kind: "generator",
    about: about.K.about,
    params: [
        { ...controller, about: about.K.params.cc },
        deviceParam(about.K.params.device),
        channelParam(about.K.params.channel),
        lookaheadParam(about.K.params.lookahead),
        directionParam(about.K.params.direction),
    ],
    label: controller => `K${controller}`,
    rule: (controller, device, channel, lookahead, to) =>
        createKnobIn(Number(controller), Number(device), Number(channel), headingOf(to) as heading, Number(lookahead)),
}
