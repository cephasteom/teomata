<script>
  import { toggle } from "./scheduler";
  import { isPlaying } from "./stores/global";
</script>

<div>
  <h1>Hello world</h1>
  <button onclick={toggle}>{$isPlaying ? 'Stop' : 'Play'}</button>
</div>