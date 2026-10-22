import { get } from 'svelte/store';
import { Loop, getDraw, getTransport, start } from 'tone'
import { cps, isPlaying, q } from './stores/global';
import { updateCells } from './stores/cells';
import { clearConsole } from './stores/console';

const loop = new Loop((time) => {
	// Ticks since the transport last started, which time-based rules read.
	// Worked out from the transport's position rather than counted, so it
	// stays in step with the bars when q changes
	const transport = getTransport()
	const division = transport.PPQ * 4 / get(q)
	const now = Math.round(transport.getTicksAtTime(time) / division)
	// Tone fires callbacks slightly ahead of the audio clock, so schedule the
	// visual update for when the tick is actually heard
	getDraw().schedule(() => updateCells(now), time)
}, `${get(q)}n`).start(0);

// "Nn" is an Nth of a bar of four. The loop's repeats stay counted from the
// transport's start, so a new interval still lands on the bar's divisions
q.subscribe((value) => {
	loop.interval = `${value}n`
})

// Tone counts tempo in quarter notes a minute, and a cycle is a bar of four
cps.subscribe((value) => {
	getTransport().bpm.value = value * 4 * 60
})

export const toggle = async () => {
    await start()
    if (get(isPlaying)) {
        getTransport().stop()
    } else {
        // Each run starts with an empty console
        clearConsole()
        getTransport().start()
    }
    isPlaying.update(isPlaying => !isPlaying)
}
