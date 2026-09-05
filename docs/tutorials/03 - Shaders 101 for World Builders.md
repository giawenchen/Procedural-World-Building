---
tags: [procedural-world-building, shaders, glsl, threejs]
course: Procedural World Building (Cornell Tech)
created: 2026-09-02
series: "World Building Core Concepts — 3/3"
---

# 03 — Shaders 101 for World Builders

> **Previous:** [[02 - Textures, UVs & Heightmaps]] · **Up:** [[00 - World Building Learning Path]]

## 1. What a shader is

A shader is a **small program that runs on the GPU** — once per vertex, or once per pixel, massively in parallel. Written in **GLSL** (a C-like language). There are two kinds, and they map perfectly onto what we already know:

| Shader | Runs once per… | Its one job | World-building use |
|---|---|---|---|
| **Vertex shader** | vertex | decide *where* the vertex goes on screen | displace terrain **on the GPU** |
| **Fragment shader** | pixel | decide the pixel's *color* | biome colors, water, atmosphere glow |

Secret: you've been using shaders all along — every Three.js material (`MeshStandardMaterial` etc.) **is** a pre-written shader pair. Writing your own just means taking the wheel.

## 2. Why world builders need them

In [[02 - Textures, UVs & Heightmaps]] we displaced vertices in a JS loop. That's fine for 16k vertices, but a planet at week-8 scale (LOD, streaming) has millions — JS loops choke, while the GPU does the same job per-frame for free. Rule of thumb:

- **CPU (JS):** logic you need to *know about* — collisions, town placement, saving the world
- **GPU (shader):** pure visuals — displacement, coloring, water, atmosphere

## 3. The smallest possible shader (read it, it's 6 lines)

```js
const material = new THREE.ShaderMaterial({
  vertexShader: /* glsl */ `
    void main() {
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }`,
  fragmentShader: /* glsl */ `
    void main() {
      gl_FragColor = vec4(0.2, 0.6, 1.0, 1.0);   // every pixel: blue
    }`,
});
```

That vertex line is boilerplate meaning "put the vertex where the camera math says." The fragment line is "paint it blue." Everything fancier is additions to these two.

## 4. The three data channels (this is 80% of shader literacy)

| Channel | Direction | Example |
|---|---|---|
| **uniform** | JS → shader, same for all vertices/pixels | `uTime`, `uSeaLevel` ← **your React sliders end up here!** |
| **attribute** | per-vertex data | `position`, `uv`, `normal` |
| **varying** | vertex shader → fragment shader (interpolated) | pass elevation along to color by height |

The course's parameter → procedure → picture loop, in shader terms: **React slider → uniform → shader → pixels.**

## 5. Exercise: height-colored wobbling planet (25 min)

Displace by noise in the vertex shader, color by elevation in the fragment shader:

```js
const material = new THREE.ShaderMaterial({
  uniforms: { uTime: { value: 0 } },
  vertexShader: /* glsl */ `
    uniform float uTime;
    varying float vElevation;
    void main() {
      float elev = 0.15 * sin(position.y * 8.0 + uTime);  // stand-in for noise
      vElevation = elev;
      vec3 displaced = position + normal * elev;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(displaced, 1.0);
    }`,
  fragmentShader: /* glsl */ `
    varying float vElevation;
    void main() {
      vec3 ocean = vec3(0.1, 0.3, 0.7);
      vec3 land  = vec3(0.3, 0.6, 0.2);
      vec3 snow  = vec3(1.0);
      vec3 col = mix(ocean, land, smoothstep(-0.05, 0.05, vElevation));
      col      = mix(col,  snow, smoothstep(0.09, 0.13, vElevation));
      gl_FragColor = vec4(col, 1.0);
    }`,
});
// in the render loop:  material.uniforms.uTime.value = clock.getElapsedTime();
```

Put it on an `IcosahedronGeometry(1, 5)`. **Break it:** change the `smoothstep` thresholds (sea level rises!), then wire a React slider to a `uSeaLevel` uniform — that's the entire course architecture in miniature.

Next step when ready: replace `sin` with a real GLSL noise function (ask the AI for a simplex noise snippet — everyone copies these, nobody writes them from scratch).

## 6. Debugging shaders (it's weird at first)

No `console.log` on the GPU. The universal trick: **output the suspect value as a color** — `gl_FragColor = vec4(vec3(vElevation + 0.5), 1.0);` — and read the image. Black screen usually = compile error; check the browser console for the GLSL log.

## 7. Ask-the-AI prompts

- *"Line-by-line, explain this ShaderMaterial like I know JS but zero GLSL."* (paste the exercise)
- *"Give me a 2D/3D simplex noise GLSL function and show how to displace my sphere's vertices with it."*
- *"My shader shows a black screen — here's my code and the console output."*
- *"How do I pass a slider value from React into a Three.js shader uniform without recreating the material?"*

## Where this leads

- Week 5 (atmospheres): fragment shaders + fresnel glow at the sphere's rim
- Water: a second, slightly bigger sphere with an animated transparent shader
- Week 8 (performance): the vertex-shader displacement you just did **is** the fast path

## What surprised me

- *(fill in after the exercise)*
