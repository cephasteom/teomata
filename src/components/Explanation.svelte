<script lang="ts">
  import { cursor } from "../stores/cursor";
  import { letters, explanations, iconFor } from "../stores/letters";
  import { editing, argSquares } from "../stores/editing";
  import { paramsFor } from "../stores/rules";

  // On an argument's square, explain that argument rather than the letter
  const param = $derived(
    $editing === null ? undefined : paramsFor($letters[$editing])[$argSquares.indexOf($cursor)]
  )
  const letter = $derived($letters[$editing ?? $cursor] ?? "")
  const explanation = $derived(explanations[letter.toLowerCase()])
</script>

{#if param}
  <p>
    <i class={['fa-solid', iconFor(letter)]} title={letter}></i> <strong>{param.name}</strong>: {param.about}
  </p>
{:else if letter}
  <p>
    <i class={['fa-solid', iconFor(letter)]} title={letter}></i> {explanation ?? "This letter has no rule yet."}
  </p>
{/if}
