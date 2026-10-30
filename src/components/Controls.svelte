<script lang="ts">
  import { toggle } from "../scheduler";
  import { MAX_CPS, MAX_Q, MIN_CPS, MIN_Q, cps, isPlaying, q, showConsole, showInstructions } from "../stores/global";
  import NumberSquare from "./NumberSquare.svelte";
  import { clearCells, randomizeCells } from "../stores/cells";
  import { clearConsole } from "../stores/console";

  let focused = $state<number | null>(null)

  const onplaykeydown = (event: KeyboardEvent) => {
    if (event.key === 'Tab' && event.shiftKey) {
      event.preventDefault()
      document.querySelector<HTMLElement>('[aria-label="Grid"]')?.focus({ preventScroll: true })
    }
  }

  const onfocusin = (event: FocusEvent) => {
    const control = event.target as HTMLElement
    const controls = [...control.parentElement!.querySelectorAll(':scope > button, :scope > input')]
    focused = control.matches(':focus-visible') 
      ? controls.indexOf(control) 
      : null
  }
</script>

<div class="controls default-size" role="toolbar" aria-label="Controls" aria-orientation="vertical"
  {onfocusin} onfocusout={() => focused = null}
>
  <button onclick={toggle} onkeydown={onplaykeydown} title={$isPlaying ? 'Stop' : 'Play'} aria-label={$isPlaying ? 'Stop' : 'Play'}>
    <i class={['fa-solid', $isPlaying ? 'fa-stop' : 'fa-play']}></i>
  </button>
  <button onclick={() => { clearCells(); clearConsole() }} title="Clear" aria-label="Clear">
    <i class="fa-solid fa-eraser"></i>
  </button>
  <button onclick={randomizeCells} title="Random" aria-label="Random">
    <i class="fa-solid fa-shuffle"></i>
  </button>
  <button class:off={!$showConsole} onclick={() => showConsole.update(shown => !shown)}
    title={$showConsole ? 'Hide console' : 'Show console'} aria-label="Console" aria-pressed={$showConsole}
  >
    <i class="fa-solid fa-terminal"></i>
  </button>
  <button class:off={!$showInstructions} onclick={() => showInstructions.update(shown => !shown)}
    title={$showInstructions ? 'Hide instructions' : 'Show instructions'} aria-label="Instructions" aria-pressed={$showInstructions}
  >
    <i class="fa-solid fa-book"></i>
  </button>
  <NumberSquare id="cps" label="cps" value={cps} min={MIN_CPS} max={MAX_CPS} step={0.05} places={2} row={6} />
  <NumberSquare id="q" label="q" value={q} min={MIN_Q} max={MAX_Q} step={1} places={0} row={7} />
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
    grid-template-rows: repeat(7, var(--square));
    width: calc(var(--square) + 2 * var(--line));
    border: var(--line) solid var(--grid-line);
    gap: var(--line);
    background: var(--grid-line);
    isolation: isolate;
  }

  .focus {
    position: absolute;
    inset: calc(-1 * var(--line));
    z-index: -1;
    background: var(--cell-cursor);
  }

  button {
    display: grid;
    place-items: center;
    border: none;
    padding: 0;
    line-height: 1;
    background: var(--cell-empty);
    color: var(--cell-alive);
  }

  button.off {
    color: var(--grid-line);
  }

  button:hover {
    background: var(--cell-alive);
    color: var(--cell-empty);
  }

  button:focus-visible {
    outline: none;
    box-shadow: inset 0 0 0 2px var(--cell-cursor);
  }
</style>
