import type { Operation, Kind } from "./_types"
import { modeParam, destinationModeParam } from "./_shared"
import { rotate } from "./rotate"
import { die } from "./die"
import { entangle } from "./entangle"
import { bang, bangGenerator } from "./bang"
import { value, valueGenerator } from "./value"
import { harmony } from "./harmony"
import { array } from "./array"
import { count } from "./count"
import { gate } from "./gate"
import { math } from "./math"
import { logic } from "./logic"
import { loop } from "./loop"
import { print } from "./print"
import { note } from "./note"
import { knob } from "./knob"
import { wave, waveGenerator } from "./wave"
import { scale } from "./scale"
import { quantize } from "./quantize"
import { tempo } from "./tempo"

const withMode = (operation: Operation): Operation => ({
    ...operation,
    params: [...operation.params, operation.kind === "destination" ? destinationModeParam : modeParam],
})

const mapValues = <A, B>(record: Record<string, A>, f: (a: A) => B): Record<string, B> =>
    Object.fromEntries(Object.entries(record).map(([key, a]) => [key, f(a)]))

// Case matters: a generator may share its letter with an operator
const operations = mapValues({
    B: bangGenerator,
    V: valueGenerator,
    W: waveGenerator,
    a: array,
    b: bang,
    c: count,
    d: die,
    e: entangle,
    g: gate,
    h: harmony,
    l: logic,
    m: math,
    o: loop,
    p: print,
    q: quantize,
    r: rotate,
    s: scale,
    t: tempo,
    v: value,
    w: wave,
    k: knob,
    n: note,
}, withMode)

export const operationFor = (letter: string): Operation | undefined =>
    Object.hasOwn(operations, letter) ? operations[letter] : undefined

export const kindOf = (letter: string) => operationFor(letter)?.kind

const kinds: Kind[] = ["generator", "operator", "destination"]

export const instructions = Object.entries(operations)
    .sort(([a, x], [b, y]) => kinds.indexOf(x.kind) - kinds.indexOf(y.kind) || a.localeCompare(b))
    .map(([letter, { name, kind, about, params, rest }]) => ({ letter, name, kind, about, params, rest }))
