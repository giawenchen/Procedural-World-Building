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
- Notes were updated through the shared Obsidian Tutorials path. Image links resolved on disk at checkpoint time. The later redesign experiment below also verifies an embedded image in Obsidian.

## Next experiment — proposed

Keep this illustrated baseline and add a selectable **Atmospheric illustration** study. First test directional light, grounded tree shadows, and restrained distance haze using the same seed, camera, resolution, and simulation step. Capture a matched comparison before adding water reflections or particles. Keep the control-panel design and diagnostic color scales unchanged.

After that, use visible vector arrows and a small set of leaf or mist particles to show a velocity field. Toggle the arrows off for the expressive view. This connects the new course topic to something observable rather than adding motion with no explained cause.


---

# Experiment 2 — Nature Studio redesign

**User request, translated:** Start the redesign using the agreed world and control-panel references.

## Implemented in this iteration

- A shared Nature Studio shell: illustrated study navigation, a large central viewport and grouped inspectors. Soft paper/sage colors, serif headings, rounded cards and consistent controls follow the supplied UI references.
- A selectable **Natural illustration** world treatment across all three tabs. The older Illustrated map remains available as a material comparison.
- Simulation map now has actual directional tree/terrain shadows and shader-integrated distance fog. These are display effects; diagnostic views keep their fixed, unlit colors.
- Explore water reads a texture of the existing height samples for shallow/deep color and shore treatment. A grazing-angle highlight suggests reflection. There is no scene-reflection system, animated wave simulation or new fluid solver.
- A vegetation inspector shows the real placed count and controls density, clustering and size. Existing height/slope/wetness constraints remain. These controls preserve hydraulic state and do not implement ecological growth.
- Keyboard navigation between studies and responsive layouts for smaller screens.

The earlier GitHub checkpoint remains the full pre-redesign version. This experiment is a local preview for visual review; it has not been committed or pushed in this iteration.

## Visual record

![Before: illustrated atlas controls and world](images/2026-10-07/05-before-workbench.jpg)

![After: Nature Studio and natural illustration](images/2026-10-07/06-natural-workbench.jpg)

Both use the default field, 96 cells per side, 22-unit relief, default orbit camera, default grove settings and paused step zero. Browser captures are both 1320 × 960. The layout changes the viewport width, so this is an interface-and-scene comparison, not a pixel-aligned shader comparison.

![Earlier material language within the new layout](images/2026-10-07/07-archive-in-workbench.jpg)

Images 06 and 07 use the same new layout, camera and paused field to compare materials. The archive selector retains the old palette and pen language, not the entire old application layout or lighting setup.

> Side note: the biggest difference is where attention goes. The controls sit around the study, and the trees now leave a mark on the ground.

![Natural coastline and vegetation inspector](images/2026-10-07/08-natural-coast.jpg)

Explore view, paused at the origin. Sea-level water is distinct from simulated surface water. The vegetation inspector reports 125 placed trees with the default field and controls.

![Original planet in the new shell](images/2026-10-07/09-natural-planet.jpg)

![Noise laboratory in the new shell](images/2026-10-07/10-natural-noise.jpg)

These two views share the palette and lighting language. Tree shadows and scene fog are currently specific to Simulation map. Original planet retains its radial sine terrain, and Noise laboratory remains a height study without a water surface.

![390 CSS-pixel mobile layout](images/2026-10-07/11-natural-mobile.jpg)

The mobile image is a viewport capture, not the entire scrollable page. Navigation becomes a row and the inspector follows the scene. Because the capture browser uses reduced zoom, the encoded mobile JPEG is 258 × 536, representing a 390 × 812 CSS-pixel viewport.

## Verification and observations

