---
tags: [planning, world-building]
---

# Feature backlog

My next goal is to understand each change before adding another feature. These are plans, not completed work.

## Already implemented

- [x] Build a React and Three.js planet sandbox with terrain controls.
- [x] Add a wireframe toggle and switch between UV sphere and icosphere.
- [x] Record the first geometry experiment with screenshots.
- [x] Stylized low-poly world shader (flat shading, elevation bands, toon light, rim). Chose the "soft" variant. *(Visual Changelog 002)*
- [x] Interface follows the world: dark, sand accent sampled from the beach line, floating control column over a full-bleed planet. *(Visual Changelog 003–004)*
- [x] URL presets (`?shading=…&spin=0`) and a repeatable headless-Chrome screenshot command for honest before/after captures.

## Next: terrain and topology

- [x] Add a planar terrain workspace with adjustable relief and wireframe for inspecting the mesh.
- [ ] Show triangle counts when comparing the two sphere types.
- [ ] Migrate the original planet’s sine-based terrain to the shared seeded noise stack.
- [x] Add layered noise controls for frequency, amplitude, and octaves in Noise laboratory; share the stack with Simulation map.

Done when: I can reproduce a planet with the same seed and explain what each control changes.

## Then: textures and shaders

- [ ] Add a checker texture to inspect UV seams and stretching.
- [ ] Compare height-based displacement with a normal map.
- [x] Color the terrain by elevation with a shader. *(done early — stylized low-poly shader, see Visual Changelog 002/003)*
- [x] Add a sea-level control in Simulation map’s Explore perspective.
- [ ] Record a controlled ocean/land/snow comparison; elevation colors currently do not model climate.

Done when: each experiment has a prompt, screenshot, and a short observation in the tutorials.

## Later: sharing the world

- [ ] Save and reload a set of planet parameters.
- [x] Add a labeled image-export action in Simulation map.
- [ ] Verify exported PNG file delivery in the in-app browser (the download request is implemented).
- [ ] Deploy a hosted demo and link it from the main README.

## Learning workflow

Try one prompt → inspect the result → capture a screenshot → write a short note in Obsidian → commit the progress.


## Simulation playground

- [x] Add a Simulation map perspective driven by the shared Noise laboratory stack.
- [x] Add simplified grid hydraulic erosion with pause and single-step controls.
- [x] Paint localized rain and trigger a bounded 50-step storm.
- [x] Run 100 steps with automatic pause; compare current terrain with its initial field.
- [x] Add water and ground-change views with explicit legends and measurements.
- [x] Smooth terrain lighting and blend elevation colors; retain F wireframe shortcut.
- [x] Add a labeled frame-export action to the simulation workspace.
- [x] Save five September 9 screenshots of original/current terrain, water, ground change, and measurements — [progress log](../tutorials/2026-09-09%20-%20Progress%20Log.md).
- [ ] Add my own prediction and observation after the guided experiment in tutorial 04.
- [ ] Save and restore evolving water, ground, and sediment state across sessions.
- [ ] Improve hydraulic flow distribution and assess grid-direction artifacts.
- [ ] Explore optional hand tracking after the pointer/keyboard workflow is comfortable.

## Latest update — 2026-09-09

Shared noise and the erosion playground are implemented. Current screenshots document one retained step-14 experiment. For each future implemented idea, save real progress screenshots and a brief explanation in the dated learning log; update this backlog to distinguish completed work from open questions.

## Illustrated landscape preview — 2026-09-10

- [x] Add Lakeside morning and Storybook dusk palettes without resetting simulation state.
- [x] Add broad lighting bands, slope-based rock color, and restrained atmospheric haze.
- [x] Place deterministic groves using height, slope, and water thresholds.
- [x] Add Slope view, 2-unit contours, and Horizon view while retaining water/change/wireframe inspection.
- [x] Record eight real screenshots and an English learning tutorial.
- [ ] Review the preview with the owner and confirm the Nomada reference.
- [ ] Design a repeatable lake-basin and ridge noise recipe.
- [ ] Refine vegetation silhouettes, clustering, and placement transitions.
- [ ] Add coherent distant terrain layers with a clear simulated-area boundary.

