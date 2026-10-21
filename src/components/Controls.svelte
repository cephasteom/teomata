<script lang="ts">
  import { toggle } from "../scheduler";
  import { isPlaying } from "../stores/global";
  import { clearCells, randomizeCells } from "../stores/cells";
  import { clearOperations } from "../stores/operations";

  // The row of the button with keyboard focus, which the focus square sits behind
  let focused = $state<number | null>(null)

  const onfocusin = (event: FocusEvent) => {
    const button = event.target as HTMLElement
    focused = button.matches(':focus-visible') ? [...button.parentElement!.children].indexOf(button) : null
  }
</script>

<!-- A column of grid squares, one per button, sitting a square's width to the grid's left -->
<div class="controls" role="toolbar" aria-label="Controls" aria-orientation="vertical"
  {onfocusin} onfocusout={() => focused = null}
>
  <button onclick={toggle} title={$isPlaying ? 'Stop' : 'Play'} aria-label={$isPlaying ? 'Stop' : 'Play'}>
    <i class={['fa-solid', $isPlaying ? 'fa-stop' : 'fa-play']}></i>
  </button>
  <button onclick={() => { clearCells(); clearOperations() }} title="Clear" aria-label="Clear">
    <i class="fa-solid fa-eraser"></i>
  </button>
  <button onclick={randomizeCells} title="Random" aria-label="Random">
    <i class="fa-solid fa-shuffle"></i>
  </button>
  {#if focused !== null}
    <div class="focus" style:grid-row="{focused + 1} / {focused + 2}"></div>
  {/if}
</div>

<style>
  .controls {
    position: absolute;
    top: 0;
    right: calc(100% + var(--square));
    display: grid;
    grid-template-rows: repeat(3, var(--square));
    width: calc(var(--square) + 2 * var(--line));
    /* Gridlines the same way as the grid: the background shows through the gaps */
    border: var(--line) solid var(--grid-line);
    gap: var(--line);
    background: var(--grid-line);
    /* Keeps the focus square's negative z-index above the background */
    isolation: isolate;
  }

  /* Like the grid's selection, it sits behind the focused button and reaches
     one gap past it, so the gridlines around it change colour */
  .focus {
    position: absolute;
    inset: calc(-1 * var(--line));
    z-index: -1;
    background: var(--cell-cursor);
  }

  /* The whole square is the button, so the usual button border and padding go */
  button {
    display: grid;
    place-items: center;
    border: none;
    padding: 0;
    line-height: 1;
    background: var(--cell-empty);
    color: var(--cell-alive);
  }

  button:hover {
    background: var(--cell-alive);
    color: var(--cell-empty);
  }

  /* Focus looks like the grid's cursor */
  button:focus-visible {
    outline: none;
    box-shadow: inset 0 0 0 2px var(--cell-cursor);
  }
</style>
