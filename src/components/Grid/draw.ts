// Paints the grid onto a canvas covering the viewport: the squares, their
// labels, and the borders, outlines, selection and cursor round them. Only
// the squares in view are drawn, so a tick costs the same at any zoom
import type { Cell } from "../../stores/cells"
import { SIZE } from "../../stores/global"
import type { Rect } from "../../lib/utils"
import type { Border, InputLabel, Outline } from "./decorations"

export type Scene = {
  cells: Cell[]
  operations: string[]
  modes: string[]
  labels: string[]
  labelSources: number[]
  borders: Map<number, Border>
  outlines: Outline[]
  inputLabels: Map<number, InputLabel>
  argCells: Map<number, { text: string, valid: boolean }>
  editing: number | null
  shownSquare: number | null
  openArea: Rect | null
  cursor: number
  bounds: Rect
  focused: boolean
}

// Sizes in CSS pixels: the distance from one square to the next, the
// gridlines' thickness, the root font size, and the visible part of the grid
export type View = {
  pitch: number, line: number, rem: number,
  scrollX: number, scrollY: number, width: number, height: number, dpr: number,
}

// Colours are given as CSS values, often `var(--x)`, and looked up once
const colors = new Map<string, string>()
export const resetColors = () => colors.clear()
const color = (value: string) => {
  let resolved = colors.get(value)
  if (resolved === undefined) {
    const name = value.match(/^var\((--[\w-]+)\)$/)?.[1]
    resolved = name ? getComputedStyle(document.documentElement).getPropertyValue(name).trim() : value
    colors.set(value, resolved)
  }
  return resolved
}

// The width of the 2px borders, outlines and dashes
const STROKE = 2

type Box = [x0: number, y0: number, x1: number, y1: number]

