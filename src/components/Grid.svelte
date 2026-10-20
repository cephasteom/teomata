<script lang="ts">
  import { cells, type direction } from "../stores/cells";
  import { gridSize } from "../stores/global";
  import { cursor, bounds, selection, placeCursor, moveCursor } from "../stores/cursor";
  import { letters, setLetters, iconFor } from "../stores/letters";
  import {
    editing, argCells, openBounds, openArgs, closeArgs, placeArgCursor, moveArgCursor, typeArg, eraseArg,
  } from "../stores/editing";

  const keys: Record<string, direction> = {
    ArrowUp: 'n',
    ArrowDown: 's',
    ArrowRight: 'e',
    ArrowLeft: 'w',
  }

  const onkeydown = (event: KeyboardEvent) => {
    // Leave shortcuts like cmd+r to the browser
    if (event.metaKey || event.ctrlKey || event.altKey) return

    const direction = keys[event.key]
    // A sidebar button keeps focus after it's clicked, and Enter would click
    // it again on top of opening or closing the arguments
    if (event.key === 'Enter') event.preventDefault()

    if ($editing !== null) {
      // Stop the arrow keys from scrolling the page
      if (direction) event.preventDefault()
      if (event.key === 'Enter' || event.key === 'Escape') closeArgs()
      else if (direction) moveArgCursor(direction)
      else if (/^[a-zA-Z0-9.-]$/.test(event.key)) typeArg(event.key)
      else if (event.key === 'Backspace' || event.key === 'Delete') eraseArg()
    } else if (event.key === 'Enter') {
      openArgs($cursor, $selection)
    } else if (direction) {
      // Stop the arrow keys from scrolling the page
      event.preventDefault()
      // Shift stretches the selection out to the cursor's new square
      moveCursor(direction, event.shiftKey)
    } else if (/^[a-zA-Z]$/.test(event.key)) {
      setLetters($selection, event.key)
    } else if (event.key === 'Backspace' || event.key === 'Delete') {
      setLetters($selection, "")
    }
  }
</script>

<svelte:window {onkeydown} />

<div class="grid" class:editing={$editing !== null} style:--size={$gridSize}>
  {#each $cells as cell, i (i)}
    {@const arg = $argCells.get(i)}
    <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
    <div
      class="cell"
      class:alive={cell.value && !arg}
      class:cursor={i === $cursor}
      class:hidden={$editing !== null && i !== $editing && !arg}
      onclick={(event) => $editing !== null ? placeArgCursor(i) : placeCursor(i, event.shiftKey)}
    >
      {#if arg}
        <span class="arg" class:invalid={!arg.valid} style:--length={Math.max(1, arg.text.length)}>{arg.text}</span>
      {:else if $letters[i]}
        <i class={['fa-solid', iconFor($letters[i])]} title={$letters[i]}></i>
      {/if}
    </div>
  {/each}
  {#if $openBounds}
    <div
      class="backdrop"
      style:grid-column="{$openBounds.x1 + 1} / {$openBounds.x2 + 2}"
      style:grid-row="{$openBounds.y + 1} / {$openBounds.y + 2}"
    ></div>
  {/if}
  <div
    class="selection"
    style:grid-column="{$bounds.x1 + 1} / {$bounds.x2 + 2}"
    style:grid-row="{$bounds.y1 + 1} / {$bounds.y2 + 2}"
  ></div>
</div>

<style>
  .grid {
    position: relative;
    display: grid;
    /* minmax(0, 1fr) stops a cell's letter from stretching its track, and the
       explicit rows keep every row the same height as the columns are wide */
    grid-template-columns: repeat(var(--size), minmax(0, 1fr));
    grid-template-rows: repeat(var(--size), minmax(0, 1fr));
    /* The largest square that fits the viewport with a 2rem gutter all
       round. Viewport units track the window, so it resizes along with it */
    --gutter: 2rem;
    width: min(100dvw - 2 * var(--gutter), 100dvh - 2 * var(--gutter));
    aspect-ratio: 1;
    --line: 0.5px;
    border: var(--line) solid var(--grid-line);
    /* The background shows through the gaps between cells as gridlines */
    gap: var(--line);
    background: var(--grid-line);
    /* Keeps the selection's negative z-index above the grid's background */
    isolation: isolate;
    /* Lets letters size themselves against the grid's width */
    container-type: inline-size;
  }

  .cell {
    display: grid;
    place-items: center;
    font-size: calc(100cqi / var(--size) * 0.45);
    line-height: 1;
    user-select: none;
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
  .backdrop {
    position: absolute;
    inset: calc(-1 * var(--line));
    z-index: -1;
  }

  .selection {
    background: var(--cell-cursor);
  }

  /* While a letter's arguments are open, only its square and theirs show.
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

  /* Long arguments shrink to fit their square */
  .arg {
    font-size: calc(1em * min(1, 3 / var(--length)));
    font-variant-numeric: tabular-nums;
  }

  .invalid {
    color: var(--cell-cursor);
  }

  .cursor {
    box-shadow: inset 0 0 0 2px var(--cell-cursor);
  }
</style>
