<script lang="ts">
  import { instructions } from "../rules";
  import { gridFocused, cursor } from "../stores/cursor";
  import { editing } from "../stores/editing";
  import { operations, inputs } from "../stores/operations";

  // The operation under the cursor, or the one whose input it's on, or the one
  // whose arguments are open, shows on its own. Anywhere else, or while the
  // grid doesn't have focus, every operation shows
  let focused = $derived($gridFocused ? $operations[$editing ?? $inputs.get($cursor)?.owner ?? $cursor] ?? "" : "");
  let matching = $derived(instructions.filter(({ letter }) => letter === focused));
  let shown = $derived(matching.length ? matching : instructions);
</script>

<!-- The operations by letter, sitting a square's width to the grid's right -->
<dl class="instructions default-size" aria-label="Operations">
  {#each shown as { letter, name, kind, about, params, rest } (letter)}
    <div class="operation">
      <dt class={kind}>{letter}</dt>
      <dd>
        {name}({#each params as param, k (param.name)}{#if k}, {/if}{param.name}{/each}{#if rest}{#if params.length}, {/if}...{rest.name}{/if})
      </dd>
      <!-- The active operation explains itself and its params underneath. The
      text is our own and may hold links, which are clicked without taking focus
      from the grid, as that would hide them -->
      {#if matching.length}
        <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
        <dd class="about" onmousedown={(e) => e.preventDefault()}>
          <p>{@html about}</p>
          {#each rest ? [...params, rest] : params as param (param.name)}
            <p><span class="param">{param.name}</span>: {@html param.about}</p>
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

  /* Generators and outputs are coloured as their squares are bordered */
  dt.generator {
    color: var(--cell-generator);
  }

  dt.output {
    color: var(--cell-output);
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
    opacity: 0.8;
  }

  .about p {
    margin: 0;
  }

  .about :global(a) {
    color: inherit;
  }

  .param {
    color: var(--cell-cursor);
  }
</style>
