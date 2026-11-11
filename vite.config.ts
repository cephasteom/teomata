import { svelte } from '@sveltejs/vite-plugin-svelte'
import { createHash } from 'node:crypto'
import { readdirSync } from 'node:fs'
import { defineConfig, type Plugin } from 'vite'

// Emits sw.js listing every built and public file, so the installed app
// precaches them and loads offline. Its cache name changes with the file list.
function serviceWorker(): Plugin {
  return {
    name: 'service-worker',
    apply: 'build',
    generateBundle(_, bundle) {
      const files = [
        './',
        ...Object.keys(bundle),
        ...readdirSync('public', { recursive: true, withFileTypes: true })
          .filter((entry) => entry.isFile())
          .map((entry) => `${entry.parentPath.replace(/^public\/?/, '')}/${entry.name}`.replace(/^\//, '')),
      ].filter((file) => file !== 'index.html' && !file.endsWith('.map'))
      const version = createHash('sha256').update(files.join('\n')).digest('hex').slice(0, 12)
      this.emitFile({
        type: 'asset',
        fileName: 'sw.js',
        source: `const CACHE = 'teomata-${version}'
const FILES = ${JSON.stringify(files)}

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(FILES)).then(() => self.skipWaiting()))
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key.startsWith('teomata-') && key !== CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET' || new URL(request.url).origin !== location.origin) return
  if (request.mode === 'navigate') {
    // Network first so a new build shows up; the cached page when offline.
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone()
          if (response.ok) caches.open(CACHE).then((cache) => cache.put('./', copy))
          return response
        })
        .catch(() => caches.match('./')),
    )
    return
  }
  event.respondWith(caches.match(request).then((cached) => cached || fetch(request)))
})
`,
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [svelte(), serviceWorker()],
})
