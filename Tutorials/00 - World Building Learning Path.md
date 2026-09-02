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

### How they connect to the course weeks

| Course week | Topic | My note |
|---|---|---|
| 1 | Terrain foundations (noise, heightmaps) | [[02 - Textures, UVs & Heightmaps]] |
| 2 | Sphere mapping & geometry | [[01 - Geometry & Topology for Planets]] |
| 3 | Voxel terrain | [[01 - Geometry & Topology for Planets]] |
| 5 | Vector fields & atmospheres | [[03 - Shaders 101 for World Builders]] |
| 8 | Performance (LOD, streaming) | all three |

## How I study each note (with AI)

For every concept I follow the same loop:

1. **Read** the note's explanation (10 min)
2. **Run** the tiny Three.js exercise in a Vite sandbox (`npm run dev`)
3. **Break it** — change one number, predict what happens, check
4. **Ask the AI** the note's suggested prompts when stuck, giving it my actual code/error
5. **Write back** one sentence in the note: what surprised me

> [!tip] Golden rule
> Never copy code you can't predict the output of. If you can't predict it, that's the next question for the AI.
