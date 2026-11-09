import type { CellRule, Operation } from "./types"
import { BANG } from "../lib/utils"
import { MAX_CPS, MIN_CPS } from "../stores/global"
import { about } from "./instructions"
import { emit } from "./events"
import { isMoving } from "./shared"

// Sets the global cps to each number that arrives, clamped. An array sets
// its first number. Bangs are ignored, and every moving cell is absorbed
const createTempo = (): CellRule => cell => {
    const { value } = cell
    if (!isMoving(cell)) return cell
    if (value === BANG) return {}
    const first = Array.isArray(value) ? value[0] : value
    if (first === undefined || !Number.isFinite(first)) return {}
    emit({ type: "cps", value: Math.min(MAX_CPS, Math.max(MIN_CPS, first)) })
    return {}
}

export const tempo: Operation = {
    name: "tempo",
    kind: "destination",
    about: about.t.about,
    params: [],
    rule: createTempo,
}
