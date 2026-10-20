<script lang="ts">
  import { cursor } from "../stores/cursor";
  import { letters, explanations, iconFor } from "../stores/letters";

  const letter = $derived($letters[$cursor] ?? "")
  const explanation = $derived(explanations[letter.toLowerCase()])
</script>

{#if letter}
  <p>
    <i class={['fa-solid', iconFor(letter)]} title={letter}></i> {explanation ?? "This letter has no rule yet."}
  </p>
{/if}
