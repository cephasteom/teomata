<script lang="ts">
  import type { Snippet } from "svelte";
  import Icon from "./Icon.svelte";

  interface Props {
    open: boolean
    label: string
    children: Snippet
  }

  let { open = $bindable(), label, children }: Props = $props()

  let dialog: HTMLDialogElement

  // A native modal dialog: it traps focus, closes on Esc, and hands focus
  // back to whatever opened it when it closes
  $effect(() => {
    if (open && !dialog.open) dialog.showModal()
    else if (!open && dialog.open) dialog.close()
  })

  // A click on the backdrop lands on the dialog itself, outside its content
  const onclick = (event: MouseEvent) => {
    if (event.target === dialog) open = false
  }
</script>

<dialog bind:this={dialog} aria-label={label} onclose={() => open = false} {onclick}>
  <div class="content">
    <button class="close" onclick={() => open = false} title="Close" aria-label="Close">
      <Icon name="xmark" />
    </button>
    {#if open}
      {@render children()}
    {/if}
  </div>
</dialog>

<style>
  dialog {
    width: min(70ch, 100dvw - 2rem);
    max-height: calc(100dvh - 4rem);
    padding: 0;
    border: var(--line) solid var(--grid-line);
    background: var(--page-bg);
    color: var(--page-text);
    /* Its text can be selected and copied, unlike the rest of the app's */
    -webkit-user-select: text;
    user-select: text;
  }

  dialog::backdrop {
    background: rgb(0 0 0 / 0.7);
  }

  .content {
    position: relative;
    padding: 1.5rem 2rem;
  }

  .close {
    position: sticky;
    top: 0;
    float: right;
    display: grid;
    place-items: center;
    width: 2rem;
    height: 2rem;
    margin: -0.5rem -1rem 0 0;
    border: none;
    padding: 0;
    background: var(--cell-empty);
    color: var(--cell-alive);
  }

  .close:hover {
    background: var(--cell-alive);
    color: var(--cell-empty);
  }

  .close:focus-visible {
    outline: none;
    box-shadow: inset 0 0 0 2px var(--cell-cursor);
  }
</style>
