<script lang="ts">
  import type { Writable } from "svelte/store";

  type Props = {
    id: string
    label: string
    value: Writable<number>
    min: number
    max: number
    step: number
    // Decimal places it rounds to, so the arrow keys' steps don't drift
    places: number
    // The controls' row it sits in, which its label lines up with
    row: number
  }

  let { id, label, value, min, max, step, places, row }: Props = $props()

  // What's typed in the square, only set once it's committed.
  // Empty or not a number comes through as null
  let typed = $state<number | null>($value)

  const commit = () => {
    if (typed !== null && Number.isFinite(typed)) {
      const rounded = Math.round(typed * 10 ** places) / 10 ** places
      value.set(Math.min(max, Math.max(min, rounded)))
    }
    // Shows the clamped value, or puts back the old one if it wasn't a number
    typed = $value
  }

  // Enter commits the value and stays in the square, Escape drops what was typed and leaves it
  const onkeydown = (event: KeyboardEvent) => {
    const input = event.target as HTMLInputElement
    if (event.key === 'Enter') commit()
    if (event.key === 'Escape') {
      // Straight on the input, so leaving it doesn't fire a change with what was typed
      input.value = String($value)
      typed = $value
      input.blur()
    }
  }
</script>

<input {id} type="number" inputmode={places > 0 ? 'decimal' : 'numeric'} {min} {max} {step}
  style:grid-row={row} bind:value={typed} onchange={commit} {onkeydown}
/>
<!-- Hangs off the value's square to the left, in a column of its own -->
<!-- Its row needs an end line, or being absolute it would reach the controls' bottom -->
<label for={id} style:grid-row="{row} / {row + 1}">{label}</label>

<style>
  /* A square of its own, sharing the controls' left line as its right one.
     Placed in its row's grid area, which it's then positioned against */
  label {
    position: absolute;
    top: calc(-1 * var(--line));
    bottom: calc(-1 * var(--line));
    right: calc(100% + var(--line));
    width: calc(var(--square) + var(--line));
    display: grid;
    place-items: center;
    border: var(--line) solid var(--grid-line);
    border-right: none;
    background: var(--cell-empty);
    color: var(--cell-alive);
    font-family: ui-monospace, monospace;
    font-size: var(--text-size);
    line-height: 1;
  }

  input {
    width: 100%;
    min-width: 0;
    border: none;
    padding: 0;
    text-align: center;
    font: inherit;
    /* Monospace like the label, so the digits line up as they change */
    font-family: ui-monospace, monospace;
    font-size: var(--text-size);
    background: var(--cell-empty);
    color: var(--cell-alive);
    /* No spinners, they don't fit in a square */
    appearance: textfield;
  }

  input::-webkit-outer-spin-button,
  input::-webkit-inner-spin-button {
    appearance: none;
    margin: 0;
  }

  /* Focus looks like the grid's cursor */
  input:focus-visible {
    outline: none;
    box-shadow: inset 0 0 0 2px var(--cell-cursor);
  }
</style>
