---
tags: [progress, assignment-1, voxels]
date: 2026-09-16
status: documentation-and-planning-only
---

# September 16 — Preparing Assignment 1

## Request

Explain the voxel-terrain assignment in Chinese and English in conversation, prepare an English tutorial, and explain how the current world could change. All repository content remains in English.

## What was done

Reviewed the current app's workspace navigation, shared noise field, height-grid erosion solver, landscape shader and grove placement. Prepared [tutorial 06](06%20-%20Assignment%201%20-%20Voxel%20Terrain,%20CSG%20and%20Meshing.md), with density shapes, provisional CSG interpretation, sequential operations, meshing alternatives, chunk-boundary concerns, calculated scalar-storage estimates, a profiling template, and staged implementation prompts.

The proposed art target is a lakeside cliff with an arch and cave opening. The recommendation is to add a fourth tab and retain the current illustrated direction. Height-grid erosion and tree placement cannot simply be applied unchanged to cave surfaces.

## Evidence and status

This session prepares documentation; it does not implement a voxel system. No new voxel screenshot or benchmark is claimed. The tutorial reuses the September 10 landscape screenshot as an explicitly dated baseline. New screenshots will accompany actual implementation milestones.

Memory examples were calculated from `4 × (N + 1)^3` bytes for one corner-sampled Float32 field. They exclude mesh and other buffers. Checked the installed Three.js MarchingCubes source as well as official documentation and author-written meshing references. Verified the new notes' local links and English-only content.

## Next experiment

Build one sphere in a separate Voxel Terrain tab, show a density slice, mesh it, and verify surface normals. Then proceed to shape combinations. Confirm the instructor's meaning of “CS techniques” before treating the CSG interpretation as definitive.
