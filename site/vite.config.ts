import { createReadStream, existsSync, statSync } from 'node:fs'
import { extname, join, normalize } from 'node:path'
import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const DOCS = new URL('../docs/', import.meta.url).pathname
const TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.md': 'text/plain; charset=utf-8',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
}

/**
 * In production these files sit next to index.html inside docs/ — written there
 * by Zoetron's own heartbeat. In dev we serve them from ../docs so the live
 * organs (brain, graph, wiki) behave exactly like they will on Pages.
 */
function liveOrgans(): Plugin {
  return {
    name: 'zoetron-live-organs',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = (req.url ?? '').split('?')[0]!
        if (!/^\/(brain\.html|graph\.html|wiki\/|REPORTS\/)/.test(url)) return next()
        const file = normalize(join(DOCS, decodeURIComponent(url)))
        if (!file.startsWith(DOCS) || !existsSync(file) || !statSync(file).isFile()) return next()
        res.setHeader('Content-Type', TYPES[extname(file)] ?? 'application/octet-stream')
        res.setHeader('Access-Control-Allow-Origin', '*')
        createReadStream(file).pipe(res)
      })
    },
  }
}

// The published site lives in ../docs — that folder is the GitHub-Pages source
// and ALSO where the heartbeat writes brain.html / graph.html / wiki/*.md every
// 5 minutes. emptyOutDir must stay false so a build never deletes live output.
export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss(), liveOrgans()],
  build: {
    outDir: '../docs',
    emptyOutDir: false,
    assetsDir: 'assets',
    target: 'es2020',
  },
  server: { port: 5173 },
})
