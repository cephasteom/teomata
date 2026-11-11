import { mount } from 'svelte'
import './reset.css'
import './app.css'
import './stores/persist'
import App from './App.svelte'

const app = mount(App, {
  target: document.getElementById('app')!,
})

export default app

// Installed as a PWA, the service worker serves the app offline.
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js'))
}
