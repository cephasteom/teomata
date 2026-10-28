<script lang="ts">
  import { onMount } from "svelte";
  import { cells, type direction } from "../stores/cells";
  import { gridSize } from "../stores/global";
  import {
    gridFocused, cursor, bounds, selection, placeCursor, moveCursor, selectAll, selectionCanMove, moveSelection,
  } from "../stores/cursor";
  import {
    operations, args, muted, toggleMuted, setOperations, moveOperations, copyOperations, pasteOperations,
  } from "../stores/operations";
  import {
    editing, shownSquare, argCells, openArea, openArgs, closeArgs, placeArgCursor, moveArgCursor, typeArg, eraseArg,
  } from "../stores/editing";
  import { paramsFor, kindOf, labelFor } from "../rules";
  import { arrows } from "../lib/utils";
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
      setOperations($selection, "")
    },
    // Pastes from the selection's top left corner and selects what was pasted
    v: () => {
      const pasted = pasteOperations($bounds.x1, $bounds.y1)
      if (!pasted) return
      placeCursor(pasted.y1 * $gridSize + pasted.x1)
      placeCursor(pasted.y2 * $gridSize + pasted.x2, true)
    },
  }

  let grid: HTMLDivElement

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
      return color ? [{ i, color: $muted[i] ? 'var(--cell-muted)' : color }] : []
    })
    : [])

  // How each square's operation shows, such as Cma for a harmony or the next
  // count for an increment. Some come from what the rules remember, so
  // they are worked out again each time the cells change
  let labels = $derived.by(() => {
    void $cells
    return $operations.map((letter, i) => letter ? labelFor(i, letter, $gridSize, $args[i]) : "")
  })

  // A label that is a lone arrow, as a rotate's is, shows bigger, as arrows
  // are small beside letters
  const arrowLabels = new Set(Object.values(arrows))
  let borderColors = $derived(new Map(bordered.map(({ i, color }) => [i, color])))

  // The page starts on the grid, and tabbing from there carries on round to the controls
  onMount(() => grid.focus())

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
      grid.focus()
    }
  }

  const onkeydown = (event: KeyboardEvent) => {
    // Tabbing on from the grid wraps round to the first control
    if (event.key === 'Tab' && !event.shiftKey) {
      event.preventDefault()
      document.querySelector<HTMLElement>('[aria-label="Controls"] button')?.focus()
      return
    }

    // Select all, copy, cut and paste work on squares instead of the page's text
    const shortcut = shortcuts[event.key.toLowerCase()]
    if ((event.metaKey || event.ctrlKey) && !event.altKey && shortcut) {
      event.preventDefault()
      if ($editing === null) shortcut()
      return
    }

    // Alt with an arrow carries the selected operations along with the selection
    const direction = keys[event.key]
    if (event.altKey && direction && !(event.metaKey || event.ctrlKey)) {
      event.preventDefault()
      if ($editing === null && selectionCanMove(direction)) {
        moveOperations($selection, direction)
        moveSelection(direction)
      }
      return
    }

    // Leave shortcuts like cmd+r to the browser
    if (event.metaKey || event.ctrlKey || event.altKey) return

    if ($editing !== null) {
      // Stop the arrow keys from scrolling the page
      if (direction) event.preventDefault()
      if (event.key === 'Enter' || event.key === 'Escape') closeArgs()
      else if (direction) moveArgCursor(direction)
      else if (/^[a-zA-Z0-9.#~+\-*/%^<>=!&|]$/.test(event.key)) {
        // Stop / opening the browser's quick find
        event.preventDefault()
        typeArg(event.key)
      }
      else if (event.key === 'Backspace' || event.key === 'Delete') eraseArg()
    } else if (event.key === 'Enter' && event.shiftKey) {
      // Shift+Enter mutes the selected operations, or unmutes them
      toggleMuted($selection)
    } else if (event.key === 'Enter') {
      // Only an operation with params has arguments to open
      if (paramsFor($operations[$cursor], $gridSize).length) openArgs($cursor, $selection)
    } else if (direction) {
      // Stop the arrow keys from scrolling the page
      event.preventDefault()
      // Shift stretches the selection out to the cursor's new square
      moveCursor(direction, event.shiftKey)
    } else if (kindOf(event.key)) {
      // Only the letters of generators, operators and outputs can be typed
      event.preventDefault()
      const before = { operations: $operations, args: $args }
      setOperations($selection, event.key)
      // A typed operation opens its arguments, when it has any, and only
      // starts running once they close
      if (paramsFor(event.key, $gridSize).length) openArgs($cursor, $selection, before)
    } else if (event.key === 'Backspace' || event.key === 'Delete') {
      setOperations($selection, "")
    }
  }
</script>

<!-- A focused button clicks on space's keyup, which would play or stop a second time -->
<svelte:window onkeydown={onwindowkeydown}
  onkeyup={(event) => { if (event.key === ' ' && event.target instanceof HTMLButtonElement) event.preventDefault() }}
/>

<!-- Tabbing comes here after the controls -->
<!-- svelte-ignore a11y_no_noninteractive_tabindex, a11y_no_noninteractive_element_interactions -->
<div class="grid" class:editing={$editing !== null} class:focused={$gridFocused} bind:this={grid}
  role="application" aria-label="Grid" tabindex="0"
  {onkeydown} onfocus={() => $gridFocused = true} onblur={() => $gridFocused = false}
>
  {#each $cells as cell, i (i)}
    {@const arg = $argCells.get(i)}
    <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
    <div
      class="cell"
      class:alive={cell.value !== undefined && !arg}
      class:cursor={i === $cursor}
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
      {/if}
    </div>
  {/each}
  {#each bordered as { i, color } (i)}
    {@const [x, y] = [i % $gridSize, Math.floor(i / $gridSize)]}
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
  {#if $openArea}
    <div
      class="backdrop"
      style:grid-column="{$openArea.x1 + 1} / {$openArea.x2 + 2}"
      style:grid-row="{$openArea.y1 + 1} / {$openArea.y2 + 2}"
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
    /* minmax(0, 1fr) stops a cell's operation from stretching its track, and the
       explicit rows keep every row the same height as the columns are wide */
    grid-template-columns: repeat(var(--size), minmax(0, 1fr));
    grid-template-rows: repeat(var(--size), minmax(0, 1fr));
    width: var(--grid-width);
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
    font-size: calc(100cqi / var(--size) * 0.45);
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

  /* The cursor's ring comes after, so it shows over the border */
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

  .focused .cursor {
    box-shadow: inset 0 0 0 2px var(--cell-cursor);
  }
</style>
