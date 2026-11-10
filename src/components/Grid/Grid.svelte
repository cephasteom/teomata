<script lang="ts">
  import { onMount } from "svelte";
  import { cells } from "../../stores/cells";
  import { SIZE, zoom } from "../../stores/global";
  import { gridFocused, cursor, placeCursor } from "../../stores/cursor";
  import { operations, args, modes, inputs, expansions } from "../../stores/operations";
  import { editing, shownSquare, argCells, openArea, placeArgCursor } from "../../stores/editing";
  import { createViewport } from "./viewport";
  import { gestures } from "./gestures";
  import { createKeyHandlers } from "./keyboard";
  import {
    labelSourcesFor, labelsFor, squareBordersFor, inputOutlinesFor, inputLabelsFor, type InputLabel,
  } from "./decorations";
  import Overlays from "./Overlays.svelte";
  import { toIndex } from "../../lib/utils";

  let viewport: HTMLDivElement
  let grid: HTMLDivElement

  const view = createViewport(() => viewport, () => grid)
  const { onGridKeydown, onWindowKeydown, onWindowKeyup } = createKeyHandlers(() => grid, view)

  let isEditing = $derived($editing !== null)
  let editingOff = $derived($editing !== null && $modes[$editing] === 'off')

  let labelSources = $derived(labelSourcesFor($operations, $args))
  // Some labels come from what the rules remember, so they're redone each tick
  let labels = $derived.by(() => {
    void $cells
    return labelsFor($operations, $args, $expansions, labelSources)
  })

  // Borders, outlines and input labels are hidden while arguments are open
  let borders = $derived(isEditing ? new Map() : squareBordersFor($operations, $modes, $expansions))
  let outlines = $derived(isEditing ? [] : inputOutlinesFor($operations, $modes, $expansions))
  let inputLabels = $derived(isEditing
    ? new Map<number, InputLabel>()
    : inputLabelsFor($inputs, $operations, $args, $modes))

  // Keep the cursor, and as much of the open arguments as fits, in view
  $effect(() => {
    void $zoom
    if ($openArea) view.reveal(toIndex($openArea.x2, $openArea.y1))
    view.reveal($cursor)
  })

  onMount(() => grid.focus({ preventScroll: true }))
</script>

<svelte:window onkeydown={onWindowKeydown} onkeyup={onWindowKeyup} />

{#snippet squareText(i: number)}
  {@const arg = $argCells.get(i)}
  {@const input = inputLabels.get(i)}
  {#if arg}
    <span class="arg" class:invalid={!arg.valid} class:off={editingOff} style:--length={Math.max(1, arg.text.length)}>{arg.text}</span>
  {:else if isEditing && i === $shownSquare}
    <span class="letter" class:off={editingOff} style:--length={1}>{$operations[$editing!]}</span>
  {:else if $operations[i]}
    <span class="letter" class:direction={$operations[labelSources[i]] === 'r'} class:off={$modes[i] === 'off'} style:--length={labels[i].length}>{labels[i]}</span>
  {:else if input}
    <span class="arg" class:off={input.off} style:--length={Math.max(1, input.text.length)}>{input.text}</span>
  {/if}
{/snippet}

<div class="viewport" bind:this={viewport} {@attach gestures(view)}>
  <!-- svelte-ignore a11y_no_noninteractive_tabindex, a11y_no_noninteractive_element_interactions -->
  <div class="grid" class:editing={isEditing} bind:this={grid}
    role="application" aria-label="Grid" tabindex="0" style:--squares={SIZE}
    onkeydown={onGridKeydown} onfocus={() => $gridFocused = true} onblur={() => $gridFocused = false}
  >
    {#each $cells as cell, i (i)}
      {@const border = borders.get(i)}
      <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
      <div
        class="cell"
        class:alive={cell.value !== undefined && !$argCells.has(i)}
        class:bordered={!!border}
        class:thru={border?.thru}
        style:--border={border?.color}
        class:hidden={isEditing && i !== $shownSquare && !$argCells.has(i)}
        onclick={(event) => isEditing ? placeArgCursor(i) : placeCursor(i, event.shiftKey)}
      >
        {@render squareText(i)}
      </div>
    {/each}
    <Overlays {borders} {outlines} focused={$gridFocused} />
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

  /* The background showing through the gaps draws the gridlines */
  .grid {
    position: relative;
    display: grid;
    /* minmax(0, 1fr) stops a label stretching its track */
    grid-template-columns: repeat(var(--squares), minmax(0, 1fr));
    grid-template-rows: repeat(var(--squares), minmax(0, 1fr));
    width: calc(var(--squares) * var(--square) + (var(--squares) + 1) * var(--line));
    aspect-ratio: 1;
    border: var(--line) solid var(--grid-line);
    gap: var(--line);
    background: var(--grid-line);
    /* Keeps the overlays' negative z-index above the grid's background */
    isolation: isolate;
    container-type: inline-size;
  }

  /* The cursor and selection stand in for the focus outline */
  .grid:focus {
    outline: none;
  }

  /* While arguments are open only their squares show; the overlays' backdrop
     puts the gridlines back behind them */
  .editing {
    background: none;
    border-color: transparent;
  }

  .hidden {
    visibility: hidden;
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

  .bordered {
    box-shadow: inset 0 0 0 2px var(--border);
  }

  /* outline rather than box-shadow, as it can be dashed */
  .bordered.thru {
    box-shadow: none;
    outline: 2px dashed var(--border);
    outline-offset: -2px;
  }

  /* Long text shrinks to fit its square */
  .arg,
  .letter {
    font-family: ui-monospace, monospace;
    font-size: calc(var(--text-size) * min(1, 3 / var(--length)));
  }

  .letter {
    font-weight: bold;
  }

  /* A rotate, or a square entangled with one */
  .letter.direction {
    font-style: italic;
  }

  .letter.off,
  .arg.off {
    color: var(--cell-off);
  }

  .arg.invalid {
    color: var(--cell-cursor);
  }
</style>
