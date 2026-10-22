<script lang="ts">
  import { outputs } from "../lib/midi";
</script>

<!-- The MIDI outputs plugged in now, each by its index, the number an out
     picks its device by -->
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
  /* Spaced and aligned like the console's lines, against the grid side */
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

  /* The reset gives every element its own taller line height, so the
     heading and lines are set one by one, or they'd pad out the square's
     gap above and below */
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
