// Key handling for the grid, and for the few keys that work anywhere on the page
import { get } from "svelte/store"
import type { direction } from "../../stores/cells"
import { DEFAULT_ZOOM } from "../../stores/global"
import { cursor, bounds, selection, placeCursor, moveCursor, selectAll, selectionCanMove, moveSelection } from "../../stores/cursor"
import { operations, setOperations, moveOperations, copyOperations, pasteOperations, expand, stepModes } from "../../stores/operations"
import { editing, openArgs, closeArgs, moveArgCursor, typeArg, eraseArg, stepArg } from "../../stores/editing"
import { snapshot, record, change, undo, redo } from "../../stores/history"
import { savePatch, openPatch } from "../../stores/patch"
import { paramsFor, kindOf } from "../../rules"
import { isModeParam } from "../../rules/_shared"
import { toggle } from "../../scheduler"
import { focusControls } from "../../lib/focus"
import { toIndex } from "../../lib/utils"
import type { Viewport } from "./viewport"

const ARROWS: Record<string, direction> = {
  ArrowUp: 'n',
  ArrowDown: 's',
  ArrowRight: 'e',
  ArrowLeft: 'w',
}

// Characters an argument can be typed with, arithmetic included
const ARG_CHARACTER = /^[a-zA-Z0-9.#~+\-*/%^<>=!&|()?]$/

const arrow = (event: KeyboardEvent) => ARROWS[event.key]
const cmd = (event: KeyboardEvent) => event.metaKey || event.ctrlKey
const isEditing = () => get(editing) !== null
const isErase = (event: KeyboardEvent) => event.key === 'Backspace' || event.key === 'Delete'

type Binding = {
  when: (event: KeyboardEvent) => unknown
  run: (event: KeyboardEvent) => void
  // Still swallowed while arguments are open, but does nothing
  notWhileEditing?: boolean
}

// The first binding that matches takes the key, and the page never sees it
const dispatch = (bindings: Binding[], event: KeyboardEvent) => {
  const binding = bindings.find(({ when }) => when(event))
  if (!binding) return false
  event.preventDefault()
  if (!(binding.notWhileEditing && isEditing())) binding.run(event)
  return true
}

const cut = () => {
  copyOperations(get(bounds))
  change(() => setOperations(get(selection), ""))
}

// Pastes at the selection's top left and selects what was pasted
const paste = () => change(() => {
  const { x1, y1 } = get(bounds)
  const pasted = pasteOperations(x1, y1)
  if (!pasted) return
  placeCursor(toIndex(pasted.x1, pasted.y1))
  placeCursor(toIndex(pasted.x2, pasted.y2), true)
})

const EDIT_SHORTCUTS: Record<string, () => void> = {
  a: selectAll,
  c: () => copyOperations(get(bounds)),
  x: cut,
  v: paste,
  z: undo,
  y: redo,
}

const editShortcut = (event: KeyboardEvent) => {
  const key = event.key.toLowerCase()
  return key === 'z' && event.shiftKey ? redo : EDIT_SHORTCUTS[key]
}

const moveSelectedOperations = (direction: direction) => {
  if (!selectionCanMove(direction)) return
  change(() => {
    moveOperations(get(selection), direction)
    moveSelection(direction)
  })
}

// A typed operation opens its arguments when it has any besides its mode. It
// only starts running once they close, and is undone along with them
const typeOperation = (letter: string) => {
  const before = snapshot()
  setOperations(get(selection), letter)
  if (paramsFor(letter).some(param => !isModeParam(param))) openArgs(get(cursor), get(selection), before)
  else record(before)
}

const openArgsAtCursor = () => {
  const square = get(cursor)
  if (paramsFor(get(operations)[square]).length) openArgs(square, get(selection))
}

export const createKeyHandlers = (grid: () => HTMLElement, view: Viewport) => {
  const zoomKeys: Record<string, () => void> = {
    '=': view.zoomIn,
    '+': view.zoomIn,
    '-': view.zoomOut,
    '_': view.zoomOut,
    '0': () => view.zoomTo(DEFAULT_ZOOM),
  }

  // Keys with modifiers. These take the browser's zoom, select all,
  // copy and paste, and work on squares instead
  const modifiedBindings: Binding[] = [
    { when: e => e.key === 'Tab' && !e.shiftKey, run: focusControls },
    { when: e => cmd(e) && !e.altKey && zoomKeys[e.key], run: e => zoomKeys[e.key]() },
    { when: e => cmd(e) && !e.altKey && editShortcut(e), run: e => editShortcut(e)!(), notWhileEditing: true },
    {
      when: e => e.altKey && e.shiftKey && !cmd(e) && arrow(e),
      run: e => change(() => expand(get(cursor), arrow(e))),
      notWhileEditing: true,
    },
    { when: e => e.altKey && !cmd(e) && arrow(e), run: e => moveSelectedOperations(arrow(e)), notWhileEditing: true },
  ]

  const argEditorBindings: Binding[] = [
    { when: e => e.key === 'Enter' || e.key === 'Escape', run: closeArgs },
    // Up and down step through the names an argument takes, such as a direction
    { when: e => arrow(e) === 'n' || arrow(e) === 's', run: e => stepArg(arrow(e) === 'n' ? 1 : -1) },
    { when: arrow, run: e => moveArgCursor(arrow(e)) },
    { when: e => ARG_CHARACTER.test(e.key), run: e => typeArg(e.key) },
    { when: isErase, run: eraseArg },
  ]

  const squareBindings: Binding[] = [
    { when: e => e.key === 'Enter' && e.shiftKey, run: () => change(() => stepModes(get(selection), get(cursor))) },
    { when: e => e.key === 'Enter', run: openArgsAtCursor },
    { when: arrow, run: e => moveCursor(arrow(e), e.shiftKey) },
    { when: e => kindOf(e.key), run: e => typeOperation(e.key) },
    { when: isErase, run: () => change(() => setOperations(get(selection), "")) },
  ]

  const onGridKeydown = (event: KeyboardEvent) => {
    if (dispatch(modifiedBindings, event)) return
    // Leave the rest, like cmd+R, to the browser
    if (cmd(event) || event.altKey) return
    dispatch(isEditing() ? argEditorBindings : squareBindings, event)
  }

  const globalBindings: Binding[] = [
    {
      when: e => e.key === ' ' && !cmd(e) && !e.altKey,
      run: e => { if (!e.repeat) toggle() },
      notWhileEditing: true,
    },
    {
      when: e => cmd(e) && !e.altKey && !e.shiftKey && ['s', 'o'].includes(e.key.toLowerCase()),
      run: e => { if (!e.repeat) (e.key.toLowerCase() === 's' ? savePatch : openPatch)() },
      notWhileEditing: true,
    },
  ]

  // An arrow pressed elsewhere brings focus back to the grid, except in text
  // fields and the console, which use arrows themselves
  const onWindowKeydown = (event: KeyboardEvent) => {
    if (dispatch(globalBindings, event)) return
    const target = event.target
    if (target === grid() || target instanceof HTMLInputElement) return
    if (target instanceof HTMLElement && target.id === 'console') return
    if (arrow(event) && !cmd(event) && !event.altKey) {
      event.preventDefault()
      grid().focus({ preventScroll: true })
    }
  }

  // A focused button clicks on space's keyup, which would play or stop a second time
  const onWindowKeyup = (event: KeyboardEvent) => {
    if (event.key === ' ' && event.target instanceof HTMLButtonElement) event.preventDefault()
  }

  return { onGridKeydown, onWindowKeydown, onWindowKeyup }
}