- Production build and lint passed. Seven regression tests passed, including a new density/placement invariance test.
- A 100-step run paused automatically: deepest cut **2.494 u**, largest deposit **6.542 u**, ground changed **99.5%**, mean water **0.768 u**.
- At that paused state, switching the world material and panel accent preserved those measurements and step 100.
- Setting density to zero gave **0 trees** without changing the hydraulic measurements. Restoring 53% density restored **106 trees** in the wet field.
- Water analysis hid trees, retained the fixed 0–1+ u depth scale, and labeled the vegetation count as hidden. A repeated run supplied the full-camera landscape capture below.
- All three tabs rendered without captured browser console errors. At 390 CSS px, Simulation map and Noise laboratory had no horizontal overflow. At 854 CSS px, the scene and inspector occupied separate columns; keyboard Home selected the first study.
- The existing large-bundle warning remains (about 807 kB minified JavaScript). No frame-time benchmark was performed, so this log makes no FPS claim.

![Fixed water-analysis scale at step 100, scrolled to show the inspector](images/2026-10-07/12-water-analysis-step100.jpg)

![Natural landscape after 100 steps](images/2026-10-07/13-natural-erosion-step100.jpg)

## Learning notes and boundaries

The [new tutorial](08%20-%20Nature%20Studio,%20Shadows%20and%20Tree%20Distribution.md) explains each visual cue and the tree controls. The style guide, README, learning path and backlog have been updated in English. Tutorial edits use the shared Obsidian vault path. Tutorial 08 was opened in Obsidian and its embedded archived-material comparison rendered successfully.

![Tutorial 08 with its embedded comparison visible in Obsidian](images/2026-10-07/14-obsidian-tutorial.jpg)

Switching Simulation map perspectives or leaving the workspace still resets that experiment. Tree density controls distribution, not birth or death. Voxel terrain, wind particles, fluid vector fields and biological population dynamics remain future work.

**Next experiment:** compare a sparse grove and a clustered grove at the same paused step. Record density, clustering, count and screenshots, then explain which rule caused the difference before adding lifecycle behavior.


## Experiment 3 — Course alignment and publication checkpoint

**Request, translated and condensed:** Save this version with screenshots and explanations on GitHub. Align the app's improvements and parameters with Sessions 3–7 and add tutorials and insights for the last three sessions.

### What was added

- A [new progress report](2026-10-07%20-%20Nature%20Studio%20Course%20Progress.md) with the redesign, screenshot evidence, course mapping and parameter experiments.
- Tutorials 09–11 covering spatial density/meshing, vector fields/advection and L-systems/ecosystems; all distinguish proposed implementation from current features.
- A [separate insights note](2026-10-07%20-%20Learning%20Insights%20-%20Sessions%203%20to%207.md), plus updated reading links and backlog.
- Two real screenshots of a new density trial. The five new notes were written directly in Obsidian's shared Tutorials folder.

### Actual trial

A separate preview preserved the user's paused step-100 experiment. Default seed 17, Perlin frequency 2, amplitude 1, octaves 3, persistence 0.5; Simulation map resolution 96, relief 22, Hydraulic erosion at step 0. Clustering remained 30%, tree size 1.00× and camera/viewport stayed fixed.

| Density | Actual count |
| --- | --- |
| 53% baseline | 125 |
| 25% | 62 |
| 75% | 174 |
| 53% restored | 125 |

Ground-change and water metrics remained zero; no simulation step advanced. Density changes candidate acceptance, not birth or growth rates.

![Sparse density trial](images/2026-10-07/15-density-25-step0.jpg)
![Dense density trial](images/2026-10-07/16-density-75-step0.jpg)

### Scope and next experiment

This is a documentation/publication checkpoint for the Nature Studio redesign, with a new parameter trial. It does not add voxel, wind or L-system features. The Session 3/4 experiments in the new report are recipes still to run; the documented 100-step run and density trial are observed evidence.

Next: implement one bounded voxel sphere and its density slice, then test a cave subtraction. Retain the current visual style while making each new data model inspectable.

### Checkpoint checks

Production build, lint and all seven simulation/placement tests passed again. The existing 807.49 kB JavaScript bundle warning remains. Local Markdown targets and screenshot file signatures were checked; submission text contains no Chinese passages. The report and embedded image were verified in Obsidian reading mode.

![New course report rendered in Obsidian](images/2026-10-07/17-obsidian-course-progress.jpg)

## Experiment 4 — Connected coast, caves and living vegetation

**Request, translated and condensed:** Implement the pending world concepts, including paths, reefs, biomes, tides and currents, and develop richer woodland detail and shaders from the supplied game references.

