<script lang="ts">
  import { onMount, flushSync } from "svelte";
  import { cells, type direction } from "../stores/cells";
  import { SIZE, DEFAULT_ZOOM, MIN_ZOOM, MAX_ZOOM, zoom } from "../stores/global";
  import {
    gridFocused, cursor, bounds, selection, placeCursor, moveCursor, selectAll, selectionCanMove, moveSelection,
  } from "../stores/cursor";
  import {
    operations, args, muted, inputs, expansions, inputSquares, toggleMuted, setOperations, moveOperations,
    copyOperations, pasteOperations, expand,
  } from "../stores/operations";
  import {
    editing, shownSquare, argCells, openArea, openArgs, closeArgs, placeArgCursor, moveArgCursor, typeArg, eraseArg,
    stepArg,
  } from "../stores/editing";
  import { snapshot, record, change, undo, redo } from "../stores/history";
  import { paramsFor, argsFor, kindOf, labelFor } from "../rules";
  import { arrows } from "../lib/utils";
  import { shortened } from "../lib/arithmetic";
  import { toggle } from "../scheduler";

  const keys: Record<string, direction> = {
    ArrowUp: 'n',
    ArrowDown: 's',
    ArrowRight: 'e',
    ArrowLeft: 'w',
  }

  const shortcuts: Record<string, () => void> = {
    a: selectAll,
    c: () => copyOperations($bounds),
    x: () => {
      copyOperations($bounds)
      change(() => setOperations($selection, ""))
    },
    // Pastes from the selection's top left corner and selects what was pasted
    v: () => change(() => {
      const pasted = pasteOperations($bounds.x1, $bounds.y1)
      if (!pasted) return
      placeCursor(pasted.y1 * SIZE + pasted.x1)
      placeCursor(pasted.y2 * SIZE + pasted.x2, true)
    }),
    // Shift+Z redoes, as does Y
    z: () => undo(),
    y: () => redo(),
  }

  let grid: HTMLDivElement
  // The window onto the grid, which scrolls to show the part of it in view
  let scroller: HTMLDivElement

  // How far apart squares are, in pixels, measured between the first two, as
  // the gridlines are fractions of a pixel
  const pitch = () => {
    const [a, b] = grid.children
    return b.getBoundingClientRect().left - a.getBoundingClientRect().left
  }

  // The column and row of the square in the window's top left corner, which
  // may be a fraction of the way across it after a drag
  const corner = () => ({ x: scroller.scrollLeft / pitch(), y: scroller.scrollTop / pitch() })

  // Scrolls the window so the column and row are in its top left corner,
  // rounded to whole squares, so the window's edges always fall on gridlines
  const scrollToSquare = (x: number, y: number, behavior: ScrollBehavior = 'instant') => {
    const size = pitch()
    scroller.scrollTo({ left: Math.round(x) * size, top: Math.round(y) * size, behavior })
  }

  // Scrolls the window by as few squares as it takes to bring the square into view
  const reveal = (i: number) => {
    const [x, y] = [i % SIZE, Math.floor(i / SIZE)]
    const from = corner()
    const fit = (to: number, at: number) => Math.min(Math.max(Math.round(at), to - $zoom + 1), to)
    scrollToSquare(fit(x, from.x), fit(y, from.y))
  }

  // The window follows the cursor, showing as much of the open arguments as
  // fits along with it
  $effect(() => {
    if ($openArea) reveal($openArea.y1 * SIZE + $openArea.x2)
    reveal($cursor)
  })

  // Zooms to show that many squares per side, rounded to whole squares, keeping
  // the grid as still as it can be under a point in the window: the one given,
  // or the cursor's square when it's in view, or else the middle
  const zoomTo = (next: number, at?: { x: number, y: number }) => {
    next = Math.round(Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, next)))
    if (next === $zoom) return
    const { clientWidth, clientHeight } = scroller
    const from = corner()
    const onCursor = !at
    if (!at) {
      const size = pitch()
      const [cx, cy] = [($cursor % SIZE + 0.5 - from.x) * size, (Math.floor($cursor / SIZE) + 0.5 - from.y) * size]
      const inView = cx >= 0 && cx <= clientWidth && cy >= 0 && cy <= clientHeight
      at = inView ? { x: cx, y: cy } : { x: clientWidth / 2, y: clientHeight / 2 }
    }
    // The point, in squares from the grid's top left corner
    const [sx, sy] = [from.x + at.x / pitch(), from.y + at.y / pitch()]
    // The grid takes its new size at once, so the window can scroll against it
    flushSync(() => zoom.set(next))
    const size = pitch()
    scrollToSquare(sx - at.x / size, sy - at.y / size)
    // Rounding to whole squares can push the cursor's square half out of view
    if (onCursor) reveal($cursor)
  }

  // The zoom keys step through these, as squares per side
  const levels = [4, 6, 8, 12, 16, 24, 32, 48, 64]
  const zoomIn = () => zoomTo(levels.findLast(level => level < $zoom - 0.01) ?? MIN_ZOOM)
  const zoomOut = () => zoomTo(levels.find(level => level > $zoom + 0.01) ?? MAX_ZOOM)

  // The page's zoom keys zoom the grid instead while it has focus
  const zoomKeys: Record<string, () => void> = {
    '=': zoomIn,
    '+': zoomIn,
    '-': zoomOut,
    '_': zoomOut,
    '0': () => zoomTo(DEFAULT_ZOOM),
  }

  // A point on the page as a point in the window
  const inWindow = (x: number, y: number) => {
    const { left, top } = scroller.getBoundingClientRect()
    return { x: x - left, y: y - top }
  }

  // Pinching a trackpad, or a wheel with ctrl held, zooms the grid instead of
  // the page, about the pointer. Without ctrl the wheel scrolls the window as usual
  // The zoom the wheel has reached, kept between whole squares so small turns
  // add up, and caught up with the zoom when that has changed some other way
  let wheelZoom = DEFAULT_ZOOM
  const onwheel = (event: WheelEvent) => {
    if (!event.ctrlKey) return
    event.preventDefault()
    if (Math.round(wheelZoom) !== $zoom) wheelZoom = $zoom
    const delta = Math.max(-25, Math.min(25, event.deltaY))
    wheelZoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, wheelZoom * Math.exp(delta * 0.01)))
    zoomTo(wheelZoom, inWindow(event.clientX, event.clientY))
  }

  // Once the window stops scrolling it settles onto the nearest whole
  // squares, apart from while fingers are still dragging it
  const onscrollend = () => {
    if (touches.size) return
    const { x, y } = corner()
    // Browsers round scrolling to device pixels, so near enough is aligned
    const off = (n: number) => Math.abs(n - Math.round(n)) > 0.02
    if (off(x) || off(y)) scrollToSquare(x, y, 'smooth')
  }

  // Fingers on the window, by pointer id, where each was last
  const touches = new Map<number, { x: number, y: number }>()
  // The fingers' spread and the zoom when a pinch started
  let pinch: { spread: number, zoom: number } | null = null
  // Where a lone finger first went down, and whether it has since moved far
  // enough to be a drag rather than a tap
  let pressed = { x: 0, y: 0 }
  let dragged = false

  const middle = () => {
    const [a, b] = [...touches.values()]
    return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }
  }
  const spread = () => {
    const [a, b] = [...touches.values()]
    return Math.hypot(a.x - b.x, a.y - b.y)
  }

  // Safari pinches with its own gesture events rather than the wheel. On a
  // touch screen the fingers are followed instead
  let gestureZoom = DEFAULT_ZOOM
  const ongesturestart = (event: Event) => {
    event.preventDefault()
    gestureZoom = $zoom
  }
  const ongesturechange = (event: Event) => {
    event.preventDefault()
    const { scale, clientX, clientY } = event as Event & { scale: number, clientX: number, clientY: number }
    if (!touches.size) zoomTo(gestureZoom / scale, inWindow(clientX, clientY))
  }

  // Listened to by hand, as they have to be able to stop the page zooming
  onMount(() => {
    const options = { passive: false }
    scroller.addEventListener('wheel', onwheel, options)
    scroller.addEventListener('gesturestart', ongesturestart, options)
    scroller.addEventListener('gesturechange', ongesturechange, options)
    scroller.addEventListener('scrollend', onscrollend)
    return () => {
      scroller.removeEventListener('scrollend', onscrollend)
      scroller.removeEventListener('wheel', onwheel)
      scroller.removeEventListener('gesturestart', ongesturestart)
      scroller.removeEventListener('gesturechange', ongesturechange)
    }
  })

  // One finger drags the grid about, and two pinch to zoom it while dragging
  // it along with them. Mice and pens click and scroll as usual
  const onpointerdown = (event: PointerEvent) => {
    if (event.pointerType !== 'touch') {
      dragged = false
      return
    }
    const point = { x: event.clientX, y: event.clientY }
    touches.set(event.pointerId, point)
    if (touches.size === 1) {
      pressed = point
      dragged = false
    } else if (touches.size === 2) {
      pinch = { spread: spread(), zoom: $zoom }
      dragged = true
    }
  }

  const onpointermove = (event: PointerEvent) => {
    const last = touches.get(event.pointerId)
    if (!last) return
    const from = touches.size === 2 ? middle() : last
    touches.set(event.pointerId, { x: event.clientX, y: event.clientY })
    const to = touches.size === 2 ? middle() : { x: event.clientX, y: event.clientY }
    scroller.scrollLeft += from.x - to.x
    scroller.scrollTop += from.y - to.y
    if (pinch && touches.size === 2) {
      zoomTo(pinch.zoom * pinch.spread / spread(), inWindow(to.x, to.y))
    } else if (Math.hypot(event.clientX - pressed.x, event.clientY - pressed.y) > 8) {
      dragged = true
    }
  }

  const onpointerup = (event: PointerEvent) => {
    if (!touches.delete(event.pointerId)) return
    if (touches.size < 2) pinch = null
    // Browsers without scrollend still settle onto whole squares after a drag
    if (!touches.size) onscrollend()
  }

  // A drag ends without clicking the square it ended on
  const onclickcapture = (event: MouseEvent) => {
    if (!dragged) return
    event.stopPropagation()
    dragged = false
  }

  // Generators and outputs are bordered in their own colours, outputs in the
  // one their messages print in, or grey while muted. The borders all go
  // while an operation's arguments are open
  const borders: Partial<Record<string, string>> = {
    generator: 'var(--cell-generator)',
    output: 'var(--cell-output)',
  }
  let bordered = $derived($editing === null
    ? $operations.flatMap((letter, i) => {
      const color = borders[kindOf(letter) ?? '']
      // An operation with inputs is outlined along with them instead
      return color && !$expansions[i] ? [{ i, color: $muted[i] ? 'var(--cell-muted)' : color }] : []
    })
    : [])

  // How each square's operation shows, such as Cma for a harmony or the next
  // number for a count. Some come from what the rules remember, so
  // they are worked out again each time the cells change
  let labels = $derived.by(() => {
    void $cells
    return $operations.map((letter, i) => letter ? labelFor(i, letter, SIZE, $args[i], !!$expansions[i]) : "")
  })

  // Each input square shows the argument it sets, greyed while its operation
  // is muted. They go while arguments are open
  let inputLabels = $derived($editing === null
    ? new Map([...$inputs].map(([square, { owner, k }]) => {
      const text = shortened(argsFor($operations[owner], SIZE, $args[owner])[k] ?? '')
      return [square, { text, muted: $muted[owner] }]
    }))
    : new Map<number, { text: string, muted: boolean }>())

  // An operation with inputs is outlined in one border round it and them, in
  // its border colour, or the cells' colour for an operator, and grey while
  // it's muted
  let outlines = $derived($editing === null
    ? $expansions.flatMap((expansion, i) => {
      if (!expansion) return []
      const squares = [i, ...inputSquares(i, expansion)]
      const [xs, ys] = [squares.map(square => square % SIZE), squares.map(square => Math.floor(square / SIZE))]
      const color = $muted[i] ? 'var(--cell-muted)' : borders[kindOf($operations[i]) ?? ''] ?? 'var(--cell-alive)'
      return [{ i, color, x1: Math.min(...xs), x2: Math.max(...xs), y1: Math.min(...ys), y2: Math.max(...ys) }]
    })
    : [])

  // A label that is a lone arrow, as a rotate's is, shows bigger, as arrows
  // are small beside letters
  const arrowLabels = new Set(Object.values(arrows))
  let borderColors = $derived(new Map(bordered.map(({ i, color }) => [i, color])))

  // The page starts on the grid, and tabbing from there carries on round to the controls
  onMount(() => grid.focus({ preventScroll: true }))

  // An arrow pressed anywhere else brings focus back to the grid, with the
  // cursor where it was left. Keys typed into a field, like the controls' CPS,
  // are for the field, and in the console they scroll it
  const onwindowkeydown = (event: KeyboardEvent) => {
    // Space plays and stops from anywhere, apart from while an operation's
    // arguments are open, where it does nothing as they don't take spaces.
    // It never reaches the page, so it doesn't scroll or type a space
    if (event.key === ' ' && !(event.metaKey || event.ctrlKey || event.altKey)) {
      event.preventDefault()
      if ($editing === null && !event.repeat) toggle()
      return
    }
    if (event.target === grid || event.target instanceof HTMLInputElement) return
    if (event.target instanceof HTMLElement && event.target.id === 'console') return
    if (keys[event.key] && !(event.metaKey || event.ctrlKey || event.altKey)) {
      // Stop the arrow keys from scrolling the page
      event.preventDefault()
      grid.focus({ preventScroll: true })
    }
  }

  const onkeydown = (event: KeyboardEvent) => {
    // Tabbing on from the grid wraps round to the first control
    if (event.key === 'Tab' && !event.shiftKey) {
      event.preventDefault()
      document.querySelector<HTMLElement>('[aria-label="Controls"] button')?.focus()
      return
    }

    // The zoom keys zoom the grid instead of the page
    const zooming = zoomKeys[event.key]
    if ((event.metaKey || event.ctrlKey) && !event.altKey && zooming) {
      event.preventDefault()
      zooming()
      return
    }

    // Select all, copy, cut, paste, undo and redo work on squares instead of the page's text
    const key = event.key.toLowerCase()
    const shortcut = key === 'z' && event.shiftKey ? redo : shortcuts[key]
    if ((event.metaKey || event.ctrlKey) && !event.altKey && shortcut) {
      event.preventDefault()
      if ($editing === null) shortcut()
      return
    }

    // Alt and Shift with an arrow reaches the operation under the cursor out
    // into one more input that way, or draws one back the opposite way
    const direction = keys[event.key]
    if (event.altKey && event.shiftKey && direction && !(event.metaKey || event.ctrlKey)) {
      event.preventDefault()
      if ($editing === null) change(() => expand($cursor, direction))
      return
    }

    // Alt with an arrow carries the selected operations along with the selection
    if (event.altKey && direction && !(event.metaKey || event.ctrlKey)) {
      event.preventDefault()
      if ($editing === null && selectionCanMove(direction)) change(() => {
        moveOperations($selection, direction)
        moveSelection(direction)
      })
      return
    }

    // Leave shortcuts like cmd+r to the browser
    if (event.metaKey || event.ctrlKey || event.altKey) return

    if ($editing !== null) {
      // Stop the arrow keys from scrolling the page
      if (direction) event.preventDefault()
      if (event.key === 'Enter' || event.key === 'Escape') closeArgs()
      // Up and down step through the names an argument takes, such as a direction
      else if (direction === 'n' || direction === 's') stepArg(direction === 'n' ? 1 : -1)
      else if (direction) moveArgCursor(direction)
      else if (/^[a-zA-Z0-9.#~+\-*/%^<>=!&|()]$/.test(event.key)) {
        // Stop / opening the browser's quick find
        event.preventDefault()
        typeArg(event.key)
      }
      else if (event.key === 'Backspace' || event.key === 'Delete') eraseArg()
    } else if (event.key === 'Enter' && event.shiftKey) {
      // Shift+Enter mutes the selected operations, or unmutes them
      change(() => toggleMuted($selection))
    } else if (event.key === 'Enter') {
      // Only an operation with params has arguments to open
      if (paramsFor($operations[$cursor], SIZE).length) openArgs($cursor, $selection)
    } else if (direction) {
      // Stop the arrow keys from scrolling the page
      event.preventDefault()
      // Shift stretches the selection out to the cursor's new square
      moveCursor(direction, event.shiftKey)
    } else if (kindOf(event.key)) {
      // Only the letters of generators, operators and outputs can be typed
      event.preventDefault()
      const before = snapshot()
      setOperations($selection, event.key)
      // A typed operation opens its arguments, when it has any, and only
      // starts running once they close, when it can be undone along with them
      if (paramsFor(event.key, SIZE).length) openArgs($cursor, $selection, before)
      else record(before)
    } else if (event.key === 'Backspace' || event.key === 'Delete') {
      change(() => setOperations($selection, ""))
    }
  }
</script>

<!-- A focused button clicks on space's keyup, which would play or stop a second time -->
<svelte:window onkeydown={onwindowkeydown}
  onkeyup={(event) => { if (event.key === ' ' && event.target instanceof HTMLButtonElement) event.preventDefault() }}
/>

<!-- The window shows part of the grid, scrolled by the cursor, the wheel or a finger -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="window" bind:this={scroller}
  {onpointerdown} {onpointermove} {onpointerup} onpointercancel={onpointerup} {onclickcapture}
>
<!-- Tabbing comes here after the controls -->
<!-- svelte-ignore a11y_no_noninteractive_tabindex, a11y_no_noninteractive_element_interactions -->
<div class="grid" class:editing={$editing !== null} class:focused={$gridFocused} bind:this={grid}
  role="application" aria-label="Grid" tabindex="0" style:--squares={SIZE}
  {onkeydown} onfocus={() => $gridFocused = true} onblur={() => $gridFocused = false}
>
  {#each $cells as cell, i (i)}
    {@const arg = $argCells.get(i)}
    {@const input = inputLabels.get(i)}
    <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
    <div
      class="cell"
      class:alive={cell.value !== undefined && !arg}
      class:bordered={borderColors.has(i)}
      style:--border={borderColors.get(i)}
      class:hidden={$editing !== null && i !== $shownSquare && !arg}
      onclick={(event) => $editing !== null ? placeArgCursor(i) : placeCursor(i, event.shiftKey)}
    >
      {#if arg}
        <span class="arg" class:invalid={!arg.valid} class:muted={$muted[$editing ?? -1]} style:--length={Math.max(1, arg.text.length)}>{arg.text}</span>
      {:else if $editing !== null && i === $shownSquare}
        <span class="letter" class:muted={$muted[$editing]} style:--length={1}>{$operations[$editing]}</span>
      {:else if $operations[i]}
        <!-- A cell passing over its square inverts the label -->
        <span class="letter" class:arrow={arrowLabels.has(labels[i])} class:muted={$muted[i]} style:--length={labels[i].length}>{labels[i]}</span>
      {:else if input}
        <span class="arg" class:muted={input.muted} style:--length={Math.max(1, input.text.length)}>{input.text}</span>
      {/if}
    </div>
  {/each}
  {#each bordered as { i, color } (i)}
    {@const [x, y] = [i % SIZE, Math.floor(i / SIZE)]}
    <!-- Behind each bordered square, in its colour, so the gridlines round it
         join up with its border instead of showing through. It comes before
         the selection, which colours the lines over it. Both lines are
         given, as an absolutely positioned item's end left to auto reaches
         the grid's edge -->
    <div
      class="border-line"
      style:background={color}
      style:grid-column="{x + 1} / {x + 2}"
      style:grid-row="{y + 1} / {y + 2}"
    ></div>
  {/each}
  {#each outlines as { i, color, x1, x2, y1, y2 } (i)}
    <!-- Over the squares, so it shows round them whatever they hold, with the
         gridlines round them coloured behind, as a bordered square's are -->
    <div
      class="outline"
      style:--border={color}
      style:grid-column="{x1 + 1} / {x2 + 2}"
      style:grid-row="{y1 + 1} / {y2 + 2}"
    ></div>
    <div
      class="outline-line"
      style:--border={color}
      style:grid-column="{x1 + 1} / {x2 + 2}"
      style:grid-row="{y1 + 1} / {y2 + 2}"
    ></div>
  {/each}
  {#if $openArea}
    <div
      class="backdrop"
      style:grid-column="{$openArea.x1 + 1} / {$openArea.x2 + 2}"
      style:grid-row="{$openArea.y1 + 1} / {$openArea.y2 + 2}"
    ></div>
  {/if}
  <div
    class="cursor-ring"
    style:grid-column="{$cursor % SIZE + 1} / {$cursor % SIZE + 2}"
    style:grid-row="{Math.floor($cursor / SIZE) + 1} / {Math.floor($cursor / SIZE) + 2}"
  ></div>
  <div
    class="selection"
    style:grid-column="{$bounds.x1 + 1} / {$bounds.x2 + 2}"
    style:grid-row="{$bounds.y1 + 1} / {$bounds.y2 + 2}"
  ></div>
</div>
</div>

<style>
  /* Its own scrollbars are hidden, and fingers are followed by hand, so they
     can pinch the grid without zooming the page */
  .window {
    width: var(--grid-width);
    aspect-ratio: 1;
    overflow: auto;
    overscroll-behavior: contain;
    scrollbar-width: none;
    touch-action: none;
  }

  .window::-webkit-scrollbar {
    display: none;
  }

  .grid {
    position: relative;
    display: grid;
    /* minmax(0, 1fr) stops a cell's operation from stretching its track, and the
       explicit rows keep every row the same height as the columns are wide */
    grid-template-columns: repeat(var(--squares), minmax(0, 1fr));
    grid-template-rows: repeat(var(--squares), minmax(0, 1fr));
    /* Every square at the zoomed size, with the gaps and border round them,
       so the window shows --size of them across */
    width: calc(var(--squares) * var(--square) + (var(--squares) + 1) * var(--line));
    aspect-ratio: 1;
    border: var(--line) solid var(--grid-line);
    /* The background shows through the gaps between cells as gridlines */
    gap: var(--line);
    background: var(--grid-line);
    /* Keeps the selection's negative z-index above the grid's background */
    isolation: isolate;
    /* Lets operations size themselves against the grid's width */
    container-type: inline-size;
  }

  .cell {
    display: grid;
    place-items: center;
    font-size: calc(100cqi / var(--squares) * 0.45);
    line-height: 1;
    overflow: hidden;
    background: var(--cell-empty);
    color: var(--cell-alive);
  }

  .alive {
    background: var(--cell-alive);
    color: var(--cell-empty);
  }

  /* Sits behind the selected cells and reaches one gap past them, so the
     gridlines in and around the selection change colour without getting any
     thicker. Being absolutely positioned it doesn't take a slot from the
     cells in the grid's auto-placement */
  .selection,
  .backdrop,
  .border-line {
    position: absolute;
    inset: calc(-1 * var(--line));
    z-index: -1;
  }

  .selection {
    background: var(--cell-cursor);
  }

  /* While an operation's arguments are open, only its square and theirs show.
     The rest go, gridlines and all, and the backdrop puts the gridlines back
     behind just the open squares. It comes before the selection, so the
     selection still colours the lines around the cursor */
  .editing {
    background: none;
    border-color: transparent;
  }

  .backdrop {
    background: var(--grid-line);
  }

  .hidden {
    visibility: hidden;
  }

  /* Arguments and operations look like the controls' number squares and the
     instructions */
  .arg,
  .letter {
    font-family: ui-monospace, monospace;
    font-size: var(--text-size);
  }

  /* Long arguments and labels shrink to fit their square */
  .arg,
  .letter {
    font-size: calc(var(--text-size) * min(1, 3 / var(--length)));
  }

  /* Operations show in bold, apart from arrows */
  .letter {
    font-weight: bold;
  }

  .letter.arrow {
    font-size: calc(var(--text-size) * 2);
    font-weight: normal;
  }

  /* A muted operation greys out, over an empty square or a cell alike, and
     so do its arguments while they're open */
  .letter.muted,
  .arg.muted {
    color: var(--cell-muted);
  }

  .arg.invalid {
    color: var(--cell-cursor);
  }

  /* Covers the operation and its inputs, drawn like a single square's border,
     letting clicks through to the squares */
  .outline {
    position: absolute;
    inset: 0;
    z-index: 1;
    pointer-events: none;
    box-shadow: inset 0 0 0 2px var(--border);
  }

  /* Colours just the gridlines round the outline, not those between its
     squares. Behind the cells and before the selection, so the selection's
     lines show over it */
  .outline-line {
    position: absolute;
    inset: calc(-1 * var(--line));
    z-index: -1;
    box-shadow: inset 0 0 0 var(--line) var(--border);
  }

  .bordered {
    box-shadow: inset 0 0 0 2px var(--border);
  }

  /* The cursor and selection stand in for the focus outline */
  .grid:focus {
    outline: none;
  }

  .grid:not(.focused) .selection {
    display: none;
  }

  /* The cursor's ring is drawn over everything on its square, the outline
     round an operation and its inputs included. It reaches out over the
     gridlines round the square too, as the outline crosses them where it
     runs from an operation to its inputs */
  .cursor-ring {
    position: absolute;
    inset: calc(-1 * var(--line));
    z-index: 2;
    pointer-events: none;
    box-shadow: inset 0 0 0 calc(2px + var(--line)) var(--cell-cursor);
  }

  .grid:not(.focused) .cursor-ring {
    display: none;
  }
</style>
