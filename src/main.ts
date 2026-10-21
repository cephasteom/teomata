import { mount } from 'svelte'
import './reset.css'
import '@fortawesome/fontawesome-free/css/all.min.css'
import './app.css'
import './stores/persist'
import App from './App.svelte'

const app = mount(App, {
  target: document.getElementById('app')!,
})

export default app
