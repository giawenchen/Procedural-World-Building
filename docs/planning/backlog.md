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
