<script>
  import Grid from "./components/Grid.svelte";
  import Explanation from "./components/Explanation.svelte";
  import Sidebar from "./components/Sidebar.svelte";
</script>

<Sidebar />

<main>
  <Grid />
  <footer>
    <Explanation />
  </footer>
</main>

<style>
  main {
    display: grid;
    place-items: center;
    height: 100dvh;
  }

  /* Floats over the bottom of the page so the grid keeps its size whether or
     not there is an explanation to show */
  footer {
    position: fixed;
    inset: auto 0 0;
    display: flex;
    justify-content: center;
    pointer-events: none;
  }

  footer :global(p) {
    margin-bottom: 1rem;
    padding: 0.25rem 0.75rem;
    background: var(--page-bg);
    border: 1px solid var(--grid-line);
    text-align: center;
  }
</style>
