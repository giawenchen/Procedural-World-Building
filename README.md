# Procedural World Building

Student project for Cornell Tech **Procedural World Building**.

I am learning to build a procedural planet in the browser using React, TypeScript, and Three.js. My notes record the prompts I try, the changes I observe, and screenshots of each experiment.

## Explore the project

- [Planning and feature backlog](docs/planning/backlog.md)
- [Tutorials and learning path](docs/tutorials/00%20-%20World%20Building%20Learning%20Path.md)
- [Assignment 1: voxel terrain tutorial and plan](docs/tutorials/06%20-%20Assignment%201%20-%20Voxel%20Terrain,%20CSG%20and%20Meshing.md) — preparation only; the voxel tab is not implemented yet
- [Inspiration gallery and reference library](docs/library/README.md)
- [Analysis notes](docs/analysis/README.md)
- [Application source](app/)

## Current progress

**As of 2026-10-07**, the app has three workspaces:

- **Original planet:** sine-based radial terrain, UV sphere / icosphere comparison, and smooth or faceted shading.
- **Noise laboratory:** seeded Perlin, Cellular and Sine layers, shaping, blending, and linked 2D/3D previews.
- **Simulation map:** a shared-noise height field, keyboard exploration, and simplified hydraulic erosion with rain painting, storms, batch steps and diagnostic views.

The revised **Fieldwork / Procedural atlas** separates a warm-paper control-panel style from the world display. Interface accents no longer recolor the earth. The default Illustrated map uses conifer silhouettes, indigo rock faces, pale summits and blue water with pen marks. Natural materials and optional colored contour/stipple overlays remain available. Material legends and fixed diagnostic scales explain each view.

![Illustrated land and sea with the quiet control-panel style](docs/tutorials/images/2026-10-07/02-illustrated-coast.jpg)

The [September 17 learning log](docs/tutorials/2026-09-17%20-%20Progress%20Log.md) includes before/after screenshots, a 100-step experiment and mobile checks. [Tutorial 07](docs/tutorials/07%20-%20A%20Consistent%20Visual%20Language%20for%20Procedural%20Worlds.md) explains how to change the art direction without hiding procedural phenomena. The [Visual Changelog](docs/tutorials/Visual%20Changelog.md) preserves earlier iterations.

The noise sampler and educational hydraulic solver are unchanged. Style changes preserve the active simulation, but leaving Simulation map still resets it. Groves illustrate placement rules rather than ecological growth; simulation steps are not real-world days. The voxel tab remains planned.

The [October 7 checkpoint](docs/tutorials/2026-10-07%20-%20Progress%20Log.md) records four fresh screenshots, current checks, and the distinction between implemented features and future work. The [visual depth review](docs/analysis/2026-10-07%20-%20Visual%20Depth%20Review.md) proposes game-inspired shader studies; those changes are not implemented yet. Persistent simulation storage, improved flow distribution and verified PNG delivery remain open in the [backlog](docs/planning/backlog.md). Current visual rules live in the [style guide](STYLE-GUIDE.md).

## Run locally

With Node.js and npm installed:

```bash
cd app
npm install
npm run dev
```

Open the local URL printed by Vite in the terminal.

Validation from `app/`: `npm run build`, `npm run lint`, and `npm run test:simulation` (the simulation tests need a Node.js version that supports `--experimental-strip-types`).

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
