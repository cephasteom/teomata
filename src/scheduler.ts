import { get } from 'svelte/store';
import { Loop, getDraw, getTransport, start } from 'tone'
import { cps, isPlaying, q } from './stores/global';
import { showCells, stepCells } from './stores/cells';
import { clearConsole, printLine } from './stores/console';
import { midiTime, playNote, sendControl } from './lib/midi';

const loop = new Loop((time) => {
	// Ticks since the transport last started, which time-based rules read.
	// Worked out from the transport's position rather than counted, so it
	// stays in step with the bars when q changes
	const transport = getTransport()
	const division = transport.PPQ * 4 / get(q)
	const now = Math.round(transport.getTicksAtTime(time) / division)
	// Tone fires callbacks ahead of the audio clock, so the rules step now and
	// their MIDI is sent for when the tick is heard, on WebMidi's clock
	const at = midiTime(time)
	const { grid, events, version } = stepCells(now)
	for (const event of events) {
		if (event.type === "note") playNote(event.device, event.channel, event.notes, event.amp, event.dur, at)
		if (event.type === "cc") sendControl(event.device, event.channel, event.controller, event.value, at)
	}
	// The grid and console update when the tick is heard too
	getDraw().schedule(() => {
		showCells(grid, version)
		for (const event of events) {
			if (event.type === "print") printLine(event.text)
		}
	}, time)
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
