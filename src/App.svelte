<script>
  import Controls from "./components/Controls.svelte";
  import Grid from "./components/Grid.svelte";
  import Sidebar from "./components/Sidebar.svelte";
  import { gridSize, showControls } from "./stores/global";

  // On the root, so the grid, the controls and the sidebar's icons can all size against it
  $effect(() => {
    document.documentElement.style.setProperty('--size', String($gridSize))
  })
</script>

<Sidebar />

<main>
  <!-- The controls hang off the grid's left edge, so the grid stays centred -->
  <div class="board">
    {#if $showControls}
      <Controls />
    {/if}
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
