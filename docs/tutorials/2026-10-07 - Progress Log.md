---
tags: [progress-log, screenshots, shaders, world-building]
date: 2026-10-07
---

# October 7 — Illustrated world checkpoint

## Request

**User request, translated:** Save the current visual screenshots and progress to GitHub before making further changes. With the new course topics, should the art direction change? Does the current world feel too flat, and what can we learn from game shaders?

## What this checkpoint preserves

This records the existing illustrated version, including the previously uncommitted September work. No new rendering, terrain, or simulation behavior was implemented today. The warm-paper controls remain separate from the world palette. Water is blue, vegetation green, ground ochre, rocks indigo, and high terrain pale.

The app has three working tabs: Original planet, Noise laboratory, and Simulation map. Voxel terrain has an English tutorial and backlog, but no implemented tab. Vector-field weather and particle-based fluid demonstrations are also still planned.

## Current screenshots

These are fresh browser captures of the current local build, taken in a separate preview so an existing experiment would not be reset. Each JPEG is 1320 × 960. The preview used approximately 2000 × 1454 CSS pixels at the browser's existing zoom, so controls appear small. The temporary device-size override was cleared after capture. These are baseline records, not a matched before/after comparison with September images.

### 1. Hydraulic erosion — paused at step zero

![Current illustrated height field, before rainfall](images/2026-10-07/01-illustrated-terrain-step0.jpg)

The 192 × 192 unit field uses 96 × 96 cells. Groves are enabled. No rainfall steps have run; zero surface water is expected. This screenshot does not demonstrate a new erosion result.

> Side note: land-cover colors are readable. The next question is whether the hills still feel solid when those colors are less prominent.

### 2. Explore — land and sea

![Current illustrated coast in Explore mode](images/2026-10-07/02-illustrated-coast.jpg)

Paused at X = 0, Z = 0 with the default camera. The blue surface marks sea level; its white pen marks are decorative and do not measure flow. The view makes it easier to judge separation between water, shore, vegetation, and rock.

> Side note: the water reads clearly as water, but it behaves visually more like a printed pattern than a changing surface.

### 3. Noise laboratory

![Current noise map and displaced terrain](images/2026-10-07/03-noise-laboratory.jpg)

Plane / Split view, 64 segments, displacement 0.8. Base Perlin layer: seed 17, frequency 2, amplitude 1, three octaves, persistence 0.5, no shaping. The grayscale map and mesh use the same samples. This is a height study, not a water or biome simulation.

### 4. Original planet

![Current planet with illustrated material bands](images/2026-10-07/04-original-planet.jpg)

Radius 2, resolution 80, elevation 0.35, frequency 2.8, UV sphere, Low-poly soft. Auto spin was switched off in the separate preview for capture. Its rotation is not a reproducible numeric camera bookmark. The planet still uses its original radial terrain function rather than the shared noise stack.

## Why the current look can feel flat

The palette and silhouettes already communicate materials. The main missing cues are spatial: trees do not cast ground shadows, distant terrain has little atmospheric separation, and water has no view-dependent reflective response. The current world shader contains directional bands and ink-like marks, but more marks alone will not resolve these gaps.

Code inspection also found that setting scene fog does not automatically apply fog to the custom terrain shader: it has no fog integration, and tree materials disable fog. A future depth study must implement and verify that behavior explicitly.

See [Visual depth review and game references](../analysis/2026-10-07%20-%20Visual%20Depth%20Review.md) for the proposed direction. These are suggestions, not completed features.

## Checks actually run

- Production build passed.
- Lint passed.
- All six simulation / landscape regression tests passed.
- All three tabs rendered in the browser; no captured console errors.
- Four current JPEG screenshots were saved and visually inspected.
- The build still reports a JavaScript bundle above 500 kB; this checkpoint does not resolve that performance warning.
- Notes were updated through the shared Obsidian Tutorials path. Image links resolve on disk; rendering inside the Obsidian app was not verified today.

## Next experiment — proposed

Keep this illustrated baseline and add a selectable **Atmospheric illustration** study. First test directional light, grounded tree shadows, and restrained distance haze using the same seed, camera, resolution, and simulation step. Capture a matched comparison before adding water reflections or particles. Keep the control-panel design and diagnostic color scales unchanged.

After that, use visible vector arrows and a small set of leaf or mist particles to show a velocity field. Toggle the arrows off for the expressive view. This connects the new course topic to something observable rather than adding motion with no explained cause.
