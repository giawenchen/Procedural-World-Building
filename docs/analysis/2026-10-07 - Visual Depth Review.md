# Visual depth review — October 7, 2026

## Recommendation

Keep the illustrated landscape identity and the quiet control panels. Develop a more spatial version of the world display before replacing its palette. The current screenshot checkpoint is preserved in the [progress log](../tutorials/2026-10-07%20-%20Progress%20Log.md).

Flat color is a valid style. Weak separation between surfaces, distances, and moving phenomena is the practical issue to test. Shader work should help a viewer distinguish what is land, what is water, which slope faces the light, and which movement comes from a simulated field.

## Game references

These are established references that remain useful, not a ranking of new releases. The applications below are design proposals for this project, not claims that the games use exactly the same implementation.

- **Firewatch — main reference for depth.** Jane Ng's [The Art of Firewatch](https://gdcvault.com/play/1022296/The-Art-of) discusses translating a graphic visual direction into an explorable 3D world. Study foreground / middle distance / background separation. Proposed application: preserve simple colors while testing a coherent light direction and distance-dependent contrast.
- **Sable — reference for readable drawing.** Gregorios Kythreotis's [The Art of Sable](https://gdcvault.com/play/1027721/The-Art-of-Sable-Imperfection) describes making a 3D world feel handmade and two-dimensional while retaining gameplay readability. Proposed application: use lines selectively on silhouettes and meaningful ridges, rather than covering every surface with equal visual weight.
- **Journey — reference for expressive surface response.** John Edwards's [Sand Rendering in Journey](https://www.gdcvault.com/play/1018864/Sand-Rendering-in) covers the game's sand-rendering development. Proposed application: study how a restrained surface can still respond to light and viewpoint. Adapt the principle separately to water and snow; do not reuse a sand effect indiscriminately across every material.

## Order of experiments

1. **Light and depth:** light-facing versus shaded slopes, tree contact / cast shadows, restrained distance haze. Check that material identities and data overlays remain readable.
2. **Water:** depth-based color where water depth exists, a modest grazing-angle reflection cue, shoreline treatment, and slowly changing wave normals. Decorative waves do not establish a fluid simulation.
3. **Vector fields:** a switchable arrow view with particles following the same velocity field. Begin with a controllable wind field. Terrain deflection is a later experiment; a physically solved atmosphere is not implied.
4. **Voxel forms:** arches, overhangs, cave openings and visible interior surfaces. These require density geometry and meshing, not a shader applied to the current height field. Keep the current erosion solver separate until a volume-aware fluid representation exists.

## Boundaries to preserve

- Controls keep their paper-and-ink design and English labels across tabs.
- Blue water, green vegetation, earth, rock, and snow keep distinct visual roles.
- Analysis views retain stable legends and do not inherit haze or decorative shading that changes measured colors.
- The current planet remains an illustrative procedural sphere, not geographically accurate Earth.
- Shader studies, voxel geometry, vector-field transport and hydraulic erosion must be documented as different mechanisms.

## How to judge a change

Use the same seed, viewport, camera, grid and paused step for each comparison. Record frame time on the same machine, not a claimed universal FPS. Test whether a reader can identify water, slopes, foreground/background, and particle direction without reading the code. Do not add all effects at once: retain a switchable baseline so the contribution of each can be explained.
