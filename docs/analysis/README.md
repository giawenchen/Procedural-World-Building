---
tags: [analysis, world-building]
---

# Experiment analysis

## First comparison: UV sphere and icosphere

The first experiment adds topology selection and wireframe mode to the same planet sandbox. See the [geometry tutorial](../tutorials/01%20-%20Geometry%20%26%20Topology%20for%20Planets.md) for the prompts and screenshots.

The UV sphere has a latitude/longitude arrangement that becomes denser near the poles. The icosphere uses a different distribution of triangles. Switching the geometry also changes where the terrain function is sampled.

This is a visual comparison, not a performance benchmark. The two settings do not necessarily produce equal triangle counts, so the screenshots alone cannot establish which is faster or better.

## Next comparison

- Set elevation to zero to inspect the underlying mesh.
- Keep the camera and rotation fixed.
- Record triangle counts for both geometries.
- Restore elevation and compare the surface again.

## Questions to revisit

- How much resolution do I need before the silhouette looks smooth?
- Where do texture seams become visible?
- Which changes affect geometry, and which only affect shading?
