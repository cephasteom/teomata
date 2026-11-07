import { get } from "svelte/store"
import { cps, q, SIZE, MIN_CPS, MAX_CPS, MIN_Q, MAX_Q } from "./global"
import { operations, args, expansions, fitExpansions, type Expansion } from "./operations"
import { change } from "./history"
import { clearCells } from "./cells"
import { printLine } from "./console"
import { inRange, isExpansion } from "./persist"
import { kindOf } from "../rules"

// A patch is the grid's operations, their arguments and inputs, with the tempo
// and quantize, saved as a text file of JSON. Only squares with an operation
// are written, each with its column and row. The cells moving over the grid
// aren't part of it

type Square = { x: number, y: number, operation: string, args?: string[], inputs?: Expansion }

type Patch = { teomata: number, cps: number, q: number, squares: Square[] }

const VERSION = 1

// The name the patch was last saved or opened under, offered again on save
let name = "patch.txt"

// The patch as text, a square to a line so it reads and diffs well
const write = () => {
    const [$operations, $args, $expansions] = [get(operations), get(args), get(expansions)]
    const squares: Square[] = []
    $operations.forEach((operation, i) => {
        if (!operation) return
        const square: Square = { x: i % SIZE, y: Math.floor(i / SIZE), operation }
        if ($args[i].length) square.args = $args[i]
        if ($expansions[i]) square.inputs = $expansions[i]!
        squares.push(square)
    })
    const lines = squares.map(square => "    " + JSON.stringify(square))
    return [
        "{",
        `  "teomata": ${VERSION},`,
        `  "cps": ${JSON.stringify(get(cps))},`,
        `  "q": ${JSON.stringify(get(q))},`,
        `  "squares": [${lines.length ? "\n" + lines.join(",\n") + "\n  " : ""}]`,
        "}",
        "",
    ].join("\n")
}

const isSquare = (s: unknown): s is Square => {
    if (typeof s !== "object" || s === null) return false
    const { x, y, operation, args, inputs } = s as Record<string, unknown>
    const onGrid = (n: unknown) => typeof n === "number" && Number.isInteger(n) && n >= 0 && n < SIZE
    return onGrid(x) && onGrid(y) &&
        typeof operation === "string" && kindOf(operation) !== undefined &&
        (args === undefined || (Array.isArray(args) && args.every(a => typeof a === "string"))) &&
        (inputs === undefined || (inputs !== null && isExpansion(inputs)))
}

// The patch in the text, or a reason it can't be read
const read = (text: string): Patch | string => {
    let data: unknown
    try {
        data = JSON.parse(text)
    } catch {
        return "it isn't a teomata patch"
    }
    if (typeof data !== "object" || data === null || !("teomata" in data)) return "it isn't a teomata patch"
    const patch = data as Record<string, unknown>
    if (typeof patch.teomata !== "number" || patch.teomata > VERSION) return "it was saved by a newer teomata"
    if (!inRange(patch.cps, MIN_CPS, MAX_CPS)) return `its cps isn't from ${MIN_CPS} to ${MAX_CPS}`
    if (!inRange(patch.q, MIN_Q, MAX_Q) || !Number.isInteger(patch.q)) return `its q isn't a whole number from ${MIN_Q} to ${MAX_Q}`
    if (!Array.isArray(patch.squares)) return "it has no squares"
    const bad = patch.squares.findIndex(s => !isSquare(s))
    if (bad >= 0) return `square ${bad + 1} isn't an operation on the grid`
    return patch as Patch
}

// Puts the patch on the grid in place of what's there, as one change that can
// be undone, and empties the cells
const load = (patch: Patch) => {
    cps.set(patch.cps)
    q.set(patch.q)
    change(() => {
        const $operations: string[] = Array.from({ length: SIZE * SIZE }, () => "")
        const $args: string[][] = Array.from({ length: SIZE * SIZE }, () => [])
        const $expansions: (Expansion | null)[] = Array.from({ length: SIZE * SIZE }, () => null)
        for (const square of patch.squares) {
            const i = square.y * SIZE + square.x
            $operations[i] = square.operation
            $args[i] = square.args ?? []
            $expansions[i] = square.inputs ?? null
        }
        operations.set($operations)
        args.set($args)
        expansions.set($expansions)
        fitExpansions()
    })
    clearCells()
}

// The browser's own file pickers, where it has them, which can save to a file
// chosen by the user rather than to the downloads
type Handle = { name: string, getFile: () => Promise<File>, createWritable: () => Promise<{ write: (text: string) => Promise<void>, close: () => Promise<void> }> }
type PickerOptions = { suggestedName?: string, types?: { description: string, accept: Record<string, string[]> }[] }
type Pickers = {
    showSaveFilePicker?: (options: PickerOptions) => Promise<Handle>
    showOpenFilePicker?: (options: PickerOptions) => Promise<Handle[]>
}
const pickers = window as unknown as Pickers
const types = [{ description: "Teomata patch", accept: { "text/plain": [".txt"] } }]

// A cancelled picker throws an AbortError, which is no failure
const cancelled = (error: unknown) => error instanceof DOMException && error.name === "AbortError"

// Saves the patch to a file the user picks, or downloads it where the
// browser can't pick one
export const savePatch = async () => {
    const text = write()
    if (pickers.showSaveFilePicker) {
        try {
            const handle = await pickers.showSaveFilePicker({ suggestedName: name, types })
            const writable = await handle.createWritable()
            await writable.write(text)
            await writable.close()
            name = handle.name
            printLine(`saved ${name}`)
        } catch (error) {
            if (!cancelled(error)) printLine(`couldn't save ${name}`)
        }
        return
    }
    const link = document.createElement("a")
    link.href = URL.createObjectURL(new Blob([text], { type: "text/plain" }))
    link.download = name
    link.click()
    URL.revokeObjectURL(link.href)
}

const open = async (file: File) => {
    const patch = read(await file.text())
    if (typeof patch === "string") {
        printLine(`couldn't open ${file.name}: ${patch}`)
        return
    }
    load(patch)
    name = file.name
    printLine(`opened ${name}`)
}

// Opens a patch from a file the user picks
export const openPatch = async () => {
    if (pickers.showOpenFilePicker) {
        try {
            const [handle] = await pickers.showOpenFilePicker({ types })
            await open(await handle.getFile())
        } catch (error) {
            if (!cancelled(error)) printLine("couldn't open the file")
        }
        return
    }
    const input = document.createElement("input")
    input.type = "file"
    input.accept = ".txt,text/plain"
    input.onchange = () => {
        const file = input.files?.[0]
        if (file) open(file)
    }
    input.click()
}
