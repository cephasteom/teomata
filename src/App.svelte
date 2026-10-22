<script>
  import Controls from "./components/Controls.svelte";
  import Grid from "./components/Grid.svelte";
  import Instructions from "./components/Instructions.svelte";
  import Console from "./components/Console.svelte";
  import Devices from "./components/Devices.svelte";
  import { DEFAULT_SIZE, gridSize, showConsole, showInstructions } from "./stores/global";

  // On the root, so the grid and the controls can both size against it
  $effect(() => {
    document.documentElement.style.setProperty('--size', String($gridSize))
  })
  // The controls keep the squares' size at the default grid size, whatever its size now
  document.documentElement.style.setProperty('--default-size', String(DEFAULT_SIZE))
</script>

<main>
  <!-- The controls, console and instructions hang off the grid's edges, so the grid stays centred -->
  <div class="board">
    <Controls />
    <!-- Under the controls, a square's width to the grid's left -->
    <div class="side default-size">
      <Devices />
      {#if $showConsole}
        <Console />
      {/if}
    </div>
    <Grid />
    {#if $showInstructions}
      <Instructions />
    {/if}
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

  /* The devices and then the console, a square apart, starting a square
     below the controls' eight squares and reaching down to the grid's bottom
     edge. Their right edge lines up with the controls' */
  .side {
    position: absolute;
    top: calc(9 * var(--square) + 9 * var(--line));
    bottom: 0;
    right: calc(100% + var(--square));
    display: flex;
    flex-direction: column;
    gap: var(--square);
    width: 20ch;
    font-family: ui-monospace, monospace;
    font-size: var(--text-size);
  }
</style>
