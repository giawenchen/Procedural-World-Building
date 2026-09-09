---
tags: [procedural-world-building, moc, learning-path]
course: Procedural World Building (Cornell Tech)
created: 2026-09-02
---

# 00 — World Building Learning Path (Start Here)

> A map of my notes for learning procedural world building. Order matters: each note builds on the previous one.

## The big picture

Everything you see in a 3D world is the result of three questions:

1. **What shape is it?** → geometry & **topology** (vertices, faces, how a sphere is built)
2. **What's on its surface?** → **textures** & UV mapping (color, bumps, heightmaps)
3. **How is it drawn?** → **shaders** (the GPU programs that turn 1 + 2 into pixels)

Procedural world building = generating all three **with algorithms instead of by hand**.

## Reading order

### Setup (done ✅)
1. [[Why React & Three.js]] — why this stack
2. [[How to Get Started with Node.js in Cursor & Claude]] — environment setup with AI

### Core concepts (this series)
3. [[01 - Geometry & Topology for Planets]] — meshes, normals, and why sphere topology is a real problem
4. [[02 - Textures, UVs & Heightmaps]] — how surfaces get their look, and how a grayscale image becomes terrain
5. [[03 - Shaders 101 for World Builders]] — vertex & fragment shaders, GLSL, displacing a planet on the GPU

6. [[04 - Simulation Map and Hydraulic Erosion]] — shared noise, water flow, stepping, and visual comparisons

### Ongoing records

- [[Visual Changelog]] — screenshots of UI and scene changes
- [[2026-09-09 - Progress Log]] — today’s prompts, five saved screenshots, and the terrain playground

### Progress so far (2026-09-09)

- Geometry: UV sphere / icosphere comparison and wireframe exercise recorded.
- Shaders: the original planet has a stylized low-poly shader; simulation terrain now uses smooth lighting and blended height colors.
- Noise: layered Perlin, Cellular, and Sine controls drive the laboratory previews and Simulation map. Migrating the original planet to this stack remains open.
- Simulation: rainfall, erosion, deposition, batch stepping, and diagnostic views implemented. Five screenshots preserve one paused step-14 experiment.
- Visual Changelog: entries 001–005; entry 005 links the terrain comparison views.

### Topic connections

Geometry sets the sampling grid. Noise supplies initial heights. Materials help read the surface. Erosion changes heights over steps. Resolution and performance affect how much detail can be represented. These are learning connections, not an official course timetable.

## How I study each note (with AI)

For every concept I follow the same loop:

1. **Read** the note's explanation (10 min)
2. **Run** the tiny Three.js exercise in a Vite sandbox (`npm run dev`)
3. **Break it** — change one number, predict what happens, check
4. **Ask the AI** the note's suggested prompts when stuck, giving it my actual code/error
5. **Write back** one sentence in the note: what surprised me

> [!tip] Golden rule
> Never copy code you can't predict the output of. If you can't predict it, that's the next question for the AI.
