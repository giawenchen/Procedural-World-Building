# Fieldwork — Midterm Exhibition Films

## Current short cut — October 13

[Play the 2:56 Fieldwork Express](fieldwork-express-v5-review.mp4) · [English subtitles](fieldwork-express-v5.en.srt)

A 14-second paper-map train opening with passing woodland, followed by concise parameter comparisons from Sessions 3–7 and a rotating globe finale. English synthetic elderly narration, captions, quiet original music and synthesized nature ambience. Rendered from actual app models at 1440 × 900 / 24 fps. Local review; not pushed.

The [8:19 edition](fieldwork-express-v4-review.mp4) and the longer experiment films below remain historical versions. The short edit introduces each concept; full controls and deeper comparisons remain in the app.


## Current preview: revision 3 — the full course story

A 328-second (5:28), 1440 × 810 film captured from the actual app algorithms. English captions and applied-parameter readouts are burned into both editions. Local preview awaiting owner review; not yet pushed.

- [Full course film with original ambient music](fieldwork-midterm-v3-music.mp4)
- [Silent full course film](fieldwork-midterm-v3-silent.mp4)
- [Synchronized English SRT](fieldwork-midterm-v3.en.srt)
- [Recorded browser measurements](fieldwork-midterm-v3-measurements.json)
- [Repeatable model experiments and three-trial CPU benchmarks](fieldwork-v3-experiments.json)
- [Tutorial 15: time index, results, screenshots and limits](../tutorials/15%20-%20Controlled%20Experiments%20and%20the%20Planet%20Finale.md)

The sequence moves from noise and shaders to rain/biomes, density/CSG/chunking/meshing, vector fields/fluids, grammar/growth/ecology, and tide/path. The final 32 seconds show a continuously rotating procedural planet with noise, relief, sea, climate and tracer controls. Independent erosion and volume studies are labeled as insets. It is a connected visual explanation, not a fully coupled Earth simulation.

Use `?atlasfilm=1` to preview by chapter or time and record the full sequence. The right-hand sliders represent values actually applied by the script, not manual mouse footage. Keep the tab visible during capture. Download the WebM, SRT and measurement JSON. Encode with:

```sh
python3 tools/exhibition/finish_film.py /path/to/fieldwork-exhibition-v3-raw.webm --duration 328 --version v3
node --experimental-strip-types tools/exhibition/atlas_report.mjs
```

Source: `app/src/AtlasFilm.tsx`, `atlasProgram.ts`, `atlasRenderer.ts`, `atlasExperiments.ts` and `atlasProducer.ts`. The film introduces Sessions 1–2 through the build/inspect/document workflow and represents the main scheduled technical themes of Sessions 3–7. The private course decks were unavailable for a slide-by-slide completeness check. Alternative meshers are explained, not falsely presented as implemented. The earlier films remain intact below.

## Earlier focused preview: revision 2

A 110-second actual-renderer capture with English captions, camera orbits, matched before/after views and a dedicated live parameter area. Prepared October 13, 2026; awaiting owner review before publishing this revision.

- [Music preview — H.264/AAC MP4](fieldwork-midterm-v2-music.mp4)
- [Silent preview — H.264 MP4](fieldwork-midterm-v2-silent.mp4)
- [Synchronized English captions — SRT](fieldwork-midterm-v2.en.srt)

Captions are burned into both films. The SRT is editable; do not enable it over the burned-in captions unless duplicated text is intended. Download the video before the exhibition; play full screen and enable looping in your preferred player. Use the silent version while speaking.

### Sequence and controls

| Video time | Demonstration |
| --- | --- |
| 0–4 s | Establish the world. |
| 4–13 s | Low-tide reference; amplitude slider moves 2 → 4 while the model clock is held. |
| 13–28 s | Advance to high tide; orbit, then compare the same coast side by side. |
| 28–42 s | Retreat to low tide; the dry route returns. |
| 42–62 s | Start with solid terrain; radius moves 0 → 5; compare the opening. |
| 62–74 s | Reverse cut/add order, then edit a local pocket and show affected chunks. |
| 74–83 s | Initial forest; growth-rate slider moves 0 → 2 while time stays zero. |
| 83–104 s | Advance to 18 model seconds; compare the original stand with growth and seedlings. |
| 104–110 s | Closing orbit. |

The right panel is a scripted visualization of the parameters actually supplied to the renderer, not desktop mouse footage. Terracotta highlights the changing control. Model time is labeled separately from physics parameters. Captions use rendered route, birth and chunk-rebuild results; subtitles can therefore shift slightly with renderer readiness.

These are separate educational studies, not a coupled physical simulator. Tide is prescribed; reefs do not grow; the voxel volume is bounded; ecology is accelerated. The film is a selective introduction. The [course audit](../tutorials/14%20-%20Midterm%20Coverage%20Audit.md) identifies the remaining noise, erosion, biome, fluid and grammar demonstrations for the full research atlas.

## Original 78-second edition

Retained for comparison: [music](fieldwork-midterm-music.mp4), [silent](fieldwork-midterm-silent.mp4), [captions](fieldwork-midterm.en.srt). That edition includes an isolated branch specimen; revision 2 spends more time on controlled operations and before/after comparison.

## Music and provenance

“Fieldwork Ambient” is an original synthesized instrumental score created for this project with AI-assisted code. Soft pads, sparse upper notes, stereo echoes and fades; no sampled recordings, commercial songs or voices. The mix targets −23 LUFS.

Visuals are actual rendered app frames. Titles, parameter displays, reference frames and captions are composed into the video. No substitute generated landscape footage is used. Source: `app/src/exhibitionFilm.ts` and `app/src/filmRecorder.ts`.

## Reproduce

Run the app, open `?exhibition=1`, expand **Film & exhibition tools**, and record. Keep the tab visible. Download the WebM and synchronized SRT, then run from the repository root:

```sh
python3 tools/exhibition/finish_film.py /path/to/fieldwork-exhibition-v2-raw.webm --duration 110 --version v2
```

Requires NumPy and FFmpeg. Raw WebM and intermediate WAV files stay outside Git. Save the downloaded SRT alongside the matching finished MP4. See [Tutorial 13](../tutorials/13%20-%20From%20Research%20Studio%20to%20Public%20Exhibition.md) for the learning record.
