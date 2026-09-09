---
tags: [world-building, design, style-guide]
status: draft-for-visual-preview
version: 0.1
---

# Style Guide

## Direction

**Minimal editorial interface × stylized miniature world.**

Create a calm, spacious tool for exploring a playful procedural world. The interface should feel clear and carefully composed. The world should express character through simple geometry, color, light, and shadow.

This is the first design direction, not a description of the current implementation. This document does not change the app by itself.

**Owner decision (2026-09-08):** the interface stays **dark**, matching the black low-poly space the world lives in. A light "paper" panel was tried and rejected — see [Visual Changelog 001](docs/tutorials/Visual%20Changelog.md). Order of work: **the world gets its stylized look first** (shader-driven color, expressive light and shadow); the panel is then tuned to follow the scene's palette, not the other way round.

**World look v1 (chosen, Changelog 002):** flat-shaded low-poly, 4-step toon lighting with soft band edges, blue-violet shadow tint, warm light, fresnel rim. Elevation bands: sand → grass → forest → rock → snow.

**Palette v1 (Changelog 003)** — interface colours are sampled from the world, never introduced separately:

| Token | Value | Source in the world | Used for |
|---|---|---|---|
| `--space` | `#080810` | scene background | app background |
| `--panel` | `#0c0c16` | space, one step lighter | panel surface |
| `--sand` | `#dcc27f` | beach band | the single accent: sliders, checkboxes, eyebrow |
| `--ocean` | `#4a86e6` | ocean albedo | focus rings only |
| `--shadow-tint` | `#2b2f52` | toon shadow tint | reserved for hover/selected surfaces |

## References and interpretation

