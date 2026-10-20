import { get } from 'svelte/store';
import { Loop, getDraw, getTransport, start } from 'tone'
import { isPlaying } from './stores/global';
import { updateCells } from './stores/cells';


new Loop((time) => {
	// Tone fires callbacks slightly ahead of the audio clock, so schedule the
	// visual update for when the tick is actually heard
	getDraw().schedule(updateCells, time)
}, "8n").start(0);

export const toggle = async () => {
    await start()
    get(isPlaying) 
        ? getTransport().stop()
        : getTransport().start()
    isPlaying.update(isPlaying => !isPlaying)
}
