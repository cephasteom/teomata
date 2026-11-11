<script lang="ts">
  import { onMount } from "svelte";
  import { cells } from "../../stores/cells";
  import { SIZE, zoom } from "../../stores/global";
  import { gridFocused, cursor, bounds, placeCursor } from "../../stores/cursor";
  import { operations, args, modes, inputs, expansions } from "../../stores/operations";
  import { editing, shownSquare, argCells, openArea, placeArgCursor } from "../../stores/editing";
  import { createViewport } from "./viewport";
  import { gestures } from "./gestures";
  import { createKeyHandlers } from "./keyboard";
  import {
    labelSourcesFor, labelsFor, squareBordersFor, inputOutlinesFor, inputLabelsFor, type InputLabel,
  } from "./decorations";
  import { drawGrid, resetColors, type Scene } from "./draw";
  import { toIndex } from "../../lib/utils";

  let viewport: HTMLDivElement
  let grid: HTMLDivElement
  let canvas: HTMLCanvasElement

  const view = createViewport(() => viewport, () => grid)
  const { onGridKeydown, onWindowKeydown, onWindowKeyup } = createKeyHandlers(() => grid, view)

  let isEditing = $derived($editing !== null)

  let labelSources = $derived(labelSourcesFor($operations, $args))

  // Borders, outlines and input labels are hidden while arguments are open
  let borders = $derived(isEditing ? new Map() : squareBordersFor($operations, $modes, $expansions, labelSources))
  let outlines = $derived(isEditing ? [] : inputOutlinesFor($operations, $modes, $expansions))
  let inputLabels = $derived(isEditing
    ? new Map<number, InputLabel>()
    : inputLabelsFor($inputs, $operations, $args, $modes))

  // Some labels come from what the rules remember, so they're redone each tick
  let labels = $derived.by(() => {
    void $cells
    return labelsFor($operations, $args, $expansions, labelSources)
  })

  let scene: Scene = $derived({
    cells: $cells,
    operations: $operations,
    modes: $modes,
    labels,
    labelSources,
    borders,
    outlines,
    inputLabels,
    argCells: $argCells,
    editing: $editing,
    shownSquare: $shownSquare,
    openArea: $openArea,
    cursor: $cursor,
    bounds: $bounds,
    focused: $gridFocused,
  })

  // Draws at once, so a tick shows in the same frame it's heard
  const paint = () => {
    const ctx = canvas?.getContext('2d')
    if (!ctx) return
    const dpr = devicePixelRatio
    const { clientWidth: width, clientHeight: height } = viewport
    const w = Math.round(width * dpr), h = Math.round(height * dpr)
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w
      canvas.height = h
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`
    }
    const rem = parseFloat(getComputedStyle(document.documentElement).fontSize)
    drawGrid(ctx, scene, {
      pitch: view.squarePitch(), line: view.line(), rem,
      scrollX: viewport.scrollLeft, scrollY: viewport.scrollTop, width, height, dpr,
    })
  }

  $effect(() => {
    void scene
    paint()
  })

  // Squares are under the pointer by position, as the canvas has none of its own
  const onclick = (event: MouseEvent) => {
    const { left, top } = grid.getBoundingClientRect()
    const pitch = view.squarePitch(), line = view.line()
    const square = (at: number) => Math.min(SIZE - 1, Math.max(0, Math.floor((at - line) / pitch)))
    const i = toIndex(square(event.clientX - left), square(event.clientY - top))
    if (!isEditing) placeCursor(i, event.shiftKey)
    // Only the open squares show, so only they can be clicked
    else if (i === $shownSquare || $argCells.has(i)) placeArgCursor(i)
  }

  // Keep the cursor, and as much of the open arguments as fits, in view
  $effect(() => {
    void $zoom
    if ($openArea) view.reveal(toIndex($openArea.x2, $openArea.y1))
    view.reveal($cursor)
  })

  onMount(() => {
    grid.focus({ preventScroll: true })
    const resized = new ResizeObserver(paint)
    resized.observe(viewport)
    resized.observe(grid)
    const scheme = matchMedia('(prefers-color-scheme: dark)')
    const recolor = () => {
      resetColors()
      paint()
    }
    scheme.addEventListener('change', recolor)
    return () => {
      resized.disconnect()
      scheme.removeEventListener('change', recolor)
    }
  })
</script>

<svelte:window onkeydown={onWindowKeydown} onkeyup={onWindowKeyup} />

<div class="viewport" bind:this={viewport} onscroll={paint} {@attach gestures(view)}>
  <!-- svelte-ignore a11y_no_noninteractive_tabindex, a11y_no_noninteractive_element_interactions, a11y_click_events_have_key_events -->
  <div class="grid" bind:this={grid}
    role="application" aria-label="Grid" tabindex="0" style:--squares={SIZE}
    onkeydown={onGridKeydown} onfocus={() => $gridFocused = true} onblur={() => $gridFocused = false}
    {onclick}
  >
    <canvas bind:this={canvas}></canvas>
  </div>
</div>

<style>
  /* Scrollbars hidden and touch handled in gestures.ts, so fingers can pinch
     the grid without zooming the page */
  .viewport {
    width: var(--grid-width);
    aspect-ratio: 1;
    overflow: auto;
    overscroll-behavior: contain;
    scrollbar-width: none;
    touch-action: none;
  }

  .viewport::-webkit-scrollbar {
    display: none;
  }

  /* Sizes the scrolling; the squares, with a gridline between and round
     them, are drawn on the canvas in draw.ts */
  .grid {
    width: calc(var(--squares) * var(--square) + (var(--squares) + 1) * var(--line));
    aspect-ratio: 1;
  }

  /* The cursor and selection stand in for the focus outline */
  .grid:focus {
    outline: none;
  }

  /* Covers the viewport, staying put as the grid scrolls under it */
  canvas {
    position: sticky;
    top: 0;
    left: 0;
    display: block;
    pointer-events: none;
  }
</style>
