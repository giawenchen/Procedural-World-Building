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

**As of 2026-09-09**, the app has three workspaces:

- **Planet:** the original terrain controls, UV sphere / icosphere comparison, and stylized low-poly shader.
- **Noise laboratory:** seeded Perlin, Cellular, and Sine layers with shaping, blending, and 2D/3D previews.
- **Simulation map:** a height field driven by that shared stack, keyboard exploration, and a hydraulic erosion playground. Paint rain, trigger a storm, advance 100 steps, and inspect Water or Ground change alongside the original terrain.

[Today’s learning log](docs/tutorials/2026-09-09%20-%20Progress%20Log.md) records the prompts, explanations, and five real screenshots of a paused step-14 experiment. [Tutorial 04](docs/tutorials/04%20-%20Simulation%20Map%20and%20Hydraulic%20Erosion.md) walks through the controls. The [Visual Changelog](docs/tutorials/Visual%20Changelog.md) preserves earlier design decisions and the new comparison views.

![Ground-change view in the simulation playground](docs/tutorials/images/2026-09-09/03-ground-change-step-14.jpg)

The simulation terrain uses smooth lighting and blended elevation colors; the original planet keeps its low-poly style and earlier sine terrain. The hydraulic model is educational: its steps and units are not calibrated to real geological time.

Next: save/restore evolving simulations, improve water-flow distribution, verify PNG export delivery, and connect the original planet to the shared noise stack. The [style guide](STYLE-GUIDE.md) continues to guide the dark interface and sand accent.

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
