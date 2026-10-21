<script>
  import Controls from "./components/Controls.svelte";
  import Grid from "./components/Grid.svelte";
  import { DEFAULT_SIZE, gridSize } from "./stores/global";

  // On the root, so the grid and the controls can both size against it
  $effect(() => {
    document.documentElement.style.setProperty('--size', String($gridSize))
  })
  // The controls keep the squares' size at the default grid size, whatever its size now
  document.documentElement.style.setProperty('--default-size', String(DEFAULT_SIZE))
</script>

<main>
  <!-- The controls hang off the grid's left edge, so the grid stays centred -->
  <div class="board">
    <Controls />
    <Grid />
  </div>
</main>

<style>
  main {
    display: grid;
    place-items: center;
    height: 100dvh;
  }

  .board {
    position: relative;
  }
</style>
