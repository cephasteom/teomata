<script lang="ts">
  import { marked } from "marked";
  import rules from "../../rules.md?raw";

  // rules.md is the project's own file, so its HTML is trusted
  const html = marked.parse(rules, { async: false })
</script>

<div class="help">{@html html}</div>

<style>
  .help {
    font-family: ui-monospace, monospace;
    font-size: 0.85rem;
    line-height: 1.5;
  }

  .help :global(h1),
  .help :global(h2) {
    margin: 1.5em 0 0.5em;
    line-height: 1.2;
    color: var(--cell-cursor);
  }

  .help :global(h1) {
    margin-top: 0;
    font-size: 1.4em;
  }

  .help :global(h2) {
    font-size: 1.1em;
  }

  .help :global(p),
  .help :global(ul) {
    margin: 0 0 0.75em;
  }

  .help :global(ul) {
    padding-left: 1.5em;
    list-style: disc;
  }

  .help :global(li) {
    margin-bottom: 0.4em;
  }

  .help :global(strong) {
    font-weight: bold;
  }

  .help :global(code) {
    color: var(--cell-destination);
  }
</style>