export const drawGrid = (ctx: CanvasRenderingContext2D, scene: Scene, view: View) => {
  const { dpr } = view
  // Everything is worked out in device pixels, with each square's edges
  // rounded so every gridline is the same whole number of pixels
  const P = view.pitch * dpr
  const L = Math.max(1, Math.round(view.line * dpr))
  const S = Math.max(1, Math.round(STROKE * dpr))
  const ox = Math.round(view.scrollX * dpr)
  const oy = Math.round(view.scrollY * dpr)
  const edge = (n: number) => Math.round(n * P)

  // The squares of a rectangle, and the same reaching one gridline further out
  // all round, which recolours the gridlines round it
  const inner = ({ x1, x2, y1, y2 }: Rect): Box => [edge(x1) + L, edge(y1) + L, edge(x2 + 1), edge(y2 + 1)]
  const outer = ({ x1, x2, y1, y2 }: Rect): Box => [edge(x1), edge(y1), edge(x2 + 1) + L, edge(y2 + 1) + L]
  const one = (i: number): Rect => {
    const x = i % SIZE, y = Math.floor(i / SIZE)
    return { x1: x, x2: x, y1: y, y2: y }
  }

  const fill = ([x0, y0, x1, y1]: Box, fillColor: string) => {
    ctx.fillStyle = color(fillColor)
    ctx.fillRect(x0 - ox, y0 - oy, x1 - x0, y1 - y0)
  }
  // A band of `width` inside the box, dashed or solid
  const ring = ([x0, y0, x1, y1]: Box, width: number, ringColor: string, dashed = false) => {
    if (dashed) {
      ctx.strokeStyle = color(ringColor)
      ctx.lineWidth = width
      ctx.setLineDash([width * 2, width * 2])
      ctx.strokeRect(x0 - ox + width / 2, y0 - oy + width / 2, x1 - x0 - width, y1 - y0 - width)
      ctx.setLineDash([])
      return
    }
    fill([x0, y0, x1, y0 + width], ringColor)
    fill([x0, y1 - width, x1, y1], ringColor)
    fill([x0, y0, x0 + width, y1], ringColor)
    fill([x1 - width, y0, x1, y1], ringColor)
  }

  const { cells, operations, modes, labels, labelSources, borders, outlines, inputLabels, argCells,
    editing, shownSquare, openArea, cursor, bounds, focused } = scene
  const isEditing = editing !== null
  const editingOff = isEditing && modes[editing] === 'off'
  const hidden = (i: number) => isEditing && i !== shownSquare && !argCells.has(i)

  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)

  // The background showing through the gaps draws the gridlines. While
  // arguments are open only their squares show, over a backdrop of gridlines
  if (!isEditing) fill([0, 0, edge(SIZE) + L, edge(SIZE) + L], 'var(--grid-line)')

  // Layers under the squares, colouring the gridlines round them. Later ones
  // paint over earlier, so the selection's colour wins
  for (const [i, { color: borderColor, thru }] of borders) {
    // A dashed border leaves its gridlines alone, so the gaps show
    if (!thru) fill(outer(one(i)), borderColor)
  }
  for (const { color: outlineColor, thru, ...area } of outlines) {
    // Only the lines round the outline, not those between its squares
    if (!thru) ring(outer(area), L, outlineColor)
  }
  if (openArea) fill(outer(openArea), 'var(--grid-line)')
  if (focused) fill(outer(bounds), 'var(--cell-cursor)')

  // The squares in view
  const cw = ctx.canvas.width, ch = ctx.canvas.height
  const xFrom = Math.max(0, Math.floor(ox / P)), xTo = Math.min(SIZE - 1, Math.floor((ox + cw) / P))
  const yFrom = Math.max(0, Math.floor(oy / P)), yTo = Math.min(SIZE - 1, Math.floor((oy + ch) / P))
  // Three letters fill a square at the text's full size; longer text shrinks to fit
  const textSize = Math.min((view.pitch - view.line) * 0.45, view.rem) * 0.8 * dpr
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'

  const text = (box: Box, value: string, length: number, style: string, textColor: string) => {
    const [x0, y0, x1, y1] = box
    const size = textSize * Math.min(1, 3 / length)
    ctx.font = `${style}${size}px ui-monospace, monospace`
    ctx.fillStyle = color(textColor)
    const cx = (x0 + x1) / 2 - ox, cy = (y0 + y1) / 2 - oy
    if (ctx.measureText(value).width <= x1 - x0) {
      ctx.fillText(value, cx, cy)
      return
    }
    ctx.save()
    ctx.beginPath()
    ctx.rect(x0 - ox, y0 - oy, x1 - x0, y1 - y0)
    ctx.clip()
    ctx.fillText(value, cx, cy)
    ctx.restore()
  }

  for (let y = yFrom; y <= yTo; y++) {
    for (let x = xFrom; x <= xTo; x++) {
      const i = y * SIZE + x
      if (hidden(i)) continue
      const box = inner(one(i))
      const arg = argCells.get(i)
      const alive = cells[i].value !== undefined && !arg
      fill(box, alive ? 'var(--cell-alive)' : 'var(--cell-empty)')

      const border = borders.get(i)
      if (border) ring(box, S, border.color, border.thru)

      const plain = alive ? 'var(--cell-empty)' : 'var(--cell-alive)'
      const shade = (off: boolean) => off ? 'var(--cell-off)' : plain
      const input = inputLabels.get(i)
      if (arg) {
        text(box, arg.text, Math.max(1, arg.text.length), '', arg.valid ? shade(editingOff) : 'var(--cell-cursor)')
      } else if (isEditing && i === shownSquare) {
        text(box, operations[editing], 1, 'bold ', shade(editingOff))
      } else if (operations[i]) {
        // A rotate, or a square entangled with one, is italic. A square
        // entangled with an operation that's off is shown off too
        const style = operations[labelSources[i]] === 'r' ? 'italic bold ' : 'bold '
        const off = modes[i] === 'off' || modes[labelSources[i]] === 'off'
        text(box, labels[i], labels[i].length, style, shade(off))
      } else if (input) {
        text(box, input.text, Math.max(1, input.text.length), '', shade(input.off))
      }
    }
  }

  // Outlines go over the squares, whatever they hold
  for (const { color: outlineColor, thru, ...area } of outlines) ring(inner(area), S, outlineColor, thru)

  // The cursor's ring covers the gridlines too, as an outline crosses them
  // between an operation and its inputs
  if (focused) ring(outer(one(cursor)), S + L, 'var(--cell-cursor)')
}