See the [September 10 progress log](../tutorials/2026-09-10%20-%20Progress%20Log.md). These style changes do not complete ecological simulation or physical calibration requirements.

## Assignment 1 — Voxel Terrain (planned September 16)

- [x] Prepare an English learning guide connecting the brief to the current height-field app.
- [ ] Confirm whether “CS techniques” means CSG in the original brief.
- [ ] Add a separate Voxel Terrain tab with a bounded sphere, density slice, and working mesher.
- [ ] Explore box, capsule, terrain-volume, and 3D-noise fields.
- [ ] Implement an ordered union/subtraction/intersection stack and demonstrate a meaningful reorder.
- [ ] Compose a stylized lake-cliff arch and cave opening.
- [ ] Measure generation, meshing, memory estimates, and edit latency across resolutions.
- [ ] Explore equal-resolution chunking, localized rebuilds, and boundary correctness.
- [ ] Document greedy meshing, Marching Tetrahedra, Surface Nets, and Dual Contouring alternatives.
- [ ] Measure one voxel optimization and capture genuine before/after evidence.

The [Assignment 1 tutorial](../tutorials/06%20-%20Assignment%201%20-%20Voxel%20Terrain,%20CSG%20and%20Meshing.md) is a plan, not implementation evidence. Keep the existing hydraulic solver in its height-field workspace.


## Shared atlas style — 2026-09-17

- [x] Apply a consistent warm-paper interface across all three workspaces.
- [x] Share Forest ink / Graphite palettes and Relief / Contours / Stipple surface controls.
- [x] Keep water, slope and ground-change legends stable; remove fog from analysis colors.
- [x] Preserve active simulation measurements when changing appearance.
- [x] Record before/after screenshots, a 100-step trial and narrow-layout checks in English.
- [ ] Review the new visual direction with the owner; the September 10 palettes are superseded by this preview.
- [ ] Reuse the design system in the planned Voxel Terrain workspace.
- [ ] Compare the readability and motion stability of contour and stipple treatments.

See the [September 17 log](../tutorials/2026-09-17%20-%20Progress%20Log.md). The new style does not complete voxel meshing, simulation persistence or physical calibration.


## Owner correction — September 17, second iteration

- [x] Separate interface accent state from world materials.
- [x] Restore blue water, soil/coast, vegetation, rock and highland material distinctions.
- [x] Default to Natural materials; keep colored contours/stipple optional.
- [x] Add material legends and a hydraulic water-depth surface without changing the solver.
- [x] Record the rejected monochrome direction and corrected screenshots in the same day's log.
- [ ] Review scene recognizability separately from control-panel design.

The first September 17 shared-palette world is superseded. Future tabs should follow the revised boundary in `STYLE-GUIDE.md`.


## Illustrated world — September 17, third iteration

- [x] Add an Illustrated map mode with height/slope material shapes, hatching and water marks across all three workspaces.
- [x] Use conifer silhouettes without changing procedural tree placement.
- [x] Preserve the panel system, diagnostic scales and active simulation on appearance changes.
- [x] Capture a matched rendering comparison and record checks in English.
- [ ] Review small-screen separation between indigo rock and blue water with the owner.
- [ ] Assess whether irregular tree silhouettes and fewer, more selective pen marks improve the hand-drawn feel.

This supersedes Natural materials as the default view; that rendering remains available for comparison. It does not add real snowfall, currents, glaciers, routes or landmarks.

## October 7 checkpoint and proposed spatial studies

- [x] Save four fresh screenshots covering the three existing workspaces.
- [x] Document the retained illustrated style and run build, lint and six regression tests.
- [x] Separate completed features from voxel, shader and vector-field plans.
- [ ] Add a selectable Atmospheric illustration study with matched before/after captures.
- [ ] Test coherent directional light, grounded tree shadows and real shader fog integration.
- [ ] Test restrained view-dependent water highlights while preserving depth and shoreline meaning.
- [ ] Add visible vector arrows and particles driven by the same wind field.
- [ ] Measure frame time and resolve the existing large-bundle warning where practical.

See the [October 7 log](../tutorials/2026-10-07%20-%20Progress%20Log.md) and [visual depth review](../analysis/2026-10-07%20-%20Visual%20Depth%20Review.md). These proposed effects have not been implemented.
