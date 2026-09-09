# Procedural World Building

Student project for Cornell Tech **Procedural World Building**.

I am learning to build a procedural planet in the browser using React, TypeScript, and Three.js. My notes record the prompts I try, the changes I observe, and screenshots of each experiment.

## Explore the project

- [Planning and feature backlog](docs/planning/backlog.md)
- [Tutorials and learning path](docs/tutorials/00%20-%20World%20Building%20Learning%20Path.md)
- [Inspiration gallery and reference library](docs/library/README.md)
- [Analysis notes](docs/analysis/README.md)
- [Application source](app/)

## Current progress

**Week 1–2 (as of 2026-09-08).** Planet Studio is a full-bleed planet with a floating control column:

- Terrain controls (radius, resolution, elevation, noise frequency) and UV sphere / icosphere topology with a wireframe toggle — [geometry tutorial](docs/tutorials/01%20-%20Geometry%20%26%20Topology%20for%20Planets.md)
- A custom low-poly shader: flat shading from screen-space derivatives, elevation colour bands, 4-step toon lighting, coloured shadows, rim light — [shader tutorial](docs/tutorials/03%20-%20Shaders%20101%20for%20World%20Builders.md)
- Four UI iterations documented with before/after screenshots, including one rejected direction — [Visual Changelog](docs/tutorials/Visual%20Changelog.md)
- A [style guide](STYLE-GUIDE.md) whose palette is sampled from the rendered world

Next: replace the sine-based terrain with seeded, layered noise so the mountains (and the snow line) become real.

## Run locally

With Node.js and npm installed:

```bash
cd app
npm install
npm run dev
```

Open the local URL printed by Vite in the terminal.

## Repository layout

```text
app/                React + TypeScript + Three.js sandbox
docs/planning/      Feature backlog and plans
docs/tutorials/     Learning notes, visual changelog, and screenshots
docs/analysis/      Observations, comparisons, and rejected experiments
docs/library/       Inspiration gallery and reference reading
STYLE-GUIDE.md      Design direction and palette tokens
```

The tutorials are also accessible through my Obsidian vault. Images stay beside the tutorials in `images/`.
