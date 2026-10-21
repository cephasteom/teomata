<script lang="ts">
  import { onMount } from "svelte";
  import { toggle } from "../scheduler";
  import { isPlaying } from "../stores/global";
  import { clearCells, randomizeCells } from "../stores/cells";
  import { clearOperations } from "../stores/operations";

  // How close to the left edge the pointer has to be to reveal the sidebar
  const EDGE = 48
  const IDLE_MS = 10_000

  let open = $state(true)
  let sidebar: HTMLElement
  let timer: ReturnType<typeof setTimeout> | undefined

  // Opens the sidebar, or keeps it open, for another IDLE_MS
  const reveal = () => {
    open = true
    clearTimeout(timer)
    timer = setTimeout(hide, IDLE_MS)
  }

  const hide = () => {
    open = false
    clearTimeout(timer)
    // Stop a key press from firing a button that has slid out of sight
    if (sidebar.contains(document.activeElement)) {
      (document.activeElement as HTMLElement).blur()
    }
  }

  const onpointermove = (event: PointerEvent) => {
    if (event.clientX <= EDGE || (open && sidebar.contains(event.target as Node))) reveal()
  }

  const onkeydown = (event: KeyboardEvent) => {
    if (event.key === 'Tab') reveal()
    else if (event.key === 'Escape') hide()
    else if (event.key === ' ' && !(event.metaKey || event.ctrlKey || event.altKey)) {
      // Stops the page scrolling
      event.preventDefault()
      // Holding space down shouldn't flick between playing and stopped
      if (!event.repeat) toggle()
    }
  }

  // A focused button clicks itself when space comes back up, which would make
  // space press Clear or Random, or undo the toggle on the Play button
  const onkeyup = (event: KeyboardEvent) => {
    if (event.key === ' ') event.preventDefault()
  }

  // Covers both the Fullscreen API and the browser's own full screen (F11),
  // which only shows up through the display-mode media query
  const fullscreen = window.matchMedia('(display-mode: fullscreen)')
  const onfullscreen = () => {
    if (document.fullscreenElement || fullscreen.matches) hide()
  }

  onMount(() => {
    // Starts open, so this only sets the timer that slides it away
    reveal()
    fullscreen.addEventListener('change', onfullscreen)
    return () => {
      clearTimeout(timer)
      fullscreen.removeEventListener('change', onfullscreen)
    }
  })
</script>

<svelte:window {onpointermove} {onkeydown} {onkeyup} />
<svelte:document onfullscreenchange={onfullscreen} />

<!-- Focus or pointer movement inside counts as activity, so the idle timer starts over -->
<aside bind:this={sidebar} class:show={open} onfocusin={reveal} aria-label="Controls">
  <ul>
    <li>
      <button onclick={toggle} title={$isPlaying ? 'Stop' : 'Play'} aria-label={$isPlaying ? 'Stop' : 'Play'}>
        <i class={['fa-solid', $isPlaying ? 'fa-stop' : 'fa-play']}></i>
      </button>
    </li>
    <li>
      <button onclick={() => { clearCells(); clearOperations() }} title="Clear" aria-label="Clear">
        <i class="fa-solid fa-eraser"></i>
      </button>
    </li>
    <li>
      <button onclick={randomizeCells} title="Random" aria-label="Random">
        <i class="fa-solid fa-shuffle"></i>
      </button>
    </li>
  </ul>
</aside>

<style>
  aside {
    color: white;
    position: absolute;
    top: 0;
    left: 0;
    bottom: 0;
    width: 50px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    z-index: 100;
    transform: translateX(-100%);
    transition: transform 0.5s ease-in-out;

    &.show {
      transform: translateX(0);
    }
  }

  ul {
    list-style: none;
    padding: 0;
    margin: 0;
  }

  li {
    height: 50px;
    border: 0.25px solid rgba(255, 255, 255, 0.25);
    border-bottom: none;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  li:last-of-type {
    border-bottom: 0.25px solid rgba(255, 255, 255, 0.25);
  }

  /* The whole square is the button, so its own border and padding go */
  button {
    width: 100%;
    height: 100%;
    border: none;
    padding: 0;
  }

  @media (prefers-reduced-motion: reduce) {
    aside {
      transition: none;
    }
  }
</style>
