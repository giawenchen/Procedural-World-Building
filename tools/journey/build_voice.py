"""Build a replaceable local narrator and sample-accurate English caption manifest.

Requires macOS say (Daniel) and ffmpeg. This is a local synthetic preview voice,
not a performed or emotion-directed voice. No third-party audio is downloaded.
"""
import json
import subprocess
import tempfile
import wave
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
FFMPEG = "/opt/homebrew/bin/ffmpeg"
RATE = 32000
script = json.loads((ROOT / "app/src/journeyScript.json").read_text())
out = ROOT / "app/public/audio/fieldwork"
out.mkdir(parents=True, exist_ok=True)
sections, captions = [], []
cursor = 0.0
with tempfile.TemporaryDirectory(prefix="fieldwork-voice-") as folder:
    tmp = Path(folder)
    pcm = bytearray()
    for i, chapter in enumerate(script):
        clips = []
        for j, line in enumerate(chapter["lines"]):
            aiff, wav = tmp / f"{i}-{j}.aiff", tmp / f"{i}-{j}.wav"
            subprocess.run(["say", "-v", "Daniel", "-r", "142", "-o", str(aiff), line], check=True)
            subprocess.run([FFMPEG, "-v", "error", "-y", "-i", str(aiff), "-ar", str(RATE), "-ac", "1", "-af", "highpass=f=75,lowpass=f=8500", str(wav)], check=True)
            with wave.open(str(wav)) as w:
                data = w.readframes(w.getnframes())
            if len(data) < RATE:
                raise RuntimeError("Speech service produced empty audio; do not publish a silent narrator.")
            clips.append((line, data))
        spoken = sum(len(data) / (RATE * 2) for _, data in clips)
        available = chapter["duration"] - 1.0 - .2 * (len(clips) - 1)
        if spoken > available:
            # Fit a short chapter without changing the rendered experiment clock.
            speed = spoken / available
            adjusted = []
            for j, (line, _) in enumerate(clips):
                src, dst = tmp / f"{i}-{j}.wav", tmp / f"{i}-{j}-fit.wav"
                subprocess.run([FFMPEG, "-v", "error", "-y", "-i", str(src), "-af", f"atempo={speed:.6f}", str(dst)], check=True)
                with wave.open(str(dst)) as w:
                    adjusted.append((line, w.readframes(w.getnframes())))
            clips = adjusted
            spoken = sum(len(data) / (RATE * 2) for _, data in clips)
        gap = max(.2, (chapter["duration"] - spoken - 1.0) / max(1, len(clips)))
        local = .55
        block = bytearray(int(chapter["duration"] * RATE) * 2)
        for line, data in clips:
            start = round(local * RATE) * 2
            block[start:start + len(data)] = data
            duration = len(data) / (RATE * 2)
            captions.append({"start": round(cursor + local, 4), "end": round(cursor + local + duration, 4), "text": line})
            local += duration + gap
        sections.append({**chapter, "at": cursor, "end": cursor + chapter["duration"]})
        pcm.extend(block)
        cursor += chapter["duration"]
        print(f"Narrated {i + 1}/{len(script)}: {chapter['id']}", flush=True)
    wav = tmp / "narration.wav"
    with wave.open(str(wav), "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(RATE)
        w.writeframes(pcm)
    subprocess.run([FFMPEG, "-v", "error", "-y", "-i", str(wav), "-af", "loudnorm=I=-19:TP=-2:LRA=9", "-codec:a", "libmp3lame", "-b:a", "128k", str(out / "narrator-preview.mp3")], check=True)
manifest = {"voice": "Local synthetic preview · Daniel", "duration": cursor, "introDuration": sum(s["duration"] for s in script if s["phase"] == "story"), "sections": sections, "captions": captions}
(ROOT / "app/src/journeyAudio.json").write_text(json.dumps(manifest, indent=2) + "\n")
def stamp(t):
    ms = round(t * 1000)
    return f"{ms//3600000:02}:{ms//60000%60:02}:{ms//1000%60:02}.{ms%1000:03}"
(out / "journey.en.vtt").write_text("WEBVTT\n\n" + "\n\n".join(f"{stamp(c['start'])} --> {stamp(c['end'])}\n{c['text']}" for c in captions) + "\n")
print(f"Ready: {cursor:.0f} seconds, {len(captions)} synchronized captions.")
