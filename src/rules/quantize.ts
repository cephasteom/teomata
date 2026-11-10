import type { CellRule, Operation } from "./_types"
import { BANG } from "../lib/utils"
import { MAX_Q, MIN_Q } from "../stores/global"
import { about } from "./_instructions"
import { emit } from "./_events"
import { isMoving } from "./_shared"

// Sets the global q to each number that arrives, rounded and clamped. An
// array sets its first number. Bangs are ignored, and every moving cell is absorbed
const createQuantize = (): CellRule => cell => {
    const { value } = cell
    if (!isMoving(cell)) return cell
    if (value === BANG) return {}
    const first = Array.isArray(value) ? value[0] : value
    if (first === undefined || !Number.isFinite(first)) return {}
    emit({ type: "q", value: Math.min(MAX_Q, Math.max(MIN_Q, Math.round(first))) })
    return {}
}

export const quantize: Operation = {
    name: "q",
    kind: "destination",
    about: about.q.about,
    params: [],
    rule: createQuantize,
}