### Implemented

Three new studies now sit beside the original three: Living coast, Voxel terrain and Fluid laboratory. Living coast connects shared-noise terrain, climate classification, sinusoidal tides, fixed reef colonies, A* trails and a persistent plant population. Voxel terrain adds spatial density, ordered CSG, Marching Cubes, slices and local chunk rebuilding. Fluid laboratory compares prescribed wind with a 2D advected-dye and pressure-projection solver.

World detail now includes branching tree geometry, leaf-cutout clusters, tapered grass, rocks, shadows, procedural ground variation and depth-aware coastal water. The warm-paper controls retain their separate design role. Diagnostic views prioritize data readability over atmosphere.

![Before: the earlier Simulation map at its paused step-100 checkpoint](images/2026-10-07/18-before-connected-systems.jpg)
![After: Living coast forest detail at time zero](images/2026-10-07/19-living-forest-detail.jpg)

These are different studies and cameras, not a controlled shader comparison. The before frame was saved before implementation. Development used another browser tab; hot reload can still recreate scenes, so this record does not claim the original in-memory run survived every code edit. Normal workspace navigation now retains mounted state and pauses hidden studies. Page reload still resets runs.

### Actual checks and observations

- Tide amplitude 4 u / period 24 s: +4 u at 6 s, −4 u at 18 s. The trail changed from 0 u at high tide to 78 u at low tide. Colonies stayed at 343; the approximate exposed-tip indicator changed from 0 to 312.
- In that coupled run, 104 initial trees became 145 after 70 births and 29 deaths at 18 s. Growth and tide advanced together.
- Default 48³ voxel cells / 16³ chunks: 14,480 triangles across 27 chunks. A local pocket rebuilt 8 chunks and produced 14,588 triangles. Captured build times were 157.0 ms full and 62.9 ms local, single observations on this machine.
- Fluid defaults at 8 s: divergence 0.20236 before projection and 0.13739 afterward. Wind mode and manual stepping were also exercised.
- Build, lint and all 13 tests passed. The tests include repeatable population dynamics, flood mortality, path exclusions, tide extrema, CSG ordering, Marching Cubes geometry/winding, chunk count equivalence and divergence reduction. The existing base-bundle size warning remains.

![High tide](images/2026-10-07/24-high-tide-6s.jpg)
![Low tide](images/2026-10-07/25-low-tide-18s.jpg)
![Local voxel edit](images/2026-10-07/21-voxel-chunks.jpg)
![Fluid advection](images/2026-10-07/22-fluid-advection.jpg)

### Learning record

[Tutorial 12](12%20-%20Connected%20Worlds%20-%20Coast,%20Caves%20and%20Living%20Forests.md) was written directly in the shared Obsidian vault. It records controls, reset behavior, evidence, course connections and limitations. Tutorials 09–11 now link to their working implementations while retaining their original planning material as historical context.

> Development insight: preserving readable water, land and foliage matters more than applying one palette everywhere. A separate diagnostic view lets the illustration remain expressive without hiding the rules.

### Scope and next experiment

This is an interactive educational implementation, not a complete physical environment. Coastal currents and tides are prescribed; fluid pressure is solved only in the separate 2D study. Coral growth, 3D cave water, cloud formation, streaming terrain and alternate meshers remain future work. The existing hydraulic erosion study is separate from the living coast.

Next controlled experiment: reset Fluid laboratory and compare 0 versus 40 pressure iterations at eight seconds with every other parameter fixed. Save both divergence readings and screenshots before drawing a conclusion about convergence.

### Final delivery checks

The 390-CSS-pixel layout had no horizontal overflow (document width 390). Living coast Save frame delivered an actual 865 × 547 PNG to Downloads; its file signature and pixels were inspected. The browser download-event listener timed out, but filesystem verification confirmed delivery. This verifies the new coast export only, not every study export. No browser errors were captured in the final fresh runtime.

![Coast overview at time zero](images/2026-10-07/23-living-coast-overview.jpg)
![Narrow layout check](images/2026-10-07/28-mobile-layout.jpg)
