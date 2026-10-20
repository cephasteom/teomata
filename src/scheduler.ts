import { Loop, getTransport } from 'tone'
import { isPlaying } from './stores/global';
import { get } from 'svelte/store';

new Loop((time) => {
	console.log('hello', time)
}, "16n").start(0);

export const toggle = () => {
    get(isPlaying) 
        ? getTransport().stop()
        : getTransport().start()
    isPlaying.update(isPlaying => !isPlaying)
}