<script lang="ts">
  import { toggle } from "../scheduler";
  import { MAX_CPS, MAX_Q, MAX_SIZE, MIN_CPS, MIN_Q, MIN_SIZE, cps, isPlaying, q } from "../stores/global";
  import { size } from "../stores/size";
  import NumberSquare from "./NumberSquare.svelte";
  import { clearCells, randomizeCells } from "../stores/cells";
  import { clearOperations } from "../stores/operations";
  import { clearConsole } from "../stores/console";

  // The row of the control with keyboard focus, which the focus square sits behind
  let focused = $state<number | null>(null)

  // Tabbing back from the first control wraps round to the grid
  const onplaykeydown = (event: KeyboardEvent) => {
    if (event.key === 'Tab' && event.shiftKey) {
      event.preventDefault()
      document.querySelector<HTMLElement>('[aria-label="Grid"]')?.focus()
    }
  }

  // Counts only the controls, as the number squares' labels sit among them
  const onfocusin = (event: FocusEvent) => {
    const control = event.target as HTMLElement
    const controls = [...control.parentElement!.querySelectorAll(':scope > button, :scope > input')]
    focused = control.matches(':focus-visible') ? controls.indexOf(control) : null
  }
</script>

<!-- A column of grid squares, one per control, sitting a square's width to the grid's left -->
<div class="controls default-size" role="toolbar" aria-label="Controls" aria-orientation="vertical"
  {onfocusin} onfocusout={() => focused = null}
>
  <button onclick={toggle} onkeydown={onplaykeydown} title={$isPlaying ? 'Stop' : 'Play'} aria-label={$isPlaying ? 'Stop' : 'Play'}>
    <i class={['fa-solid', $isPlaying ? 'fa-stop' : 'fa-play']}></i>
  </button>
  <button onclick={() => { clearCells(); clearOperations(); clearConsole() }} title="Clear" aria-label="Clear">
    <i class="fa-solid fa-eraser"></i>
  </button>
  <button onclick={randomizeCells} title="Random" aria-label="Random">
    <i class="fa-solid fa-shuffle"></i>
  </button>
  <NumberSquare id="cps" label="cps" value={cps} min={MIN_CPS} max={MAX_CPS} step={0.05} places={2} row={4} />
  <NumberSquare id="q" label="q" value={q} min={MIN_Q} max={MAX_Q} step={1} places={0} row={5} />
  <NumberSquare id="size" label="s" value={size} min={MIN_SIZE} max={MAX_SIZE} step={1} places={0} row={6} />
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
    grid-template-rows: repeat(6, var(--square));
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
