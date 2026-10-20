<script lang="ts">
  import { cells } from "../stores/cells";
  import { gridSize } from "../stores/global";
</script>

<div class="grid" style:--size={$gridSize}>
  {#each $cells as cell, i (i)}
    <div class="cell" class:alive={cell.value}></div>
  {/each}
</div>

<style>
  .grid {
    display: grid;
    grid-template-columns: repeat(var(--size), 1fr);
    width: min(80vmin, 100%);
    aspect-ratio: 1;
    border: 1px solid black;
  }

  .cell {
    background: white;
  }

  .alive {
    background: black;
  }
</style>
