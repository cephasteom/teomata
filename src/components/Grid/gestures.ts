// Zooming and panning the viewport by trackpad, wheel and touch. Attach to
// the viewport with {@attach gestures(view)}.
//
// - ctrl+wheel (which is also how trackpad pinches arrive) zooms about the pointer
// - Safari pinches with its own gesture events instead
// - one finger drags the grid; two pinch-zoom while dragging
// - mice and pens click and scroll as usual
import { on } from "svelte/events"
import { get } from "svelte/store"
import { DEFAULT_ZOOM, zoom } from "../../stores/global"
import { clampZoom, type Point, type Viewport } from "./viewport"

// How far a finger moves before a tap becomes a drag, in pixels
const DRAG_THRESHOLD = 8

type GestureEvent = Event & { scale: number, clientX: number, clientY: number }

export const gestures = (view: Viewport) => (node: HTMLElement) => {
  // Kept fractional between whole squares, so small wheel turns add up
  let wheelZoom = DEFAULT_ZOOM
  let gestureStartZoom = DEFAULT_ZOOM

  const fingers = new Map<number, Point>()
  let pinch: { spread: number, zoom: number } | null = null
  let dragStart: Point = { x: 0, y: 0 }
  let isDrag = false

  const fingerPair = () => [...fingers.values()]
  const fingerMidpoint = (): Point => {
    const [a, b] = fingerPair()
    return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }
  }
  const fingerSpread = () => {
    const [a, b] = fingerPair()
    return Math.hypot(a.x - b.x, a.y - b.y)
  }

  const onWheel = (event: WheelEvent) => {
    if (!event.ctrlKey) return
    event.preventDefault()
    // Catch up when the zoom has changed some other way
    if (Math.round(wheelZoom) !== get(zoom)) wheelZoom = get(zoom)
    const delta = Math.max(-25, Math.min(25, event.deltaY))
    wheelZoom = clampZoom(wheelZoom * Math.exp(delta * 0.01))
    view.zoomTo(wheelZoom, view.toViewport(event.clientX, event.clientY))
  }

  const onGestureStart = (event: Event) => {
    event.preventDefault()
    gestureStartZoom = get(zoom)
  }

  const onGestureChange = (event: Event) => {
    event.preventDefault()
    const { scale, clientX, clientY } = event as GestureEvent
    // On a touch screen the fingers are followed instead
    if (!fingers.size) view.zoomTo(gestureStartZoom / scale, view.toViewport(clientX, clientY))
  }

  const onScrollEnd = () => {
    if (!fingers.size) view.settle()
  }

  const onPointerDown = (event: PointerEvent) => {
    if (event.pointerType !== 'touch') {
      isDrag = false
      return
    }
    const point = { x: event.clientX, y: event.clientY }
    fingers.set(event.pointerId, point)
    if (fingers.size === 1) {
      dragStart = point
      isDrag = false
    } else if (fingers.size === 2) {
      pinch = { spread: fingerSpread(), zoom: get(zoom) }
      isDrag = true
    }
  }

  const onPointerMove = (event: PointerEvent) => {
    const last = fingers.get(event.pointerId)
    if (!last) return
    const point = { x: event.clientX, y: event.clientY }
    const from = fingers.size === 2 ? fingerMidpoint() : last
    fingers.set(event.pointerId, point)
    const to = fingers.size === 2 ? fingerMidpoint() : point
    node.scrollLeft += from.x - to.x
    node.scrollTop += from.y - to.y
    if (pinch && fingers.size === 2) {
      view.zoomTo(pinch.zoom * pinch.spread / fingerSpread(), view.toViewport(to.x, to.y))
    } else if (Math.hypot(point.x - dragStart.x, point.y - dragStart.y) > DRAG_THRESHOLD) {
      isDrag = true
    }
  }

  const onPointerUp = (event: PointerEvent) => {
    if (!fingers.delete(event.pointerId)) return
    if (fingers.size < 2) pinch = null
    // For browsers without scrollend
    if (!fingers.size) view.settle()
  }

  // A drag shouldn't also click the square it ends on
  const suppressClickAfterDrag = (event: MouseEvent) => {
    if (!isDrag) return
    event.stopPropagation()
    isDrag = false
  }

  // passive: false so preventDefault can stop the page itself zooming
  const active = { passive: false }
  const disposers = [
    on(node, 'wheel', onWheel, active),
    on(node, 'gesturestart', onGestureStart, active),
    on(node, 'gesturechange', onGestureChange, active),
    on(node, 'scrollend', onScrollEnd),
    on(node, 'pointerdown', onPointerDown),
    on(node, 'pointermove', onPointerMove),
    on(node, 'pointerup', onPointerUp),
    on(node, 'pointercancel', onPointerUp),
    on(node, 'click', suppressClickAfterDrag, { capture: true }),
  ]
  return () => disposers.forEach(dispose => dispose())
}
