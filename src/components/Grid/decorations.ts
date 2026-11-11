// What the grid draws on and around squares besides the cells: operation
// labels, input labels, and the borders and outlines of operations
import type { Expansion } from "../../stores/operations"
import { inputSquares } from "../../stores/operations"
import { argsFor, kindOf, labelFor, resolveEntangled } from "../../rules"
import type { Input } from "../../rules/_types"
import { shortened } from "../../lib/arithmetic"
import { boundsOf, type Rect } from "../../lib/utils"

export type Border = { color: string, thru: boolean }
export type Outline = Border & Rect & { i: number }
export type InputLabel = { text: string, off: boolean }

const OFF_COLOR = 'var(--cell-off)'
const KIND_COLORS: Partial<Record<string, string>> = {
  generator: 'var(--cell-generator)',
  destination: 'var(--cell-destination)',
}
const kindColor = (letter: string) => KIND_COLORS[kindOf(letter) ?? '']

// The label each square shows. An entangled square shows its source's label,
// so `labelSources[i]` is the square whose label i shows
export const labelSourcesFor = (operations: string[], args: string[][]) =>
  operations.map((_, i) => resolveEntangled(i, operations, args))

export const labelsFor = (
  operations: string[], args: string[][], expansions: (Expansion | null)[], labelSources: number[],
) => {
  const own = operations.map((letter, i) => letter ? labelFor(i, letter, args[i], !!expansions[i]) : "")
  return labelSources.map(source => own[source])
}

// Generators and destinations without inputs get a border of their own;
// those with inputs are outlined together with them instead. An entangled
// square takes the border of its source, off when either is off
export const squareBordersFor = (
  operations: string[], modes: string[], expansions: (Expansion | null)[], labelSources: number[],
) => {
  const borders = new Map<number, Border>()
  operations.forEach((letter, i) => {
    const source = labelSources[i]
    const color = letter && kindColor(operations[source])
    if (!color || expansions[i]) return
    const off = modes[i] === 'off' || modes[source] === 'off'
    borders.set(i, { color: off ? OFF_COLOR : color, thru: modes[source] === 'thru' })
  })
  return borders
}

// One outline round each operation and its inputs. Operators, having no
// colour of their own, are outlined in the cells' colour
export const inputOutlinesFor = (
  operations: string[], modes: string[], expansions: (Expansion | null)[],
): Outline[] => expansions.flatMap((expansion, i) => {
  if (!expansion) return []
  const color = modes[i] === 'off' ? OFF_COLOR : kindColor(operations[i]) ?? 'var(--cell-alive)'
  const area = boundsOf([i, ...inputSquares(i, expansion)])
  return [{ i, color, thru: modes[i] === 'thru', ...area }]
})

// Each input square shows the current value of the argument it sets
export const inputLabelsFor = (
  inputs: Map<number, Input>, operations: string[], args: string[][], modes: string[],
) => new Map([...inputs].map(([square, { owner, k }]): [number, InputLabel] => {
  const text = shortened(argsFor(operations[owner], args[owner])[k] ?? '')
  return [square, { text, off: modes[owner] === 'off' }]
}))
