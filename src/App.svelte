<script>
  import { toggle } from "./scheduler";
  import { isPlaying } from "./stores/global";
  import { clearCells, randomizeCells } from "./stores/cells";
  import { clearLetters } from "./stores/letters";
  import Grid from "./components/Grid.svelte";
  import Explanation from "./components/Explanation.svelte";
</script>

<div>
  <h1>Teomata</h1>
  <button onclick={toggle}>{$isPlaying ? 'Stop' : 'Play'}</button>
  <button onclick={() => { clearCells(); clearLetters() }}>Clear</button>
  <button onclick={randomizeCells}>Random</button>
  <Grid />
  <Explanation />
</div>
