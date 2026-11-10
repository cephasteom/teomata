<!-- Layers drawn over and under the grid's squares. Must render inside .grid,
     as each is placed on the grid's tracks -->
<script lang="ts">
  import { cursor, bounds } from "../../stores/cursor";
  import { openArea } from "../../stores/editing";
  import { gridArea, squareArea, type Border, type Outline } from "./decorations";

  let { borders, outlines, focused }: {
    borders: Map<number, Border>,
    outlines: Outline[],
    focused: boolean,
  } = $props()

  // A dashed border leaves its gridlines alone, so the gaps show
  let solidBorders = $derived([...borders].filter(([, { thru }]) => !thru))
</script>

{#each solidBorders as [i, { color }] (i)}
  <div class="border-line" style:background={color} style:grid-area={squareArea(i)}></div>
{/each}

{#each outlines as { i, color, thru, ...area } (i)}
  <div class="outline" class:thru style:--border={color} style:grid-area={gridArea(area)}></div>
  {#if !thru}
    <div class="outline-line" style:--border={color} style:grid-area={gridArea(area)}></div>
  {/if}
{/each}

{#if $openArea}
  <div class="backdrop" style:grid-area={gridArea($openArea)}></div>
{/if}

{#if focused}
  <div class="cursor-ring" style:grid-area={squareArea($cursor)}></div>
  <div class="selection" style:grid-area={gridArea($bounds)}></div>
{/if}

<style>
  /* Stacking, within the grid's isolated context:
     -1  border-line, outline-line, backdrop, selection: recolour the gridlines
         (the grid's background) round squares. Later ones paint over earlier,
         so the selection's colour wins
      0  the squares
      1  outline, over the squares whatever they hold
      2  cursor-ring, over everything on its square

     The -1 layers reach one gridline past their squares, so the lines change
     colour without getting thicker. Being absolutely positioned, none of these
     take a slot from the squares in the grid's auto-placement */
  .border-line,
  .outline-line,
  .backdrop,
  .selection,
  .cursor-ring {
    position: absolute;
    inset: calc(-1 * var(--line));
  }

  .border-line,
  .outline-line,
  .backdrop,
  .selection {
    z-index: -1;
  }

  .backdrop {
    background: var(--grid-line);
  }

  .selection {
    background: var(--cell-cursor);
  }

  /* Only the lines round the outline, not those between its squares */
  .outline-line {
    box-shadow: inset 0 0 0 var(--line) var(--border);
  }

  .outline {
    position: absolute;
    inset: 0;
    z-index: 1;
    pointer-events: none;
    box-shadow: inset 0 0 0 2px var(--border);
  }

  /* outline rather than box-shadow, as it can be dashed */
  .outline.thru {
    box-shadow: none;
    outline: 2px dashed var(--border);
    outline-offset: -2px;
  }

  /* Covers the gridlines too, as an outline crosses them between an
     operation and its inputs */
  .cursor-ring {
    z-index: 2;
    pointer-events: none;
    box-shadow: inset 0 0 0 calc(2px + var(--line)) var(--cell-cursor);
  }
</style>
