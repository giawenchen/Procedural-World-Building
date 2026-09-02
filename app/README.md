# Procedural World Building Starter

A Vite + React + TypeScript + Three.js starter for a procedural world building class project.

## Why This Stack

React owns the interface: the sidebar, sliders, toggles, and settings object.
Three.js owns the 3D canvas: the scene, camera, renderer, mesh, controls, and animation loop.

The app passes plain settings from React into the Three.js planet renderer. That matches the course pattern:

```text
React controls -> settings -> Three.js canvas -> procedural planet
```

## Run Locally

```bash
npm install
npm run dev
```

## Check Build

```bash
npm run build
```
