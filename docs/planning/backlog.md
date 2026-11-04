---
tags: [planning, world-building]
---

# Feature backlog

My next goal is to understand each change before adding another feature. These are plans, not completed work.

## October 20 — observable rules, local review

- [x] Add eleven interactive A/B studies with matched cameras, repeatable starting conditions, reset and applied values.
- [x] Make dry/cold desktop seeds wait; require two continuous suitable model seconds before rooting.
- [x] Preserve seed identity, current plants and elapsed time when desktop climate changes.
- [x] Expose a germination habitat map and local seed thresholds.
- [x] Keep real parent IDs for offspring; prevent flooded adult growth and reproduction.
- [x] Capture browser evidence and document the same-seed dry-to-wet test in Obsidian.
- [ ] Compare two tracked desktop seed flights at equal duration with no keyboard steering.
- [ ] Add seed viability/expiry rather than indefinite waiting, if useful for the research question.
- [ ] Couple erosion or soil-water transport to desktop habitat only after defining and testing that connection.
- [ ] Owner review and public desktop deployment; no new push or deployment in this update.

## Current coverage checkpoint — October 13, revision 2

See the [course coverage audit](../tutorials/14%20-%20Midterm%20Coverage%20Audit.md) for the current implementation/evidence distinction. Historical unchecked items below may have been implemented later; the connected-world inventory identifies those features. No topic is complete merely because a tutorial exists.

- [x] Build and record a comparison film with parameter animations, camera orbits and state-driven captions.
- [x] Audit Sessions 1–7 and the supplied Assignment 1 checklist against code and existing evidence.
- [ ] Owner review of the revised local film before publishing this revision.
- [ ] Capture fixed-seed noise frequency/resolution comparisons.
- [ ] Capture equal-step rainfall and fixed-terrain climate/biome comparisons.
- [ ] Repeat voxel resolution/chunk timing trials rather than relying on one measurement.
- [ ] Capture pressure iterations 0 vs 40 and constant/reversed wind trials.
- [ ] Compare isolated branch angle/depth and equal-time population rules.
- [ ] Verify a public hosted URL and playback on the exhibition display.

## Exhibition readiness — October 13

- [x] Separate exhibition entrance with a large viewport and three resettable studies.
- [x] Reproducible tide, CSG and forest presets with optional detailed controls.
- [x] Actual-renderer recording with English captions and a repeatable cue script.
- [x] Original ambient music and silent MP4 backup files.
- [ ] Test comprehension with a visitor and test playback on the exhibition display.

## Connected-world implementation — October 7 update

- [x] A* trail with water exclusions, slope cost and flooded-route feedback.
- [x] Explicit moisture/temperature biome classification and diagnostic maps.
- [x] Sinusoidal tides, fixed shallow warm-water reef placement and exposure readout.
- [x] Prescribed current/wind vectors and advected tracers.
- [x] Separate 2D fluid advection and approximate pressure projection with divergence metrics.
- [x] Voxel study: density shapes, ordered CSG, slices and Marching Cubes.
- [x] Cached equal-resolution chunks and local-edit rebuild measurements.
- [x] L-system branches and persistent growth, seeds, competition, health and mortality.
- [x] Detailed leaf cutouts, grass, rocks, shadows, terrain variation and depth-aware coastal water.
- [x] Retain study state during tab navigation and pause hidden studies.
- [x] English parameter tutorial and real screenshots: [Tutorial 12](../tutorials/12%20-%20Connected%20Worlds%20-%20Coast,%20Caves%20and%20Living%20Forests.md).

Remaining boundaries: save/reload sessions, worker meshing, streaming and LOD, alternative meshers, 3D cave flow, coral growth, cloud physics and coupling the erosion arrays into Living coast. Earlier sections below retain their original study-specific plans; new implementations are identified by workspace above.

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
- [x] Add a selectable Natural illustration study and documented before/after captures.
- [x] Add coherent directional light, actual tree shadows and shader fog in Simulation map.
- [x] Add restrained view-dependent water highlights and sample-based shore color in Explore mode.
- [ ] Add visible vector arrows and particles driven by the same wind field.
- [ ] Measure frame time and resolve the existing large-bundle warning where practical.

See the [October 7 log](../tutorials/2026-10-07%20-%20Progress%20Log.md) and [visual depth review](../analysis/2026-10-07%20-%20Visual%20Depth%20Review.md). The implementation status below records the subsequent Nature Studio preview; wind-field particles remain planned.

## Nature Studio preview — October 7, second experiment

