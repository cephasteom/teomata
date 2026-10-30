<script lang="ts">
  import { outputs } from "../lib/midi";
</script>

<section class="devices" aria-label="MIDI devices">
  <h2>MIDI devices:</h2>
  <ol>
    {#each $outputs as output, k (output.id)}
      <li>{k} {output.name}</li>
    {:else}
      <li>none</li>
    {/each}
  </ol>
</section>

<style>
  .devices,
  ol {
    display: flex;
    flex-direction: column;
    gap: calc(var(--text-size) * 0.5);
  }

  .devices {
    flex-shrink: 0;
    white-space: nowrap;
    text-align: right;
  }

  h2,
  li {
    line-height: 1;
  }

  h2 {
    margin: 0;
    font: inherit;
  }

  ol {
    margin: 0;
    padding: 0;
    list-style: none;
  }

  li {
    overflow: hidden;
    text-overflow: ellipsis;
  }
</style>
