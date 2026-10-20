<script>
  import Grid from "./components/Grid.svelte";
  import Sidebar from "./components/Sidebar.svelte";
</script>

<Sidebar />

<main>
  <Grid />
</main>

<style>
  main {
    display: grid;
    place-items: center;
    height: 100dvh;
  }
</style>
