import { writable } from "svelte/store"
import type { GridRule } from "../rules/rule"
import { move } from "../rules/move"
import { applyRules } from "../rules"

// Applied in order each tick
export const rules = writable<GridRule[]>([move, applyRules])
