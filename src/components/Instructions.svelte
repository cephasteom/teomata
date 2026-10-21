<script lang="ts">
  import { instructions } from "../rules";
</script>

<!-- The operations by letter, sitting a square's width to the grid's right -->
<dl class="instructions default-size" aria-label="Operations">
  {#each instructions as { letter, name, params } (letter)}
    <div class="operation">
      <dt>{letter}</dt>
      <dd>
        {name}{#if params.length}({#each params as param, k (param.name)}{#if k}, {/if}{param.name}{/each}){/if}
      </dd>
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
    display: flex;
    gap: 1ch;
  }

  dt {
    color: var(--cell-cursor);
  }

  dd {
    margin: 0;
  }
</style>
