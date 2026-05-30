# Ashish Jha Portfolio

Logic Meets Rhythm is a static developer portfolio for Ashish Jha, also known as `marshal4world`. It is built from scratch with semantic HTML, vanilla CSS, and client-side JavaScript.

## Features

- Responsive cyber-glass portfolio design
- Dark and light theme toggle with local storage persistence
- Interactive hero canvas particle network
- Custom logic and rhythm canvas visualizer
- Project filtering by category
- SEO and Open Graph metadata
- Generated `assets/hero_art.png` hero artwork
- Vercel-ready static deployment

## Run Locally

```bash
python3 -m http.server 8000
```

Open `http://localhost:8000`.

## Deploy To Vercel

This project is a static site. In Vercel:

- Framework preset: `Other`
- Build command: leave empty
- Output directory: `.`

CLI option:

```bash
npx vercel
```

## Regenerate Hero Art

The hero PNG is generated locally from a deterministic script:

```bash
node scripts/generate-hero-art.js
```
