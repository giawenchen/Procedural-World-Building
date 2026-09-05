---
tags: [procedural-world-building, textures, uv-mapping, heightmaps, noise, threejs]
course: Procedural World Building (Cornell Tech)
created: 2026-09-02
series: "World Building Core Concepts — 2/3"
---

# 02 — Textures, UVs & Heightmaps

> **Previous:** [[01 - Geometry & Topology for Planets]] · **Next:** [[03 - Shaders 101 for World Builders]]

## 1. What a texture really is

A texture is **any image used as data on a surface** — and "data" is the key word. The same PNG can mean completely different things:

| Texture type | Each pixel means… | Used for |
|---|---|---|
| **Color / albedo map** | surface color | the obvious one |
| **Height map** | grayscale = elevation | **terrain!** white = mountain, black = ocean floor |
| **Normal map** | a direction (RGB = XYZ) | fake bumpy lighting without extra vertices |
| **Roughness map** | shiny ↔ matte | wet vs dry ground |

For world building, the **heightmap** is the star: *an image is just a 2D array of numbers, and a 2D array of numbers is terrain.*

## 2. UV mapping — how an image sticks to a mesh

Every vertex carries, besides `(x, y, z)`, a 2D coordinate `(u, v)` between 0 and 1 — its address *within the texture image*. The GPU stretches the image between those addresses.

- UV sphere → UVs from lat/long → textures **squeeze at the poles** (same pole problem as [[01 - Geometry & Topology for Planets|topology]])
- Cube-sphere → 6 square faces, each with clean 0–1 UVs → this is why planet engines love it

**Quick self-test:** if a texture looks stretched on your model, is the image wrong or are the UVs wrong? (Almost always the UVs.)

## 3. Procedural textures — generate, don't download

The course's core move: **don't load images, compute them.** A heightmap can be generated with noise:

- `Math.random()` per pixel → TV static, useless (no spatial structure)
- **Perlin / Simplex noise** → smooth random hills: nearby points get similar values
- **fBm (fractal noise)** = several octaves of noise stacked: big noise for continents + medium for hills + small for rocks

```js
// concept (using any 2D noise function):
elevation =
    1.00 * noise(1 * x, 1 * y)   // continents
  + 0.50 * noise(2 * x, 2 * y)   // hills
  + 0.25 * noise(4 * x, 4 * y);  // detail
```

Those multipliers (amplitude, frequency, octaves) are exactly the **sliders** in the course's parameter → procedure → picture loop.

## 4. Exercise: your first terrain (20 min)

Displace a flat plane with noise — terrain in ~15 lines:

```js
import { createNoise2D } from 'simplex-noise';   // npm i simplex-noise
const noise2D = createNoise2D();

const geo = new THREE.PlaneGeometry(10, 10, 128, 128);
const pos = geo.attributes.position;

for (let i = 0; i < pos.count; i++) {
  const x = pos.getX(i), y = pos.getY(i);
  const h =
      1.0  * noise2D(x * 0.15, y * 0.15)
    + 0.5  * noise2D(x * 0.3,  y * 0.3)
    + 0.25 * noise2D(x * 0.6,  y * 0.6);
  pos.setZ(i, h);
}
pos.needsUpdate = true;
geo.computeVertexNormals();

const terrain = new THREE.Mesh(geo,
  new THREE.MeshStandardMaterial({ color: 0x88aa66, flatShading: true }));
terrain.rotation.x = -Math.PI / 2;
scene.add(terrain);
```

**Break it on purpose:** double the frequencies (`0.15 → 0.3`) — predict, then look. Drop to one octave — what changes? Congratulations, you now understand every terrain slider you'll ever see.

## 5. Coloring by height (mini biomes)

Classic trick: elevation → color ramp. Below 0 = water blue, low = grass green, high = rock gray, top = snow white. Doing this per-vertex works; doing it per-pixel is nicer — and that's exactly what [[03 - Shaders 101 for World Builders|shaders]] are for.

## 6. Ask-the-AI prompts

- *"Explain Perlin noise octaves/frequency/amplitude with a terrain analogy, then show me fBm in JS."*
- *"My noise terrain looks like spiky static — here's my code."* (frequency too high, or using `Math.random`)
- *"Generate a 512×512 heightmap on a canvas and use it as a `displacementMap` in Three.js."* (the image-based route — compare it with the vertex-loop route above)

## What surprised me

- *(fill in after the exercise)*
