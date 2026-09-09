---
tags: [world-building, references]
---

# Reference Library

Suggested order for the existing React + Three.js sandbox. Read only what supports the current experiment. Links checked on 2026-09-04.

## 1. Understand the scene

[Three.js Fundamentals](https://threejs.org/manual/en/fundamentals.html)

Read first if scene, camera, mesh, and renderer still feel interchangeable.

**Checkpoint:** Point to each of these in App.tsx.

- [ ] Read
- [ ] Tried in the sandbox

## 2. Build terrain from numbers

[Red Blob: Making maps with noise](https://www.redblobgames.com/maps/terrain-from-noise/)

Focus on frequency and octaves first; revisit biomes afterward.

**Checkpoint:** Predict the effect of frequency before moving the slider.

- [ ] Read
- [ ] Tried in the sandbox

## 3. Understand texture mapping

[Three.js Textures](https://threejs.org/manual/en/textures.html)

Study loading, wrapping, filtering, and texture dimensions.

**Checkpoint:** Explain why a checker pattern stretches on a sphere.

- [ ] Read
- [ ] Tried in the sandbox

## 4. Learn shader noise

[The Book of Shaders: Noise](https://thebookofshaders.com/11/)

A fragment-shader learning resource; examples need adaptation to your Three.js setup.

**Checkpoint:** Display grayscale noise before adding terrain colors.

- [ ] Read
- [ ] Tried in the sandbox

## 5. Layer detail

[The Book of Shaders: fBm](https://thebookofshaders.com/13/)

Read after basic noise. Focus on combining frequencies and amplitudes.

**Checkpoint:** Compare one, three, and five layers with the same input coordinates.

- [ ] Read
- [ ] Tried in the sandbox

## 6. Study a complete effect

[Three.js ocean source](https://github.com/mrdoob/three.js/blob/dev/examples/webgl_shaders_ocean.html)

Advanced reference. The moving dev branch may differ from the installed Three.js version.

**Checkpoint:** Identify which parts are water, sky, controls, and animation before copying anything.

- [ ] Read
- [ ] Tried in the sandbox

## Asset shelves

- [Kenney Nature Kit](https://kenney.nl/assets/nature-kit): stylized vegetation and landscape assets to inspect after placeholder geometry works.
- [Poly Haven textures](https://polyhaven.com/textures): surface material references for rock, ground, and sand.

When using an asset, record the specific asset page, creator, and license in the experiment note. A collection link alone is not enough to identify what was used.

## Asking AI for help

> I am working in the existing app/ sandbox. Use this resource: [URL]. First explain the one concept relevant to my current experiment. Inspect my installed dependencies, then suggest the smallest change. After implementing, tell me how to verify it and help me record the prompt, screenshot, and actual result in Obsidian. Do not mark a feature complete until it has been checked.

## Maintenance

Update this library when a useful source is found or an experiment is completed. Keep personal observations in your own words. Move only selected implementation ideas into the feature backlog.
