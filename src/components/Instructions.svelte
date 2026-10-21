<script lang="ts">
  import { instructions } from "../rules";
  import { cursor } from "../stores/cursor";
  import { editing } from "../stores/editing";
  import { operations } from "../stores/operations";

  // The operation under the cursor, or the one whose arguments are open, shows
  // on its own. Anywhere else, every operation shows
  let focused = $derived($operations[$editing ?? $cursor]?.toLowerCase() ?? "");
  let matching = $derived(instructions.filter(({ letter }) => letter === focused));
  let shown = $derived(matching.length ? matching : instructions);
</script>

<!-- The operations by letter, sitting a square's width to the grid's right -->
<dl class="instructions default-size" aria-label="Operations">
  {#each shown as { letter, name, about, params } (letter)}
    <div class="operation">
      <dt>{letter}</dt>
      <dd>
        {name}{#if params.length}({#each params as param, k (param.name)}{#if k}, {/if}{param.name}{/each}){/if}
      </dd>
      <!-- The active operation explains itself and its params underneath -->
      {#if matching.length}
        <dd class="about">
          <p>{about}</p>
          {#each params as param (param.name)}
            <p><span class="param">{param.name}</span>: {param.about}</p>
          {/each}
        </dd>
      {/if}
    </div>
  {/each}
</dl>

<style>
  .instructions {
    position: absolute;
    top: 0;
    left: calc(100% + var(--square));
    display: grid;
    gap: calc(var(--text-size) * 0.75);
    margin: 0;
    font-family: ui-monospace, monospace;
    font-size: var(--text-size);
    line-height: 1;
    white-space: nowrap;
  }

  .operation {
    display: grid;
    grid-template-columns: max-content 1fr;
    gap: calc(var(--text-size) * 0.75) 1ch;
  }

  dt {
    color: var(--cell-cursor);
  }

  dd {
    margin: 0;
  }

  .about {
    grid-column: 1 / 3;
    display: grid;
    gap: calc(var(--text-size) * 0.5);
    max-width: 32ch;
    min-width: 32ch;
    line-height: 1.3;
    white-space: normal;
    opacity: 0.7;
  }

  .about p {
    margin: 0;
  }

  .param {
    color: var(--cell-cursor);
  }
</style>
