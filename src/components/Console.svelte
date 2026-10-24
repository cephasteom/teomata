<script lang="ts">
  import { lines } from "../stores/console";

  let list = $state<HTMLOListElement>();
  // Like a terminal, it follows new lines while scrolled to the bottom, and
  // stays put while scrolled back up through older ones
  let following = true;

  // The scrollbar is drawn here rather than left to the browser, so it looks
  // the same everywhere. The thumb's top and height are fractions of the track
  let thumb = $state({ top: 0, height: 1 });
  let overflowing = $derived(thumb.height < 1);

  const measure = () => {
    if (!list) return;
    const { scrollTop, scrollHeight, clientHeight } = list;
    thumb = { top: scrollTop / scrollHeight, height: Math.min(1, clientHeight / scrollHeight) };
  };

  const onscroll = () => {
    if (!list) return;
    following = list.scrollHeight - list.scrollTop - list.clientHeight < 1;
    measure();
  };

  $effect(() => {
    $lines;
    if (list && following) list.scrollTop = list.scrollHeight;
    measure();
  });

  // The squares resize with the window, and the console with them
  $effect(() => {
    if (!list) return;
    const observer = new ResizeObserver(measure);
    observer.observe(list);
    return () => observer.disconnect();
  });

  // The scrollbar shows while it's scrolled by hand, hovered or dragged, and
  // fades out once it's been left alone a while. Scrolling to follow new lines
  // doesn't show it
  const SHOW_FOR = 1000;
  let scrolled = $state(false);
  let hovered = $state(false);
  let dragging = $state(false);
  let shown = $derived(scrolled || hovered || dragging);
  let hide: ReturnType<typeof setTimeout> | undefined;

  const reveal = () => {
    scrolled = true;
    clearTimeout(hide);
    hide = setTimeout(() => scrolled = false, SHOW_FOR);
  };

  $effect(() => () => clearTimeout(hide));

  // Dragging the thumb scrolls by as much of the lines as it moves over of the track
  let drag: { y: number, scrollTop: number } | null = null;

  const onthumbdown = (event: PointerEvent) => {
    if (!list) return;
    event.preventDefault();
    (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
    drag = { y: event.clientY, scrollTop: list.scrollTop };
    dragging = true;
  };

  const onthumbup = () => {
    drag = null;
    dragging = false;
    reveal();
  };

  const onthumbmove = (event: PointerEvent) => {
    if (!list || !drag) return;
    list.scrollTop = drag.scrollTop + (event.clientY - drag.y) * list.scrollHeight / list.clientHeight;
  };

  // Clicking the track centres the thumb on the click
  const ontrackdown = (event: PointerEvent) => {
    if (!list || event.target !== event.currentTarget) return;
    event.preventDefault();
    const track = (event.currentTarget as HTMLElement).getBoundingClientRect();
    const at = (event.clientY - track.top) / track.height;
    list.scrollTop = (at - thumb.height / 2) * list.scrollHeight;
    reveal();
  };
</script>

<!-- The printed values, one per line, under the devices and reaching down
     to the grid's bottom edge. The scrollbar sits outside them, in the gap
     before the grid -->
<div class="console">
  <!-- svelte-ignore a11y_no_noninteractive_tabindex, a11y_no_noninteractive_element_interactions -->
  <ol id="console" aria-label="Console" aria-live="off" tabindex="0" bind:this={list} {onscroll}
    onwheel={reveal} ontouchmove={reveal} onkeydown={reveal}
  >
    {#each $lines as { id, text } (id)}
      <li>{text}</li>
    {/each}
  </ol>
  {#if overflowing}
    <!-- svelte-ignore a11y_interactive_supports_focus -->
    <div class="track" class:shown role="scrollbar" aria-controls="console" aria-orientation="vertical"
      aria-valuenow={Math.round(thumb.top / (1 - thumb.height) * 100)} onpointerdown={ontrackdown}
      onpointerenter={() => hovered = true} onpointerleave={() => hovered = false}
    >
      <div class="thumb" role="presentation" style:top="{thumb.top * 100}%" style:height="{thumb.height * 100}%"
        onpointerdown={onthumbdown} onpointermove={onthumbmove}
        onpointerup={onthumbup} onpointercancel={onthumbup}
      ></div>
    </div>
  {/if}
</div>

<style>
  /* Takes whatever height the devices leave */
  .console {
    position: relative;
    flex: 1;
    min-height: 0;
    --bar-width: 3px;
  }

  ol {
    display: flex;
    flex-direction: column;
    gap: calc(var(--text-size) * 0.5);
    height: 100%;
    overflow-x: hidden;
    overflow-y: auto;
    margin: 0;
    padding: 0;
    list-style: none;
    line-height: 1;
    white-space: nowrap;
    /* The browser's own scrollbar hides, for the one drawn beside it */
    scrollbar-width: none;
  }

  ol::-webkit-scrollbar {
    display: none;
  }

  /* Focus rings the console in the cursor's colour, like the grid and the
     controls, outside it so the values stay in line with the controls */
  ol:focus {
    outline: none;
  }

  ol:focus-visible {
    box-shadow: 0 0 0 2px var(--cell-cursor);
  }

  /* Lines keep their height, so the console scrolls rather than squashing them */
  li {
    flex-shrink: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    /* Against the grid side */
    text-align: right;
  }

  /* A third of the way across the gap between the values and the grid */
  .track {
    position: absolute;
    top: 0;
    bottom: 0;
    left: calc(100% + var(--square) / 3 - var(--bar-width) / 2);
    width: var(--bar-width);
    background: var(--grid-line);
    cursor: pointer;
    touch-action: none;
    opacity: 0;
    /* Fades out slowly, and back in quickly */
    transition: opacity 0.6s;
  }

  .track.shown {
    opacity: 1;
    transition-duration: 0.15s;
  }

  .thumb {
    position: absolute;
    left: 0;
    right: 0;
    background: var(--cell-alive);
  }
</style>
