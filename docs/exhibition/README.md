# Fieldwork — Midterm Exhibition Film

A 78-second film recorded from the application's actual Three.js renderers on October 13, 2026. English captions are burned into the picture.

- [Music version — H.264/AAC MP4](fieldwork-midterm-music.mp4)
- [Silent version — H.264 MP4](fieldwork-midterm-silent.mp4)
- [Editable English captions — SRT](fieldwork-midterm.en.srt)

Download the MP4 before the exhibition. Play full screen in QuickTime or VLC; enable looping in the player for unattended display. Use the silent version while speaking. Do not enable the SRT on top of the burned-in captions unless duplicated text is intended.

## Sequence

0–6 s: forest introduction. 6–30 s: rising and falling tide, reef exposure and route availability. 30–48 s: solid volume, tunnel subtraction, restored pillar and local chunk rebuilding. 48–60 s: branching grammar and leaf clusters. 60–78 s: population growth and a final overview.

These are separate educational studies, not a single coupled physical simulator. Tide is prescribed, reefs do not grow, the voxel volume is bounded, and ecology uses accelerated model time.

## Music and provenance

“Fieldwork Ambient” is an original synthesized instrumental score created for this project with AI-assisted code. Soft chord pads, sparse upper notes, stereo echoes and fades; no sampled recordings, commercial songs or voices. The mix targets −23 LUFS and is designed to stay unobtrusive under conversation.

The visuals are actual rendered app frames. Titles and captions are composed over the capture; no generated substitute landscape footage is used. The full desktop and control panels are not recorded. Source cue text lives in `app/src/exhibitionScript.ts`.

## Reproduce

Start the app, open `?exhibition=1`, expand **Film & exhibition tools**, and record. Keep that tab visible for the full sequence. Download the WebM, then run from the repository root:

```sh
python3 tools/exhibition/finish_film.py /path/to/fieldwork-exhibition-raw.webm
```

Requires Python with NumPy and FFmpeg. Raw WebM recordings and intermediate WAV files remain outside Git. Finished MP4 files are stored here for offline playback.
