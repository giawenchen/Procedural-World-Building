# Learning Insights — Sessions 3 to 7
Date: 2026-10-07

These are explanations drawn from the current implementation and the linked study tutorials. They are not invented personal reflections or a claim that all course features are complete.

## Follow-up after implementation

The earlier sections below record the planning checkpoint. The new [Connected Worlds tutorial](12%20-%20Connected%20Worlds%20-%20Coast,%20Caves%20and%20Living%20Forests.md) adds actual evidence:

- **Session 3:** leaf cutouts, branching silhouettes and shadows add readable detail without replacing geometric inspection. Unlit diagnostics keep data separate from lighting.
- **Session 4:** at a +4 u tide the trail was disconnected; at −4 u it returned. Reef colonies stayed fixed while exposure changed. Classification and appearance are separate controls.
- **Session 5:** a local cave edit rebuilt 8 of 27 chunks. Chunking limits invalidation; it does not remove total storage cost.
- **Session 6:** fluid projection reduced measured divergence from 0.20236 to 0.13739 at eight seconds. Prescribed coastal currents do not become a pressure solver just because they animate.
- **Session 7:** 104 initial plants became 145 after 70 births and 29 deaths in the tide experiment. Grammar defines branch structure; persistent state defines a population history. A 300-plant cap is a rendering constraint, not an ecological explanation.

These are development observations. The models are deliberately simplified and not calibrated to physical or biological time.

## Session 3 — A convincing image is not the same as a detailed model

**Observed:** the same terrain can use Natural illustration or the archived Illustrated map treatment without advancing erosion. Shadows improve spatial reading while the height samples stay the same.

**Insight:** geometry determines what surface exists; a shader determines how that surface is drawn. A smooth shader can hide coarse sampling, so inspect wireframe and the height map before increasing visual detail.

**Next trial:** frequency 1/2/4, then resolution 32/64/128 at fixed seed. Change one variable, record its effect, and distinguish sampling artifacts from style choices.

## Session 4 — A green area is not yet a biome

**Observed:** the app changes ground and water through an educational erosion solver. Its material colors use height and slope; its tree exclusions use terrain and water thresholds.

**Insight:** a biome model needs explicit environmental variables and classification rules. A palette alone cannot establish moisture, temperature or ecological suitability.

**Next trial:** reset between rainfall 0/0.015/0.03 trials and compare equal step counts. Then design moisture and temperature maps before connecting them to biome names. Steps are not calibrated days.

## Session 5 — A new kind of shape may need a new kind of data

**Current limit:** one ground height per horizontal location cannot represent an interior cave beneath a roof.

**Insight:** voxels change the representation to a 3D scalar field. Meshing is a second decision; a voxel-based world does not have to look like cubes. Chunking controls how parts are stored and rebuilt, but does not remove the cost of a fully loaded world.

**Next trial:** [sphere → slice → cave subtraction → chunk seam](09%20-%20Session%205%20-%20Voxels%20and%20Spatial%20Density.md). Save timings and counts, not just the prettiest screenshot. No voxel implementation is present yet.

## Session 6 — Motion needs an inspectable cause

**Current limit:** static water marks and shader fog do not demonstrate fluid or atmosphere simulation.

**Insight:** a vector field gives direction and magnitude; particles reveal its paths. A prescribed field and a solved fluid are different levels of modeling. Time-step behavior matters even if both look attractive.

**Next trial:** [constant wind → rotating field → particle advection](10%20-%20Session%206%20-%20Vector%20Fields,%20Fluids%20and%20Atmosphere.md). Compare the same simulated duration and verify the constant-speed distance. Wind is not implemented yet.

## Session 7 — Distribution, structure and population are separate

**Observed:** at step zero, density 25% placed 62 trees and 75% placed 174. Restoring 53% returned to 125. Terrain and water measurements did not change.

**Insight:** this is deterministic placement. Branching needs its own grammar; population change needs persistent individuals, time and interaction rules. A density slider does not create a lifecycle.

**Next trial:** compare clustering at fixed density, then [build one L-system tree](11%20-%20Session%207%20-%20L-systems,%20Growth%20and%20Ecosystems.md). Introduce growth and reproduction only after the single-tree structure is understandable.

## What this means for the visual direction

Keep the Nature Studio interface and the readable world palette. Let each new concept add a useful view: a density slice for solids, arrows for direction, a branch skeleton for plant structure. Richer explanations can come from better data and controls rather than a complete visual restyle.

> Side note: a good screenshot should let someone point to a change and connect it to a parameter.

## How to learn with AI from here

1. State one question: “What does this parameter change?”
2. Ask for one bounded implementation with a known control case.
3. Predict a result before running it.
4. Save the actual parameters, screenshot and numerical result.
5. Record what disagreed with the prediction.
6. Separate finished work from the next proposed experiment.

Reusable prompt:

> Work on one course concept at a time. Name the data representation, explain each parameter and its units, and identify which controls reset state. Keep the existing style and preserve my active experiment. Run a controlled comparison, save real screenshots, and update the English progress note with observed results and remaining limitations.

[Full checkpoint and evidence](2026-10-07%20-%20Nature%20Studio%20Course%20Progress.md)
