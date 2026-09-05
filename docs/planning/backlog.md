---
tags: [planning, world-building]
---

# Feature backlog

My next goal is to understand each change before adding another feature. These are plans, not completed work.

## Already implemented

- [x] Build a React and Three.js planet sandbox with terrain controls.
- [x] Add a wireframe toggle and switch between UV sphere and icosphere.
- [x] Record the first geometry experiment with screenshots.

## Next: terrain and topology

- [ ] Add a flat-terrain comparison preset so mesh structure is easier to inspect.
- [ ] Show triangle counts when comparing the two sphere types.
- [ ] Replace the sine-based terrain function with seeded noise.
- [ ] Add layered noise controls for frequency, amplitude, and octaves.

Done when: I can reproduce a planet with the same seed and explain what each control changes.

## Then: textures and shaders

- [ ] Add a checker texture to inspect UV seams and stretching.
- [ ] Compare height-based displacement with a normal map.
- [ ] Color the terrain by elevation with a shader.
- [ ] Add a sea-level control and compare ocean, land, and snow regions.

Done when: each experiment has a prompt, screenshot, and a short observation in the tutorials.

## Later: sharing the world

- [ ] Save and reload a set of planet parameters.
- [ ] Add an image export button.
- [ ] Deploy a hosted demo and link it from the main README.

## Learning workflow

Try one prompt → inspect the result → capture a screenshot → write a short note in Obsidian → commit the progress.
