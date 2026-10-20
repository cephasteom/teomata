<script lang="ts">
  import { cells, type direction } from "../stores/cells";
  import { gridSize } from "../stores/global";
  import { cursor, moveCursor } from "../stores/cursor";
  import { letters, setLetter, iconFor } from "../stores/letters";

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
    if (direction) {
      // Stop the arrow keys from scrolling the page
      event.preventDefault()
      moveCursor(direction)
    } else if (/^[a-zA-Z]$/.test(event.key)) {
      setLetter($cursor, event.key)
    } else if (event.key === 'Backspace' || event.key === 'Delete') {
      setLetter($cursor, "")
    }
  }
</script>

<svelte:window {onkeydown} />

<div class="grid" style:--size={$gridSize}>
  {#each $cells as cell, i (i)}
    <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
    <div
      class="cell"
      class:alive={cell.value}
      class:cursor={i === $cursor}
      onclick={() => cursor.set(i)}
    >
      {#if $letters[i]}
        <i class={['fa-solid', iconFor($letters[i])]} title={$letters[i]}></i>
      {/if}
    </div>
  {/each}
</div>

<style>
  .grid {
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
    border: 0.5px solid var(--grid-line);
    /* The background shows through the gaps between cells as gridlines */
    gap: 0.5px;
    background: var(--grid-line);
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

  .cursor {
    box-shadow: inset 0 0 0 2px var(--cell-cursor);
  }
</style>
