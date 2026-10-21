# 14 — Midterm Coverage Audit: What Is Actually Demonstrated?

Date: October 13, 2026 · Scope: Sessions 1–7, before the Session 8 exhibition

**Request, translated:** Check whether the current project covers everything the course has asked us to explore so far.

**Initial finding (revision 2):** The app has working examples for the main scheduled technical topics. Coverage is not complete in the stronger sense of controlled experiments, measured comparisons and a complete exhibition explanation. A tutorial, a feature and evidence of understanding are three different things.

This audit compares the supplied Canvas syllabus text, the instructor's public repository, the Assignment 1 checklist supplied in conversation, the current source code, existing screenshots and the automated checks. Canvas and the two Figma lecture decks could not be retrieved through the web tool. This is therefore a syllabus-level audit, not a claim to have inspected every slide, announcement or private rubric.

## Revision 3 update — recorded evidence added

The gaps below describe the earlier checkpoint. [Tutorial 15](15%20-%20Controlled%20Experiments%20and%20the%20Planet%20Finale.md) and the [5:28 full course film](../exhibition/README.md) now add fixed-seed noise, fixed-domain resolution, shader threshold, equal-step rain, moisture, density/slice, CSG, repeated voxel benchmarks, chunk-size comparison, matched wind/fluid runs, isolated grammar/angle, growth-only, reproduction and competition trials. The film includes a meshing-alternatives guide and ends with a rotating shared-noise planet.

**Evidence status:** the main Sessions 3–7 technical themes are now both implemented and represented in the film. Sessions 1–2 appear as the build/inspect/document workflow. This does not certify unseen private lecture or assignment requirements. The original planet still has its older sine model; the film globe is a separate new use of the common noise sampler. Erosion, density, fluids and ecology remain separate domains where stated. Cloud/weather physics, 3D cave water, arbitrary CSG stacks, streaming/LOD, agents and broader roadmap features remain future work. Public hosting and exhibition-device testing still need verification.

The earlier “remaining experiment” entries are retained as the audit trail; use Tutorial 15 for their updated results. Current validation: build/lint and 23 tests pass; real film frames and saved model measurements provide additional visual evidence. This is a local preview before owner review and push.

## Original checkpoint — what existed and still needed evidence

| Session | Working implementation | Evidence already available | Remaining exploration / exhibition gap |
| --- | --- | --- | --- |
| 1–2: procedural thinking, AI tools, React + Three.js | React controls, Three.js scenes, Vite, GitHub repository; setup notes, prompt records and design boundaries | Setup tutorials, dated progress logs and source history | Explain one AI suggestion that was corrected and why. Confirm the public hosted URL and test another device. Localhost alone is not a public website. |
| 3: maps and shaders | Layered Perlin/Cellular noise, modifiers, height fields, resolution controls, wireframe; height/slope materials, water shader, diagnostic views | Geometry screenshots; natural/illustrated rendering comparisons; tutorials 01–03, 05, 07–08, 12 | Save a fixed-seed frequency comparison and a fixed-world resolution comparison. Original planet uses its own sine-based terrain; it does not yet share the noise stack or an editable 2D planet map. Current three-story film does not explain the noise stack. |
| 4: erosion and biomes | Separate grid hydraulic model with ground, water and sediment; rain brush, storm, 100-step run, original comparison; Living coast classifies biomes from climate, height and slope | Real water and ground-change screenshots, conservation/finite-value tests, biome map screenshot in tutorial 12 | Equal-step low/high-rainfall trial; fixed-seed moisture/temperature A/B. Erosion arrays do not feed Living coast. Tide animation does not demonstrate erosion. |
| 5: voxels | Separate tab; five density shapes; ordered CSG; Marching Cubes; density slice; chunk bounds; local rebuilds | Sphere/CSG automated checks, cave and chunk screenshots, observed 8/27 local rebuild; tutorials 06, 09 and 12 | Matched shape/slice captures; repeat resolution/chunk-size timing trials. Alternatives are explained, not implemented. Generic editable operation stack, workers, LOD and streaming remain absent. |
| 6: fields, fluids, wind, atmosphere | Shared arrows/tracers in prescribed Wind mode; separate 2D fluid velocity/dye advection and approximate pressure projection; coast current field, leaf motion and haze | Fluid screenshot with pre/post divergence; projection test; tutorial 10 and 12 | Save reset-matched 0 vs 40 pressure-iteration trials and constant-wind distance/reversal trials. No cloud condensation, weather solver or cave-water system. Leaf sway is a separate procedural shader, not a fully coupled atmospheric field. Main film does not show the fluid laboratory. |
| 7: vegetation, L-systems, ecosystems | Bounded 3D grammar, skeleton/foliage view; suitability distribution; stored age, size and health; growth, seeds, competition and mortality | 25%/75% initial-density screenshots; tree specimen; deterministic growth, zero-rate and flooding tests; tutorials 11–13 | Compare branch angle/iterations in isolation, then equal-time growth/reproduction/competition runs. The film shows population growth; it does not replace the isolated grammar explanation. Existing branches scale with age rather than generating new modules over time. |

