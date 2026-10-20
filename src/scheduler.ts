import { get } from 'svelte/store';
import { Loop, getDraw, getTransport, start } from 'tone'
import { isPlaying, ticksPerBar } from './stores/global';
import { updateCells } from './stores/cells';

// Ticks since the transport last started, which time-based rules read
let tick = 0

new Loop((time) => {
	const now = tick++
	// Tone fires callbacks slightly ahead of the audio clock, so schedule the
	// visual update for when the tick is actually heard
	getDraw().schedule(() => updateCells(now), time)
}, `${ticksPerBar}n`).start(0);

export const toggle = async () => {
    await start()
    if (get(isPlaying)) {
        getTransport().stop()
        tick = 0
    } else {
        getTransport().start()
    }
    isPlaying.update(isPlaying => !isPlaying)
}
