import { move } from "./move"
import { step } from "./_tick"

export { instructions, kindOf } from "./_registry"
export { paramsFor, argsFor, modeOf, shownArgsFor, inputParamsFor, entangledWith, resolveEntangled } from "./_args"
export { labelFor, stopRules } from "./_ruleCache"

// Run in order on each tick, by stores/cells.ts
export const rules = [move, step]
