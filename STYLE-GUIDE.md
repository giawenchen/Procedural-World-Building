---
tags: [world-building, design, style-guide]
status: revised-preview-awaiting-owner-review
version: 0.5
updated: 2026-09-17
---

# Style Guide — A Quiet Instrument, a Readable World

## Decision and priority

The owner rejected the first September 17 world treatment because the monochrome palette removed the distinction between water, land and mountains. The reference images were intended primarily for the control panels. Interface design and world rendering have different purposes and must be evaluated separately.

Priority: **geographical meaning → readability → visual harmony**. Consistency does not require giving every material the interface's accent color.

## 1. Control panels: reference, purpose and boundaries

The control-panel reference is a printed Grand Canyon shuttle guide. Its cream information columns, compact headings, thin rules, aligned text and selective route colors provide an information-design reference. We borrow its hierarchy and restraint, not the printed map's faded reproduction quality, route data, icons or grain.

Panels help someone operate the app and understand parameters. Use warm paper, dark readable type, quiet grouping and restrained accents across every tab.

- Paper `#f1eee5`; panels `#f8f5ec`; text `#30382f`; secondary text `#646b5f`; rules `#c9cbbb`.
- Forest ink `#234e3b` or Graphite `#454944` affects interface accents only.
- System sans-serif labels and headings; sparse monospace study labels and numerical values.
- Fine boundaries and nearly square panels; deliberate spacing rather than decorative shadows or artificial wear.
- Desktop: world left, controls right. Narrow screens: world before controls.
- Visible focus, readable units, real sliders and explicit selected states remain required.
- All app and submission text is English.

**Boundary:** changing Interface accent must not recolor the earth, trees, oceans or diagnostic data.

## 2. World display: meaning first

The scene helps someone identify what exists and what changes. Preserve useful material distinctions:

- Water: recognizable blue `#327b9d`.
- Coast / exposed earth: sand `#c8ac72` and soil `#96734e`.
- Vegetation: meadow `#75934f` and deeper forest `#365d3d`.
- Rock: mineral gray-brown `#8a837a`.
- Highest terrain: pale snow-like material `#edece1`.

These are illustrative elevation/slope material rules, not measured land-cover data, ecological growth or a climate model. A mountain's geometry and lighting must also convey its shape. Do not rely on color alone, and do not flatten everything to a paper silhouette for visual consistency.

Coordinate the scene with the interface using restrained saturation, warm soil, neutral backgrounds and consistent light. Never remove blue water or green vegetation simply to match an accent.

**Boundary:** the interface reference must not override the semantic roles of these colors. Do not create water, vegetation or snow data merely to make an attractive composition.

### Illustrated world treatment — September 17, third iteration

The supplied Mont-Blanc poster informs world rendering only. Borrow distinct material shapes, conifer silhouettes, indigo rock faces, warm pale summits and local pen marks. Keep the printed-guide control panels unchanged.

- Low ground / shore: ochre `#e5cb7e`; meadow `#a1af69`; forest `#42684d`.
- Rock faces: indigo `#565b99`, with directional shade and sparse hatching.
- High, less steep ground: warm white `#fff8e6`; this is an illustrative snow mask, not a snowfall simulation.
- Water: blue `#79afd0`, with short pale pen marks. Marks are static texture cues, never flow vectors or measured currents.
- Trees: stepped conifer geometry, with the same deterministic placements and bounded instance count.
- Narrow, slightly irregular elevation transitions and view-dependent ink rims improve separation. Terrain remains three-dimensional and follows the existing field.

The style must not import fictional routes, buildings, labels or glaciers into the simulation. Natural materials and illustrated materials intentionally use different visual thresholds; neither is a measured biome classification. The same terrain geometry, source samples and hydraulic arrays remain the comparison baseline.

## 3. Controls and rendering modes

The toolbar has separate **Control panel / Accent** and **World display / Rendering** groups.

Default: **Illustrated map**. **Natural materials** remains available for comparison. Optional **Materials + contours** and **Materials + stipple** add information or shading while retaining the material colors. Neither is a default monochrome replacement.

Contours follow actual height: 0.05 u radial on Original planet, 0.1 u in Noise laboratory, 2 u in Simulation map. Stipple is a screen-space shading overlay, not a point cloud or a particle system. Both preserve the current terrain and simulation.

Original planet retains its sine terrain. Noise laboratory is an explicitly labeled height study with grayscale source samples: its lowlands are not automatically water. Simulation map uses the shared noise stack and measured slopes. Groves still use deterministic height/slope/water placement rules.

## 4. Water and diagnostic boundaries

- Planet ocean: a radial shell at 1.01 × base radius; land above it forms the coast.
- Explore water: a plane at the selected sea level, not a hydraulic-flow result.
- Erosion landscape water: a separate surface at ground height + simulated water depth. Depths below 0.015 u are hidden to suppress nearly dry films; this is a display threshold, not removal of water from the model.
- The erosion surface is a shallow height-field visualization, not a physically complete fluid mesh or an equilibrium lake surface. It can follow wet slopes during rainfall.
- Water analysis: fixed pale-to-blue scale from 0–1 u, with larger values saturated. It still measures water below the landscape display threshold.
- Slope analysis: fixed pale-to-forest scale from 0–60 degrees.
- Ground change: ochre erosion, neutral zero, teal deposition; saturation at ±0.5 u.

Analysis views are unlit and free of fog, decorative overlays, grove occlusion and water-surface occlusion. Numerical measurements accompany the scales. Changing interface styling or world overlays must not change these meanings or advance the solver.

## 5. Acceptance checks and future work

Review the panel and scene independently. First identify water, coast/soil, vegetation and rock without touching a menu; then assess whether the panel feels coherent and easy to operate. If one fails, revise that part without sacrificing the other.

Capture both stages in the learning record. Historical experiments stay visible but are labeled superseded or rejected where appropriate. The planned voxel tab should reuse the panel system while maintaining its own density, material and surface-normal semantics.

See [tutorial 07](docs/tutorials/07%20-%20A%20Consistent%20Visual%20Language%20for%20Procedural%20Worlds.md) and the third experiment in the [September 17 log](docs/tutorials/2026-09-17%20-%20Progress%20Log.md).
