# 10 — Session 6: Vector Fields, Fluids and Atmosphere
Session: September 30 · Study note prepared October 7, 2026

**Status:** new learning tutorial and proposed implementation. There are no wind arrows, advected particles or velocity-field controls in the current app.

## What changes from the previous sessions?

A height field answers “how high?” A water-depth map answers “how much water?” A vector field answers “which direction, and how fast?”

For a horizontal field, each position (x,z) has velocity (vx,vz), measured in chosen world units per simulated second. An arrow visualizes that vector; it is not itself the simulation.

The current hydraulic model transfers water toward one of four lower neighboring surface levels. It stores ground, water and sediment, but not a general velocity field with pressure projection. Existing sea marks are static, and distance fog is a shader effect.

> Side note: moving dots can make a scene feel alive. The useful question is whether their paths explain a rule.

## Step 1 — Draw a constant wind before adding particles

Create a Wind study or explicit field overlay using the shared interface. Start with velocity (2,0). Every arrow should point along +x. Turning the camera must not rotate the wind in world coordinates.

Keep arrow spacing and display length separate from the field resolution and physical speed. A legend should identify direction and speed. Hide arrows independently of the underlying simulation.

## Step 2 — Follow the field

Move a particle with a small fixed simulation step:

`positionNext = position + dt * velocity(position, time)`

This is explicit Euler integration. Start with dt = 1/60 simulated second and a fixed-step accumulator, so display refresh rate does not set the speed. Bound catch-up work after a long browser pause.

For constant speed 2 units/second, a particle should travel 20 units over 10 simulated seconds, before crossing a boundary. Choose and document boundary behavior: wrap, respawn or exit. A wrapped edge is a modeling choice, not an infinite fluid domain.

Keep a deterministic particle seed. Add Start/Pause, single step and Reset. Reset must restore both particle positions and simulation time.

## Step 3 — Add a field with spatial structure

Around a center, let local coordinates be (x,z):

`v(x,z) = (u0 - omega*z, w0 + omega*x)`

With u0 = w0 = 0 this is a rotational field. Changing the sign of omega reverses the direction. Its speed grows with radius, so use a bounded domain.

Euler integration can make circular trajectories drift outward. Compare dt = 1/30, 1/60 and 1/120 over the same simulated duration, or add a midpoint integrator. Record radius drift instead of treating a visually attractive spiral as proof of a correct orbit.

Next, introduce smooth spatial variation with a seeded field. Keep frequency (size of gust regions) distinct from strength (speed). Avoid uncorrelated per-frame random directions if the goal is coherent wind.

## Step 4 — Know when this becomes a fluid solver

A prescribed field moves particles without solving fluid dynamics. A pressure-based fluid exercise requires evolving velocity, applying forces, transporting quantities and enforcing the chosen boundary/incompressibility conditions. Dye is a scalar carried by the flow.

The primary reference is Mark Harris’s [GPU Gems chapter on fluid simulation](https://developer.nvidia.com/gpugems/gpugems/part-vi-beyond-triangles/chapter-38-fast-fluid-dynamics-simulation-gpu). It explains advection, diffusion, forces and pressure projection on a 2D grid. Its model does not include a water–air free surface. It should not be presented as a ready-made cave-water or river solver.

For a later fluid exercise, compare divergence before and after projection and record pressure-solver iterations. Do not label decorative particles “Navier–Stokes simulation.”

## Step 5 — Connect the field to this world

Implement one connection at a time:

1. **Wind + vegetation:** sample the same wind field at tree locations. Use root-anchored bending whose amount depends on wind and tree stiffness. This changes appearance, not tree placement.
2. **Wind + visible tracers:** arrows and particles should agree. Trail length and particle count are display controls, not wind forces.
3. **Wind + atmosphere:** transport a mist-density field. Mist appearance can read that density; it is still not a model of condensation or weather.
4. **Water-flow diagnostics:** expose the existing solver’s transfer directions if useful, but label them as hydraulic flux diagnostics. They are not the same field as atmospheric wind.

Keep any future wind clock separate from erosion step count unless a coupling and unit conversion are explicitly designed.

## Proposed controls and experiments — not implemented

| Control | Trial values | Expected evidence |
| --- | --- | --- |
| Direction | 0 / 90 / 180 degrees | Arrows and paths turn together; document angle convention |
| Speed | 0 / 2 / 5 units/s | Zero freezes advection; constant-field distance scales with speed |
| Swirl omega | -0.2 / 0 / 0.2 per second | Direction reverses; zero removes rotation |
| Grid cells per side | 16 / 32 / 64 | Interpolation and field cost comparison at fixed domain |
| Particle count | 250 / 1,000 / 4,000 | Visibility and frame-time comparison, not changed physics |
| Time step | 1/30 / 1/60 / 1/120 s | Compare at equal simulated time |
| Trail duration | 0.5 / 2 seconds | Read paths without confusing longer trails with higher speed |

These are starting experiment values, not physical calibration. There is no requirement to expose every control at once.

## Screenshot and measurement plan

Capture a constant field with arrows and tracers together, then a swirl with its parameters. Record seed, time, dt, boundary rule and camera. Include a zero-speed control and a repeated-reset check. For performance, record frame time on a stated device and viewport; do not substitute particle count for a benchmark.

**Completion evidence for the first stage:** one shared field drives both arrows and particles; equal-time behavior is comparable at different frame rates; Pause and Reset work. Full simulated fluids remain a separate milestone.

## AI prompt

> Add a small Wind field experiment within the existing visual system. Start with constant and rotational horizontal fields, arrow visualization and deterministically seeded particles using a fixed simulation time step. Expose direction, speed and swirl separately from particle count. Add Pause, Step and Reset, document boundaries, and verify the constant-speed distance test. Keep erosion unchanged. Label this as prescribed-field advection, save real screenshots, and explain the difference from a fluid solver in English.
