---
tags: [procedural-world-building, moc, learning-path]
course: Procedural World Building (Cornell Tech)
created: 2026-09-02
---

# 00 — World Building Learning Path (Start Here)

> A map of my notes for learning procedural world building. Order matters: each note builds on the previous one.

## New working studies

Start [Tutorial 12 — Connected Worlds](12%20-%20Connected%20Worlds%20-%20Coast,%20Caves%20and%20Living%20Forests.md) for the implemented coast, caves and fluid laboratory, with real screenshots, course links and step-by-step parameter trials.

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

7. [[05 - Stylized Landscapes and Procedural Detail]] — combine an illustrated world with height, slope, and placement rules

8. [[06 - Assignment 1 - Voxel Terrain, CSG and Meshing]] — planned voxel tab, density shapes, sequential operations, meshing, and chunking

9. [[07 - A Consistent Visual Language for Procedural Worlds]] — separate panel style from readable world materials; use optional overlays and stable data colors

10. [[08 - Nature Studio, Shadows and Tree Distribution]] — a shared research interface, readable light, and deterministic tree controls

11. [[09 - Session 5 - Voxels and Spatial Density]] — density slices, sequential CSG, meshing and measured chunking experiments
12. [[10 - Session 6 - Vector Fields, Fluids and Atmosphere]] — direction fields, particle advection, fixed time steps and the boundary between animation and fluid simulation
13. [[11 - Session 7 - L-systems, Growth and Ecosystems]] — existing distribution, branching grammar and future population dynamics

### Course alignment and insights

- [[2026-10-07 - Nature Studio Course Progress]] — Sessions 3–7, parameter tables, actual density trials, screenshots and remaining implementation work
- [[2026-10-07 - Learning Insights - Sessions 3 to 7]] — what each concept changes about the project and what to test next

Sessions 5 and 6 remain planned implementations. Session 7 has distribution controls but no L-system or lifecycle yet. The session numbering follows the student's supplied schedule.

### Ongoing records

- [[2026-10-07 - Progress Log]] — illustrated checkpoint, Nature Studio redesign, course alignment and controlled tree-density trials

- [[2026-09-17 - Progress Log]] — a consistent atlas style across all tabs, with before/after captures and a verified 100-step trial
- [[2026-09-16 - Progress Log]] — Assignment 1 explanation and implementation plan; voxel work is not implemented yet
- [[Visual Changelog]] — screenshots of UI and scene changes
- [[2026-09-10 - Progress Log]] — Lake / Neva style preview, contours, slope, and rule-based groves
- [[2026-09-09 - Progress Log]] — today’s prompts, five saved screenshots, and the terrain playground

### Progress so far (2026-10-07)

- Geometry: UV sphere / icosphere comparison and wireframe exercise recorded.
- Shaders: natural world materials are independent of interface accents; optional contours and stipple retain geographic colors. Diagnostic scales keep fixed meanings.
- Noise: layered Perlin, Cellular, and Sine controls drive the laboratory previews and Simulation map. Migrating the original planet to this stack remains open.
- Simulation: rainfall, erosion, deposition, batch stepping, and diagnostic views implemented. Five screenshots preserve one paused step-14 experiment.
- Visual Changelog: entries 001–012; entry 011 tests Nature Studio and entry 012 records the density comparison and course documentation.

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
