<script lang="ts">
  import { cells } from "../stores/cells";
  import { gridFocused, selection } from "../stores/cursor";

  // The values of the selected squares' cells, row by row, skipping empty
  // squares. Like the selection, they only show while the grid has focus
  let values = $derived(
    $gridFocused
      ? [...$selection].map(i => $cells[i]?.value).filter(value => value !== undefined)
      : []
  );
</script>

<!-- The selected values, one per line, sitting a square's width to the grid's
     right along its bottom edge -->
<ol class="values default-size" aria-label="Values">
  {#each values as value, k (k)}
    <li>{Array.isArray(value) ? value.join(", ") : value}</li>
  {/each}
</ol>

<style>
  .values {
    position: absolute;
    bottom: 0;
    left: calc(100% + var(--square));
    display: flex;
    flex-direction: column;
    gap: calc(var(--text-size) * 0.5);
    max-height: 50%;
    overflow-y: auto;
    margin: 0;
    padding: 0;
    list-style: none;
    font-family: ui-monospace, monospace;
    font-size: var(--text-size);
    line-height: 1;
    white-space: nowrap;
  }
</style>
