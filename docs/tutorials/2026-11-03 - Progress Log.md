# Progress Log — November 3, 2026

## Session 8: local agents and ecological feedback

**Request (translated and paraphrased):** Complete the world simulation using the Session 8 course concepts. The student has not yet explored this week's ideas and wants an interactive, imaginative place where agents and the environment affect one another. Save the learning material and progress to GitHub.

**Implemented:** Added a separate desktop Agents workspace at `?agents=1`. Birds have individual energy, limited vision, inspectable finite states, separation/alignment/cohesion steering, and a carried-seed state. Alien visitors use arrival, sip and leave states, with a finite scheduled pool. A boba spill creates an inspectable stimulus, cups and normalized land residue. Rain transports some surface residue to a creek; decomposition affects a relative oxygen index. Shoreline plants respond to modeled water quality. A bird can move a seed to another patch, where establishment requires open ground.

**Why:** The same view now exposes the sequence from an individual need and local decision to flock motion, seed dispersal and habitat feedback. Controls isolate vision, flock response, visitor arrival and rain. Cleanup removes the land litter while creek recovery remains gradual, making the difference between a local action and a downstream effect visible.

**Evidence:** The simulation was opened in the browser; the bird inspector, connection panel, camera choices and experiment controls were visible. Clicking **Tip a boba tea** added seven pearls. After making rain, the live panel showed 0.48 normalized units on land and 0.60 in the creek, with oxygen index 94% and water clarity 88%. Both states were saved as images below. `npm run build` completed successfully. No previous Session 8 simulation existed to capture as a matched before image.

**Screenshots:** [Agents island baseline](images/2026-11-03/01-agents-island.png) and [runoff entering the creek](images/2026-11-03/02-runoff-and-recovery.png). These are saved captures from the new scene; the visitor scheduler can change counts over time.

**Learning status:** The model is implemented, but the parameter comparisons are not yet personal observations. Follow the [Session 8 tutorial](22%20-%20Session%208%20-%20Agents,%20Flocking%20and%20Ecosystems.md) to compare one parameter at a time and write down predictions and outcomes before presenting them as learning evidence.

**Boundaries:** This is an accelerated, normalized teaching model, not a forecast of bird toxicology or real water chemistry. It models attention to a visual cue, not proof that a spill is safe to eat. It does not yet include ant pheromones, crowd navigation, behavior trees, hearing or occlusion.

**Next experiment:** Reset the island, hold flock response at `0.72`, and compare vision `3 m` against `16 m`. Record the selected bird's state and perceived-neighbor count, then repeat with vision fixed and flock response `0.1` versus `1.4`.