- [New Layer Capital, designed by Obys](https://nlc.obys.agency/): reference for bold scale, fine rules, large color fields, and layered landscape silhouettes. Borrow its compositional clarity, rather than copying its branding or turning the app into a scrolling marketing page. Its rendering implementation has not been verified.
- The owner's description of an **OpenAI-like simplicity**: interpret this as restrained controls, readable typography, and generous space. No particular OpenAI screen, font, or exact palette has been selected.
- The owner's preference for **comic/game-like shading**: explore simplified light and shade, limited palettes, and readable geometric silhouettes. Thick outlines, pixel art, and neon effects are not implied.

## Established principles

### Let the world lead

The scene is the main visual element. Keep navigation and controls secondary. Preserve enough space around the world to read its silhouette and its lighting. Avoid a large permanent title that competes with the scene.

### Keep the interface quiet

Use consistent alignment, whitespace, typography, and subtle separators to establish hierarchy. Avoid wrapping every control in a separate card. Reveal secondary settings progressively while keeping essential controls easy to find.

### Use color deliberately

Keep interface surfaces mostly neutral. Start with one interaction accent for selected controls and primary actions. The world may use several coordinated colors; the interface accent does not restrict the scene to one color. Minimalism here means fewer competing elements, not necessarily muted or monochrome artwork.

### Shape before texture

Prioritize simple, recognizable geometry. Mountains, rocks, trees, and water should read at a glance. Explore large color regions and lighting before adding texture detail. Photorealistic surface noise is not the default direction.

### Give shadow a purpose

Use light and shadow to explain volume, distance, and contact. Distinguish shadows inside the 3D world from decorative UI drop shadows. The former can be expressive; keep the latter minimal.

## Interface guidelines

### Layout

- Keep the main canvas dominant on desktop.
- Group controls by task, such as Terrain, Water, and Light, as those features become available. Do not display nonfunctional controls.
- **Decided (Changelog 004):** no solid side panel. The scene is full-bleed; controls float over it in a ~300px column with a faint scrim, grouped under hairline headers, rows dim at rest and bright on hover/focus. Sliders stay real range inputs (hairline styling); selects become inline text choices; checkboxes become text switches with a dot. Reference feel: editorial portfolio sites (thin rules, small type, space) — borrow the restraint, not the gallery layout.
- On small screens, keep the scene visible before a long list of settings. Allow controls to collapse or scroll without blocking scene interaction.
- Treat exact panel widths and scene-to-control proportions as preview decisions, not fixed requirements.

### Typography

- Use one clean sans-serif family, initially the existing system sans-serif stack. Do not assume an external font is installed.
- Use regular and medium weights for most interface text.
- Reserve large type for a short title or a meaningful introductory state.
- Keep parameter names readable. Use tabular numerals where possible so values do not shift as they change.
- Avoid pervasive uppercase labels, exaggerated letter spacing, and tiny technical text.

### Controls and states

- Place a clear label and current value beside each slider; include units when relevant.
- Use consistent shapes and spacing across buttons, selects, switches, and inputs.
- Make hover, focus, selected, and disabled states distinguishable. Selection must not depend on color alone.
- Support keyboard operation and visible focus. Maintain readable contrast and comfortable click targets even when the visual style is minimal.
- Do not replace functional controls with decorative geometry that is difficult to identify or operate.

### Motion

- Use short, purposeful transitions that clarify changes.
- Avoid scroll hijacking, cursor effects, and repeated entrance animations in the working interface.
- Keep scene motion controllable. Honor reduced-motion preferences where applicable.
- Parameter changes should feel responsive; transitions must not obscure the actual state.

## World art direction

- Use a limited, coordinated palette with readable differences between land, water, and other features.
- Build depth using silhouette, overlap, value contrast, and atmospheric layering where useful.
- Explore two lighting treatments: soft illustrative shadows, or a small number of toon-like light/shade bands. Choose after comparing the same geometry and camera.
- Prefer coherent light direction and material behavior over adding more effects.
- Outlines and flat facets are optional experiments, not mandatory stylistic features.
- Keep world-art experiments separate from interface-only changes so their effects can be judged independently.

## Provisional first-preview choices (superseded)

> Kept for history. These were the first draft's hypotheses; the warm off-white surface and coral accent were tried and rejected (Changelog 001). Current tokens are in **Palette v1** above; current layout is in **Layout → Decided**.

- **Interface surface:** warm off-white, with dark charcoal text.
- **Interaction accent:** a restrained coral tone; compare against a cooler accent if it competes with the world.
- **Scene palette:** cream or sand landforms, blue-violet shade, and a small amount of coral color.
- **Control shape:** lightly rounded with subtle borders; avoid heavy pill styling on every element.
- **Layout:** dominant canvas and a slim parameter panel.

Exact color values, font family, corner radii, panel placement, and soft-versus-banded shadows remain open. Do not treat this palette as required just because it appears in the first draft.

## Avoid

- Dense instrument dashboards and an always-visible wall of parameters.
- Neon cyberpunk styling, glowing borders, and glass effects everywhere.
- Large generic cards, heavy UI shadows, and gratuitous gradients.
- Excessive decorative labels, icons, badges, or animated effects.
- Copying NLC's oversized marketing typography into the everyday controls.
- Assuming a component library such as Tweakpane defines the app's design. Choose implementation tools after evaluating the intended interface.

## Preview and revision workflow

1. Capture the existing app before changing its style.
2. Make an interface-only preview using the current working controls. Preserve scene behavior, parameter values, and functionality.
3. Capture the same viewport and scene state afterward.
4. Review scene prominence, readability, control discoverability, and overall mood with the owner.
5. Record accepted choices as concrete design tokens in this guide.
6. Explore world shading in a separate pass, holding geometry and camera fixed for comparison.

### Prompt for the first implementation pass

> Read STYLE-GUIDE.md and inspect the existing app. Create an interface-only style preview using the provisional choices, while preserving all working controls and scene behavior. Keep the canvas dominant and the controls calm and readable. Do not add new features, change the terrain algorithm, or introduce a UI library without explaining why it is needed. Capture before/after views at the same size and scene state. Explain which choices remain provisional so I can review them.

## Review checklist

- [ ] The world is the first thing I notice.
- [ ] I can find and read the important controls immediately.
- [ ] The interface feels spacious without wasting essential working space.
- [ ] Color and shadows serve a clear visual purpose.
- [ ] All existing controls still work with mouse and keyboard.
- [ ] The narrow-screen layout remains usable.
- [ ] Screenshots show a fair comparison rather than different camera states.
- [ ] The owner has reviewed the preview before provisional choices become final.

No preview or approval is recorded yet. Update this document after an actual review; do not mark the checklist complete in advance.
