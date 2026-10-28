import { toNumber } from "../lib/utils"
import type { CellRule, Operation, Param } from "./types"
import { isMoving, isNumber } from "./shared"
import { about } from "./instructions"

const rangeParam = (name: string, about: string, fallback: string): Param => ({ name, about, fallback, accepts: isNumber })

// Maps each value arriving from inLo to inHi onto lo to hi, keeping its
// direction. An array value has each of its numbers mapped, and a bang
// counts as a 1. Values outside the input range carry on past the output's
// ends, and when inLo and inHi are the same the value is left as it was
const createScale = (lo: number, hi: number, inLo: number, inHi: number): CellRule => cell => {
    if (!isMoving(cell)) return cell
    const map = (value: number) => {
        const result = lo + (value - inLo) / (inHi - inLo) * (hi - lo)
        return Number.isFinite(result) ? result : value
    }
    return { ...cell, value: Array.isArray(cell.value) ? cell.value.map(map) : map(toNumber(cell.value!)) }
}

export const scale: Operation = {
    name: "scale",
    kind: "operator",
    about: about.s.about,
    params: [
        rangeParam("outLo", about.s.params.outLo, "0"),
        rangeParam("outHi", about.s.params.outHi, "127"),
        rangeParam("inLo", about.s.params.inLo, "0"),
        rangeParam("inHi", about.s.params.inHi, "1"),
    ],
    rule: (lo, hi, inLo, inHi) => createScale(Number(lo), Number(hi), Number(inLo), Number(inHi)),
}
