# 11 — Session 7: L-systems, Growth and Ecosystems
Session: October 7, 2026

**Implementation update, October 7:** Living coast now has a 3D L-system grammar, plant identity/age/size/health, growth, reproduction, dispersal, competition and mortality. Read [Tutorial 12](12%20-%20Connected%20Worlds%20-%20Coast,%20Caves%20and%20Living%20Forests.md) for the captured population trial and the distinction between grammar complexity and growth. The distribution-only description below refers to the earlier Simulation map; its 650-instance limit differs from the new coast’s 300-plant cap.

## Three different questions — original planning checkpoint

| Question | Model needed | Current status |
| --- | --- | --- |
| Where should a tree appear? | Placement candidates and suitability rules | Implemented |
| How does one tree branch? | Geometry grammar, such as an L-system | Planned |
| How does a population change over time? | Persistent plant state and environmental interactions | Planned |

A forest can use simple, stylized trees and still show sophisticated distribution. More detailed leaves do not automatically produce an ecosystem.

## Step 1 — Understand the existing distribution

The current app generates deterministic candidates at roughly 6-unit spacing and rejects steep, submerged or out-of-height-range locations. Capacity is 650 instances. With the default sea reference -4, eligible heights are sea + 2 through sea + 21; the slope threshold is a rise/run ratio of 0.7, about 35 degrees. Surface-water depth above 0.3 units excludes a candidate.

Current controls:

| Control | Range / default | What changes |
| --- | --- | --- |
| Tree density | 0–1 / 0.53 | Candidate acceptance probability |
| Clustering | 0–0.5 / 0.30 | Spatial variation in acceptance; count may also change |
| Tree size | 0.5–1.4 / 1.00 | Instance scale; anchors and count stay fixed |

At fixed seed and field, the same settings reproduce the same placement. These controls do not reset the hydraulic solver. A tree disappearing when a cell becomes unsuitable is not a simulated mortality event: no tree life history is stored.

### Completed trial: density, not growth

Default field, Hydraulic erosion paused at step 0, resolution 96, relief 22, clustering 30%, size 1.00×:

![Sparse trial, 62 trees at density 25 percent](images/2026-10-07/15-density-25-step0.jpg)
![Dense trial, 174 trees at density 75 percent](images/2026-10-07/16-density-75-step0.jpg)

Density 53% initially placed 125 trees; 25% placed 62; 75% placed 174; restoring 53% returned to 125. All ground/water metrics remained zero. This was a controlled browser trial, not a lifecycle simulation.

Next, compare clustering 0%, 30% and 50% at density 53%. Record count as well as spatial arrangement, because clustering does not hold count constant. That experiment is still pending.

## Step 2 — Generate one branching plant

An L-system rewrites symbols in parallel. A turtle interprets the resulting sequence into geometry. Brackets save and restore state to create branches. For the underlying approach, see Prusinkiewicz’s [Graphical Applications of L-Systems](https://algorithmicbotany.org/papers/graphical-applications-of-l-systems.html).

Use this small teaching grammar, not a claim of biological accuracy:

- Axiom: F
- Rule: F → F[+F]F[-F]F
- F: draw a segment and move forward
- + / -: turn by a chosen angle
- [ / ]: push / restore position and direction

Begin in 2D with 25-degree turns. Only after the grammar is clear, add 3D orientation and tapered branch geometry.

| Iteration | Number of F segments |
| --- | --- |
| 0 | 1 |
| 1 | 5 |
| 2 | 25 |
| 3 | 125 |
| 4 | 625 |

These counts follow from each F producing five Fs; they are not app measurements. Make each generation from the previous complete string. Replacing new symbols again in the same pass would no longer be the intended parallel rewrite.

Add expansion/segment limits before increasing depth. Branches and leaves can become expensive quickly.

> Side note: one tree in isolation makes the grammar easier to understand than a whole forest.

## Step 3 — Keep the style while making structure visible

Use a muted trunk, two or three green foliage tones and a readable silhouette. Provide “branch skeleton” and “foliage” views. A close inspection can reveal branching without making every distant tree expensive.

Generate a small seeded library of tree variants, then instance those variants across the terrain. Measure the cost before replacing every existing tree with unique geometry.

## Step 4 — Separate grammar depth from time

Increasing iterations constructs more structure; it is not automatically a year of growth. First add an illustrative growth parameter that reveals existing branches in parent-before-child order. Label it “growth preview.”

A dynamic model requires stored plant state: identity, position, age, size, species and perhaps energy. Choose a simulation time unit. Update that state using explicit rules, instead of regenerating unrelated trees every frame.

A minimal learning model could increment age with dt, increase size toward a species maximum, reduce growth under crowding, and permit mature plants to disperse seeds. Those are design choices needing tests, not validated ecological laws.

## Step 5 — Add an ecosystem experiment

Reuse terrain height/slope for suitability, then add moisture and light inputs deliberately. Wet surface depth is not the same as root-zone soil moisture.

Begin with one species and persistent individuals:

1. Fixed seed and initial plants.
2. Finite growth rate and a maturity threshold.
3. Seed dispersal radius and rate per simulation-time unit.
4. Germination only at suitable, sufficiently separated locations.
5. A competition rule and an explicit mortality rule.
6. Population, births and deaths tracked separately over time.

Keep a hard safety cap for performance, but distinguish it from ecological carrying capacity.

## Proposed future parameters

| Parameter | Initial trials | What to inspect |
| --- | --- | --- |
| Grammar iterations | 1 / 2 / 3 / 4 | Segment count, silhouette and generation time |
| Branch angle | 15 / 25 / 40 degrees | Crown spread at fixed grammar |
| Segment scale | 0.6 / 0.8 / 1.0 | Geometry proportions, not simulated age |
| Growth rate | 0 / 0.5 / 1 normalized size unit per chosen time unit | Zero-rate control and maximum-size clamp |
| Seed dispersal radius | 2 / 6 / 12 world units | Spatial spread at fixed seed and duration |
| Competition radius | 2 / 4 / 8 world units | Local crowding and population history |

Only the first distribution table describes controls already available in the app. These future trial ranges are proposals.

## Evidence required

Save isolated-tree comparisons with grammar, angle and iteration count. Then save population snapshots at equal times and a count-over-time table. Repeat with the same seed; zero growth and zero reproduction should do what their labels say.

Do not use the completed 25% versus 75% density screenshots as evidence of reproduction. They show a parameter change, not births over time.

## AI prompt

> Add an isolated Tree laboratory in the existing Nature Studio interface. Implement a small bracketed L-system with parallel rewriting, visible grammar, iteration and angle controls, a skeleton/foliage toggle and strict geometry limits. Start with a deterministic 2D turtle before extending to 3D. Preserve existing distribution and erosion. Record segment counts, performance and real screenshots. Treat ecological growth and reproduction as later features with separate persistent state.

**Learning check:** explain a tree's location, its branch structure and its life history using three different sets of rules.