- [x] Share study navigation, serif headings and rounded inspector cards across three tabs.
- [x] Keep the archived illustrated material option and independent panel accents.
- [x] Add actual tree count, density, clustering and scale controls without resetting erosion.
- [x] Verify a 100-step run and fixed diagnostic scales; save desktop and narrow-layout screenshots.
- [x] Write tutorial 08 and append the English learning log.
- [ ] Review the new visual direction and tree silhouettes with the owner.
- [ ] Measure shadow-map frame time and test lower-cost settings if needed.
- [ ] Compare sparse and clustered forests under the same paused field conditions.
- [ ] Design explicit age/growth/reproduction rules before describing trees as a dynamic population.

This iteration is a local preview. The previous checkpoint is on GitHub; the redesign has not been pushed in this iteration.


## Course-aligned next work — October 7 checkpoint

The [course progress report](../tutorials/2026-10-07%20-%20Nature%20Studio%20Course%20Progress.md) is the current mapping. Earlier local-preview statuses above are historical. This checkpoint packages the redesign for GitHub submission.

- [x] Save and document a fixed-field density comparison: 25% → 62 trees; 75% → 174; restore 53% → 125.
- [x] Write English tutorials for Sessions 5, 6 and 7 and cross-session learning insights in Obsidian.
- [x] Map all five sessions to current/proposed parameters, evidence and implementation gaps.
- [ ] Session 3: run frequency 1/2/4 and grid-resolution 32/64/128 comparisons with fixed seed and matched captures.
- [ ] Session 4: record equal-step rainfall trials, then implement explicit moisture/temperature fields and biome classification.
- [ ] Session 5: implement a bounded density sphere, slice and working mesh in a separate tab; then ordered cave CSG, chunk seams and measured local rebuilds.
- [ ] Session 6: implement constant/swirl vector fields with arrows and fixed-step particle advection; validate distance, reset and pause. Treat a pressure-based fluid solver as a separate milestone.
- [ ] Session 7: compare clustering with count recorded, implement an isolated bounded L-system tree, then add persistent plant state before growth/reproduction claims.

Keep the Nature Studio visual system. Add diagnostic views and explanatory parameters per session, with real screenshots and measured results. Do not mark a topic complete because a tutorial exists.


## October 13 — full course film evidence (revision 3)

This supersedes earlier pending comparison lists for the experiments named below; it does not turn the wider roadmap into completed work.

- [x] Fixed-seed frequency, fixed-world grid resolution and shader-threshold comparisons.
- [x] Equal-step low/high rainfall and fixed-temperature moisture/biome comparison.
- [x] Density shapes/slices, CSG order, local chunk edits and three-trial resolution/chunk-size measurements.
- [x] Meshing-alternatives comparison in the film; Marching Cubes remains the implemented method.
- [x] Matched wind-direction/displacement and 0/40 pressure-iteration fluid trials.
- [x] Isolated grammar/angle, growth-only, reproduction and crowding trials at matched times.
- [x] Rotating procedural globe finale driven by common noise, relief, sea level, climate and habitat parameters, with labeled separate study insets.
- [x] English tutorial, progress screenshots, raw experiment results, captions, music and silent film previews.
- [ ] Owner review of the 5:28 film, then commit/push the approved revision.
- [ ] Test playback on the actual exhibition display and verify the public hosted app URL.
- [ ] Longer crowding/mortality study; generic CSG stacks, workers/LOD/streaming and 3D cave fluids remain separate future work.

[Experiments and evidence](../tutorials/15%20-%20Controlled%20Experiments%20and%20the%20Planet%20Finale.md). No claim of full weather physics, spherical cave flow or later-course agents.


## October 13 — readable-world art direction (local review)

- [x] Replace interpolated planet colors with per-pixel land/water thresholds, clear blue oceans and restrained relief.
- [x] Add functional sea-level, moisture and temperature controls to the new planet style.
- [x] Replace leaf cutouts with broadleaf crown volumes and a distinct layered fir silhouette; retain L-system inspection and population rules.
- [x] Apply cream, indigo and brass to research controls without changing diagnostic color semantics.
- [x] Add an app-only first-person map opening with six linked studies, parameter trials, skip/reopen actions and keyboard support.
- [ ] Owner review of globe, canopy silhouettes and opening; then finalize the next film render and publication.
- [ ] Art-direct close-range foliage, richer terrain cliffs and a less regular opening forest in a later detail pass.

[Preview evidence](../tutorials/16%20-%20A%20Readable%20World%20and%20an%20Unfolding%20Map.md). The opening is not added to the video.


## October 13 — The Fieldwork Express (local narrated preview)

