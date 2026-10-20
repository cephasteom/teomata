<script>
  import { toggle } from "./scheduler";
  import { isPlaying } from "./stores/global";
  import Grid from "./components/Grid.svelte";
</script>

<div>
  <h1>Teomata</h1>
  <button onclick={toggle}>{$isPlaying ? 'Stop' : 'Play'}</button>
  <Grid />
</div>
