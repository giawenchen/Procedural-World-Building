---
tags: [procedural-world-building, nodejs, setup, cursor, claude-code, learning-with-ai]
course: Procedural World Building (Cornell Tech)
created: 2026-09-02
---

# How to Get Started with Node.js in Cursor / Claude

> **The point of this note:** I set up my entire dev environment for this course *without reading a single installation guide*. Instead, I worked with an AI coding harness (Claude Code — Cursor works the same way) and let it check, install, and verify everything. This note documents that process so you can reproduce it.

## What is a "Code Harness"?

The course checklist asks for a **"Code Harness installed"**. A harness is the tool shell that connects an AI model to your real dev environment — it lets the AI read files, edit code, and run terminal commands, instead of just chatting. Examples:

- **Claude Code** (Anthropic, CLI + desktop app) ← what I use
- **Cursor** (AI-first editor)
- **Codex CLI** (OpenAI), **Gemini CLI** (Google), **aider** (open source)

Any of these works for this course. The workflow below is harness-agnostic.

## Step 0 — Ask the AI what you actually need

Instead of googling "how to install node", I pasted the course checklist into the AI and asked what each item meant. It explained the stack (see [[Why React & Three.js]]) and identified what needed to be installed: **Node.js + npm**, **git/GitHub access**, and the harness itself.

**Lesson:** let the AI turn a vague checklist into a concrete todo list first.

## Step 1 — Check before you install

I asked the AI: *"do I need node.js?"* — and instead of just answering yes, it **ran the check itself**:

```bash
node --version   # → v22.14.0
npm --version    # → 10.9.2
```

Already installed. Zero work needed.

**Lesson:** an AI harness can verify your environment directly. Never install blindly — half the "setup steps" in tutorials are things you already have. (If Node were missing, the AI would have installed it via `brew install node` or pointed me to [nodejs.org](https://nodejs.org) — LTS version is fine for this course.)

## Step 2 — Install the GitHub CLI (AI-driven)

I told the AI: *"帮我装一下 gh cli"* (install the GitHub CLI for me). It ran:

```bash
brew install gh
```

and verified the install with `gh --version`. Total effort on my side: one sentence.

## Step 3 — Authenticate (the part the AI *can't* do for you)

Logging into GitHub requires **me** — an AI must never handle my password. The AI started the flow and handed me the one-time code:

```bash
gh auth login --hostname github.com --git-protocol https --web
```

What actually happened (including the failures — this is the realistic part):

1. First attempt: I left the terminal sitting at "Press Enter" too long → **device code expired**. 
2. The AI read my terminal output, diagnosed the expired token, and restarted the flow.
3. It surfaced the fresh one-time code; I opened `github.com/login/device`, typed the code, clicked **Authorize**.
4. The AI verified: `gh auth status` → ✅ logged in, and git push/pull now authenticate automatically (no manual tokens).

**Lesson:** the human stays in the loop exactly where they should — credentials and authorization. Everything around it (install, retry, diagnose, verify) the AI handled.

## Step 4 — Repo hygiene

The AI also caught that my repo name (`procedure-world-building`) didn't match the course's (`Procedural-World-Building`) and flagged it before it became a problem. Repo now lives at:

- Remote: `github.com/giawenchen/Procedural-World-Building`
- Local: `~/Documents/GitHub/Procedural-World-Building`

Verified with a dry-run push — everything in sync.

## Step 5 — From here to a running project

When the course starts, the project bootstrap is:

```bash
npm create vite@latest my-world -- --template react-ts
cd my-world
npm install three @types/three
npm run dev
```

Then open the localhost URL and you have a live-reloading React + TypeScript + Three.js sandbox.

## The meta-workflow (what I actually learned)

```
1. Give the AI real context (the course repo, the checklist, the error)
2. Ask it to CHECK before it installs
3. Let it run + verify commands, but keep auth/credentials yourself
4. When something fails, show the AI the actual terminal output
5. Always end with a verification step (--version, auth status, dry-run)
```

Setup that used to mean an afternoon of tutorials took a short conversation — and I understood every step, because I could ask *why* at any point.