- [x] An animated railway story with a seed passenger, moving camera, rolling wheels, steam, birds and rain. The initial raised terrain and growing decorative trees were superseded by the printed-map treatment below.
- [x] Archive the original 2:51 introduction and 5:28 studies; replace the default journey with a 14-second introduction and a 2:56 total cut.
- [x] One audio clock for animation, narration and 64 English subtitle cues; pause, seek, chapter jump and restart.
- [x] Original synthesized ambience with independent volume and quiet levels under narration.
- [x] Live parameter meters, matching A/B views, model boundaries and links back to the relevant studio.
- [x] English notes and real progress captures; static-map checkpoint retained.
- [x] Generate one 34-second elderly storyteller audition and add independent playback, transcript and mutual pause behavior to the app.
- [x] Restore the preferred folded-map visual language with numbered indigo stops, blue wave marks and a separate field-note card.
- [x] Keep geography and tree symbols flat; add passing 3D woodland behind the map and a small dimensional train.
- [x] Make map stickers selectable chapter destinations with semantic buttons and a route transition; pause the scenery with the story.
- [x] Save desktop/phone hybrid-map evidence; check all 29 chapters, keyboard controls, reduced motion, pause, automatic transition and the ending. Fix the clipped phone card action. Previous folded-map captures remain historical checkpoints.
- [x] Restore close layered woodland framing, replace the rejected audition with a warmer 21-second sample, and export the full 8:19 local review film with captions and quiet audio.
- [x] Rewrite and generate the complete short narration using the warmer elderly voice; synchronize it with the compact experiment timeline.
- [x] Add continuous roadside tree parallax while preserving the old layered crowns and flat paper map.
- [ ] Review the new short narration with the owner; refine delivery if needed.
- [ ] Review the full story on the exhibition speaker/display; improve character acting and close-up scenic detail after review.
- [ ] Commit/push after owner review. The owner subsequently requested a full video; a 2:56 short MP4 is now available for local review.

## October 14 — independent Pocket Island

- [x] Separate mobile entry point and public HTTPS QR destination.
- [x] Gesture wind, delayed current, airborne seeds, rain/moisture and habitat-gated planting.
- [x] Touch alternatives, pause, repeatable reset and neutral tilt calibration.
- [x] Seven additional model tests; 37 tests total passed.
- [ ] Confirm motion permission and gentle shake/tilt on a physical iPhone and Android phone.
- [ ] Observe whether first-time visitors understand why a seed fails to grow.

Desktop and mobile remain independent. No cross-device control or synchronized ecology.


## October 20 — seed perspective and course alignment

- [x] Desktop seed first-person view and independent keyboard observer camera.
- [x] Real tracked-seed transport, landing validation, one population birth and growth-linked viewpoint.
- [x] Actual screenshots, English Obsidian tutorial and explicit course-coverage audit.
- [ ] Complete reset-matched wind direction, fixed-location moisture and population competition trials with recorded metrics.
- [ ] Refine close-range foliage visibility and walking collisions after evaluating the research interactions.
- [ ] Session 9: implement the assigned evolutionary solver after confirming its objective; categorical species colors do not count as evolution.
- [ ] Session 10: needs-driven autonomous agent, explicit state transitions and schedules.
- [ ] Session 11: settlement or shared-practice rules that produce procedural culture.
- [ ] Sessions 12–13: measured performance budgets, LOD/streaming where justified, and persistent world saves.
- [ ] Verify the latest independent mobile tracked-seed revision on the public host and physical devices.

The new viewpoint does not complete the future-course topics. Existing instancing, population caps and local chunk rebuilding are partial optimization work. No explicit light-competition model is implemented. [Tutorial and model boundaries](../tutorials/20%20-%20A%20Seed%20Finds%20a%20Home.md). No new push or public deployment.

## November 3 — Session 8 agents

- [x] Add an independent desktop Agents workspace with a clickable individual-state inspector and a live agent-to-world connection panel.
- [x] Implement finite perception, energy-driven FSM states, separation/alignment/cohesion flock steering and scheduled visitors from a bounded pool.
- [x] Couple bird berry foraging and seed carrying to plant establishment on open island ground.
- [x] Couple surface residue to rain runoff, creek organic load, a relative oxygen readout and shoreline plant response.
- [x] Distinguish local cleanup from gradual creek recovery; document model boundaries and real references.
- [ ] Run and record personal matched comparisons for 3 m vs 16 m perception and 0.1 vs 1.4 flock response.
- [ ] Compare dry vs rainy shore conditions from a reset state and record creek recovery after cleanup.
- [ ] Explore ant stigmergy, crowd motion, behavior trees, hearing and occlusion if a clear course question motivates them.

See [Session 8 learning tutorial](../tutorials/22%20-%20Session%208%20-%20Agents,%20Flocking%20and%20Ecosystems.md) and [November 3 progress log](../tutorials/2026-11-03%20-%20Progress%20Log.md). Implementation is recorded; personal parameter observations remain open.
