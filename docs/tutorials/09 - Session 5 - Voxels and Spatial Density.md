# 09 — Session 5: Voxels and Spatial Density
Session: September 23 · Study note prepared October 7, 2026

**Status:** learning guide and implementation plan. The current app has no voxel tab. Read the [Assignment 1 guide](06%20-%20Assignment%201%20-%20Voxel%20Terrain,%20CSG%20and%20Meshing.md) for the broader brief.

## The new question: what exists below the surface?

The current terrain stores one height for each horizontal position: y = h(x,z). That is enough for hills, but one column cannot contain a cave floor, empty air and a roof at different heights.

A volume instead stores a scalar at (x,y,z). For this tutorial, use negative inside solid, positive outside, and zero at the boundary. A sampled density is data; a mesh is one way to display its boundary. A voxel world can have a smooth surface.

> Side note: more triangles will not turn the current height field into a cave. The missing part is the representation.

## Step 1 — Make one shape understandable

Start a separate Voxel Terrain study with a sphere in a bounded 32-unit cube. Use:

`d(p) = length(p - center) - radius`

Show the zero surface and a movable horizontal slice. On the slice, use one color for solid and another for empty space, with a zero contour. Keep these diagnostic colors distinct from the natural surface material.

Try sphere radii 6, 8 and 10 units with 32 cells per side. A slice through the center should have its largest circular section; a slice outside the sphere should be empty.

**Evidence to save after implementation:** surface plus center slice, parameters and triangle count. Do not use the current height-map screenshot as voxel evidence.

## Step 2 — Compose shapes in order

With the negative-inside convention, combine two fields A and B:

| Operation | Field |
| --- | --- |
| Union | min(A,B) |
| Intersection | max(A,B) |
| Subtract B from A | max(A,-B) |

These operations classify inside/outside correctly; the resulting field is not always an exact distance function.

A terrain volume can begin with `d = y - h(x,z)`. Subtract a sphere or capsule to carve a cavity. Unlike the original height field, this expression is evaluated throughout 3D space. Bound the volume deliberately and decide whether to cap its sides.

Test order with three shapes: solid base A, cave cutter B and overlapping pillar C.

- `(A subtract B) union C`: adding C afterward can fill part of the cave.
- `(A union C) subtract B`: the cutter removes the overlapping pillar too.

Keep shapes fixed and show both operation lists beside their screenshots. This is a meaningful sequential-operation experiment. Simply swapping two union operands would not demonstrate an order difference.

## Step 3 — Extract the surface

Marching Cubes processes grid cells, classifies their eight corners relative to an isovalue, and constructs local triangles. Surface positions can be interpolated along crossed edges. Sampling and ambiguity handling affect the result.

The [Three.js MarchingCubes addon](https://threejs.org/docs/pages/MarchingCubes.html) is one starting point. Adapt the field/sign/isolation convention explicitly; do not assume the addon uses the convention chosen in this note.

Compute smooth normals from the field gradient or consistent shared samples. Compare smooth shading and wireframe: a visually smooth material does not imply sufficient geometry.

**Done when:** the sphere and carved opening are visible, the slice agrees with the mesh, and field edits regenerate geometry without leaking old GPU buffers.

## Step 4 — Understand why size becomes expensive

For N cells per side, corner samples number (N+1)³. One Float32 density channel needs:

| Cells per side | Samples | Density only |
| --- | --- | --- |
| 32 | 35,937 | 0.14 MiB |
| 64 | 274,625 | 1.05 MiB |
| 128 | 2,146,689 | 8.19 MiB |

These are calculated storage estimates, not measured total memory. Gradients, materials, temporary buffers, meshes and GPU copies cost more. Doubling linear resolution approaches eight times as many samples.

Compare 32/64/128 cells over the same 32-unit span: spacing 1/0.5/0.25 units. Keep shapes fixed. Record generation time, meshing time, triangle count, edit latency and actual frame time. Measure repeated runs on the same device; do not invent FPS.

Small cavities may disappear if the grid fails to sample them. Higher resolution cannot recover features smaller than the sampled representation supports.

## Step 5 — Chunk a world, then edit one part

Divide a 64-cell-wide volume into 32-cell chunks. Each chunk needs 33 corner samples per axis, with consistent shared boundary values. Evaluate noise in global coordinates, not separately seeded local coordinates.

Edit a small sphere near a chunk boundary. Rebuild every affected chunk, including neighbors that share changed boundary/normal samples. Show chunk bounds and inspect the seam in wireframe.

Chunking helps with local rebuilds, loading and culling. If all chunks remain loaded, it does not magically reduce the total world memory; duplicated borders add overhead. Worker meshing can reduce UI stalls but still consumes computation and needs stale-job handling.

## Step 6 — Compare alternatives

| Technique | Useful property | Tradeoff to inspect |
| --- | --- | --- |
| Exposed cube faces / greedy meshing | Efficient block-style surfaces; merges compatible coplanar faces | Block silhouette; merged faces must respect material boundaries |
| Marching Cubes | Smooth scalar-field surfaces | Cases/ambiguities, triangle count and boundary consistency |
| Marching Tetrahedra | Smaller case set per tetrahedron | Usually more triangles; consistent cell subdivision is important |
| Surface Nets | Compact mesh from surface-crossing cells | Sharp-feature preservation needs care |
| Dual Contouring | Can preserve sharp features using intersection/normal information | More complex vertex fitting and topology handling |

For the block-meshing comparison, see the author’s [Meshing in a Minecraft Game](https://0fps.net/2012/06/30/meshing-in-a-minecraft-game/). See the further-reading links in the Assignment 1 guide for smooth alternatives.

## Proposed inspector — not available yet

| Parameter | First trials | Why change it? |
| --- | --- | --- |
| Shape | Sphere, terrain volume | Compare a known shape with terrain |
| Radius | 6 / 8 / 10 units | Validate density and slices |
| Cave radius | 2 / 4 / 6 units | Find the smallest readable opening |
| Cells per side | 32 / 64 / 128 | Compare detail and cost at fixed span |
| Chunk cells | 16 / 32 | Compare rebuild overhead |
| Isovalue | -0.5 / 0 / 0.5 | Inspect surface offset under this sign convention |
| Slice height | Below / through / above cave | Verify interior occupancy |
| Operation order | Cut then add / add then cut | Demonstrate noncommuting operations |

Keep the Natural illustration material outside the cave, but make the opening readable with geometry, light and a section view. Dark paint on a hill is not a cave.

## AI prompt for the first implementation

> Add a separate Voxel Terrain workspace using the existing Nature Studio shell. Begin with a bounded sphere density field, a documented negative-inside convention, a slice inspector and a working Marching Cubes surface. Expose radius and cell resolution. Show sample and triangle counts and measured generation/meshing times. Preserve the existing height-field solver. Save actual screenshots and an English experiment log before adding CSG or chunking.

**Learning check:** explain why cave water and cave vegetation need a new way to locate surfaces. A single ground height cannot identify an interior floor or roof.
