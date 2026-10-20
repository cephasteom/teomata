<script lang="ts">
  import { cursor } from "../stores/cursor";
  import { letters, explanations } from "../stores/letters";

  const letter = $derived($letters[$cursor] ?? "")
  const explanation = $derived(explanations[letter.toLowerCase()])
</script>

{#if letter}
  <p>
    <strong>{letter}</strong>: {explanation ?? "This letter has no rule yet."}
  </p>
{/if}