## Assignment 1, item by item

- **Separate voxel tab:** implemented.
- **Different density shapes:** Terrain, Sphere, Box, Ridged and Noise volume implemented. More matched visual trials are needed; a menu alone does not prove that every shape has been explored.
- **Sequential operations:** meaningful cut/add reorder and intersection implemented. The UI exposes a specific sequence, not an arbitrary reorderable CSG stack. “CS techniques” is interpreted as CSG from the supplied brief; the original wording has not been independently confirmed.
- **Size/performance and chunking:** cell and chunk controls, triangle counts, estimated density storage and measured mesh time exist. Tutorial 12 has one full/local observation. Repeated resolution/chunk benchmarks are still missing.
- **Meshing:** working Marching Cubes with interpolated surface and gradient normals. Tests verify sphere accuracy, outward winding and equivalent triangle count across equal-resolution chunks; this is not a proof that every ambiguous case is watertight.
- **Alternative meshers:** conceptual comparisons of greedy cubes, Marching Tetrahedra, Surface Nets and Dual Contouring are documented. The supplied brief asks to document and understand alternatives; it does not explicitly require implementing all of them.
- **Voxel optimization:** cached meshes and local rebuilds implemented and observed. Worker meshing, mixed-resolution seams, streaming, LOD and GPU meshing are future work.

## Wider course roadmap: do not confuse it with this week's checklist

The instructor's repository also describes sphere mapping, planet voxels, painting maps, flood-fill, later populations, networks and performance work. These are broader roadmap items rather than evidence that every item is due at midterm. Our gaps include editable 2D-to-sphere maps, spherical voxels, a dedicated flood-fill experiment, towns, agents, schedules and persistent saved worlds.

The supplied syllabus schedules evolutionary solvers, agents/behavior, cultures and later optimization after midterm. Those are future coursework. Its exhibition description also mentions cities broadly, but the supplied Sessions 1–7 schedule does not contain a specific city exercise. Confirm that expectation with the instructor rather than inventing an additional deadline.

## What to show at the exhibition

The revised tide/cave/forest film is a focused public introduction. It is not the full procedural atlas. Keep the research studio available for the remaining studies:

1. **Map → terrain:** change one noise frequency with the seed held fixed; explain the sampling grid.
2. **Rain → changed ground:** run the erosion study and switch to Ground change; identify erosion versus deposition.
3. **Climate → biome:** show moisture and biome maps with the same terrain.
4. **Solid → cave:** radius, CSG order, slice and local chunk rebuilding.
5. **Velocity → transport:** switch Wind/Fluid and explain pressure projection with divergence readouts.
6. **Grammar → tree → population:** one isolated skeleton first, then growth, births and competition.

For each: state the question, name the parameter, show the change, and name one limit. This is the most useful remaining work before adding another decorative feature.

## Learning insight

“More complete” should mean that the connection between a rule and an outcome is clearer. Water can be a shaded surface, a prescribed tide, hydraulic depth or a transported dye field. These representations answer different questions. A good demonstration says which one it is using.

**Development check:** production build succeeds; 16 automated tests pass, including three new film checks for rule/time separation, matched comparison cameras and state-driven captions. Tests are evidence of behavior within their cases, not proof of ecological or fluid realism. The base JavaScript bundle still triggers a size advisory.

**Suggested learner reflection, not an observation supplied by the student:** Which parameter can I explain without asking AI? What did I predict before changing it, and what surprised me afterward?

## Sources and evidence

- [Canvas syllabus](https://canvas.cornell.edu/courses/88097/assignments/syllabus): supplied text used for the schedule and exhibition scope; live access unavailable in this check.
- [Instructor repository](https://github.com/jomasan/Procedural-World-Building) and [learning path](https://github.com/jomasan/Procedural-World-Building/blob/main/docs/learning-path.md).
- [Connected experiments and real screenshots](12%20-%20Connected%20Worlds%20-%20Coast,%20Caves%20and%20Living%20Forests.md).
- [Noise](../../app/src/noiseEngine.ts), [hydraulic solver](../../app/src/hydraulic.ts), [world/ecology rules](../../app/src/worldSystems.ts), [voxel mesher](../../app/src/voxelEngine.ts), [fluid solver](../../app/src/fluidEngine.ts), [branching and shaders](../../app/src/natureRendering.ts).
- [Feature backlog](../planning/backlog.md). Historical planning sections are not current completion evidence.
