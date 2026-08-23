# Zoetron Landing Page (`site/`)

The public page at **https://djlex83.github.io/zoetron/** is a React + Vite +
Tailwind + GSAP app that lives here and builds into `../docs`.

```bash
npm install
npm run dev     # http://localhost:5173
npm run build   # writes ../docs/index.html + ../docs/assets/*
```

## Rules of the house

- **`emptyOutDir` stays `false`.** `docs/` is not ours alone: Zoetron's
  heartbeat writes `docs/brain.html`, `docs/graph.html` and `docs/wiki/*.md`
  there every ~5 minutes. A build that empties the folder would delete the
  organism's live output.
- **Never name a folder `src/`, `scripts/` or `tests/`** inside this repo —
  the root `.gitignore` blocks those names everywhere to keep the Python
  source private. That is why the app lives in `app/` and the build helper in
  `tools/`.
- `tools/snapshot.mjs` runs before every build and freezes the current
  `data/*.json` numbers into `public/state.json` → `docs/state.json`. It is
  only the seed; everything that can be live is re-fetched in the browser.

## What is actually live on the page

| Block | Source | Refreshed |
|---|---|---|
| Hero brain + brain section | `docs/brain.html` (neurons + synapses parsed out of it, drawn on our own canvas) | every heartbeat |
| Zoetron's own view tab | `docs/graph.html` in an iframe | every heartbeat |
| Ideas board | `docs/wiki/Ideen.md` | every heartbeat |
| Leaderboard / strongest synapses | `docs/wiki/Tabelle.md` | every heartbeat |
| Memory stream | `data/GEDAECHTNIS.md` via raw.githubusercontent | every heartbeat |
| Heartbeat pulse ("vor 3 Min") | GitHub commits API | every 90 s in the browser |
| Genome, missions, tools, weekly report | `docs/state.json` (build-time seed) | on rebuild |

The page states its own build time in the footer, so a stale seed is visible
rather than hidden.

## Debugging

Append `?still=1` to freeze every animation (useful for screenshots and for
reproducing what a `prefers-reduced-motion` visitor sees).
