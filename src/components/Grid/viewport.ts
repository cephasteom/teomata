// Scrolling and zooming the viewport onto the grid. Positions are in
// squares from the grid's top left, unless they're a `Point` in pixels
import { flushSync } from "svelte"
import { get } from "svelte/store"
import { MIN_ZOOM, MAX_ZOOM, zoom } from "../../stores/global"
import { cursor } from "../../stores/cursor"
import { toXY } from "../../lib/utils"

export type Point = { x: number, y: number }
export type Viewport = ReturnType<typeof createViewport>

// Squares per side that the zoom keys step through
const ZOOM_LEVELS = [4, 6, 8, 12, 16, 24, 32, 48, 64]

export const clampZoom = (squares: number) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, squares))

export const createViewport = (viewport: () => HTMLElement, grid: () => HTMLElement) => {
  // Measured between the first two squares, as gridlines are fractions of a pixel
  const squarePitch = () => {
    const [a, b] = grid().children
    return b.getBoundingClientRect().left - a.getBoundingClientRect().left
  }

  // Fractional mid-drag
  const topLeftSquare = (): Point => {
    const pitch = squarePitch()
    return { x: viewport().scrollLeft / pitch, y: viewport().scrollTop / pitch }
  }

  // Rounded so the viewport's edges always fall on gridlines
  const scrollToSquare = (x: number, y: number, behavior: ScrollBehavior = 'instant') => {
    const pitch = squarePitch()
    viewport().scrollTo({ left: Math.round(x) * pitch, top: Math.round(y) * pitch, behavior })
  }

  // Scrolls as few squares as it takes to bring square i into view
  const reveal = (i: number) => {
    const { x, y } = toXY(i)
    const from = topLeftSquare()
    const shown = get(zoom)
    const fit = (to: number, at: number) => Math.min(Math.max(Math.round(at), to - shown + 1), to)
    scrollToSquare(fit(x, from.x), fit(y, from.y))
  }

  // Snaps to whole squares after a scroll or drag ends. Browsers round scrolling
  // to device pixels, so near enough counts as aligned
  const settle = () => {
    const { x, y } = topLeftSquare()
    const off = (n: number) => Math.abs(n - Math.round(n)) > 0.02
    if (off(x) || off(y)) scrollToSquare(x, y, 'smooth')
  }

  // A point on the page, relative to the viewport
  const toViewport = (clientX: number, clientY: number): Point => {
    const { left, top } = viewport().getBoundingClientRect()
    return { x: clientX - left, y: clientY - top }
  }

  // The centre of the cursor's square, or null when it's out of view
  const cursorPoint = (): Point | null => {
    const { clientWidth, clientHeight } = viewport()
    const { x, y } = toXY(get(cursor))
    const from = topLeftSquare()
    const pitch = squarePitch()
    const point = { x: (x + 0.5 - from.x) * pitch, y: (y + 0.5 - from.y) * pitch }
    const inView = point.x >= 0 && point.x <= clientWidth && point.y >= 0 && point.y <= clientHeight
    return inView ? point : null
  }

  // Zooms to `squares` per side, keeping the grid still under `at`: by default
  // the cursor when it's in view, or else the viewport's middle
  const zoomTo = (squares: number, at?: Point) => {
    squares = Math.round(clampZoom(squares))
    if (squares === get(zoom)) return
    const aroundCursor = !at
    const { clientWidth, clientHeight } = viewport()
    at ??= cursorPoint() ?? { x: clientWidth / 2, y: clientHeight / 2 }

    const from = topLeftSquare()
    const before = squarePitch()
    const fixed = { x: from.x + at.x / before, y: from.y + at.y / before }
    // Resize the grid now, so the scroll below measures against its new size
    flushSync(() => zoom.set(squares))
    const after = squarePitch()
    scrollToSquare(fixed.x - at.x / after, fixed.y - at.y / after)
    // Rounding to whole squares can push the cursor's square half out of view
    if (aroundCursor) reveal(get(cursor))
  }

  const zoomIn = () => zoomTo(ZOOM_LEVELS.findLast(level => level < get(zoom)) ?? MIN_ZOOM)
  const zoomOut = () => zoomTo(ZOOM_LEVELS.find(level => level > get(zoom)) ?? MAX_ZOOM)

  return { reveal, settle, toViewport, zoomTo, zoomIn, zoomOut }
}
