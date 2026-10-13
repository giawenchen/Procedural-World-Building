export type ExhibitStory = 'tide' | 'cave' | 'forest'
export type ExhibitCommand = { id: number; name: string }
export const STORIES = {
  tide: { number: '01', title: 'Change the tide.', question: 'When the coast moves, where can you walk?', note: 'Water level changes reef exposure and the walkable trail. A prescribed tide, not a wave solver.' },
  cave: { number: '02', title: 'Open the mountain.', question: 'What happens when empty space becomes a design tool?', note: 'A density field describes solid and air. Marching Cubes reveals their boundary.' },
  forest: { number: '03', title: 'Grow a forest.', question: 'How does one branching rule become a living population?', note: 'Branch grammar defines form. Growth, seeds and competition change the population over time.' },
} as const
export const FILM_DURATION = 78
export const FILM_CUES: { at: number; story: ExhibitStory; command: string; title: string; caption: string; detail: string }[] = [
  { at: 0, story: 'forest', command: 'forest-hero', title: 'A world shaped by rules', caption: 'Change one rule. Watch the world respond.', detail: 'Jiawen Chen / Procedural World Building / Midterm 2026' },
  { at: 6, story: 'tide', command: 'tide-play', title: '01 / The shore changes', caption: 'A rising tide changes what is land and what is water.', detail: 'Prescribed tide / amplitude 4 world units / period 24 model seconds' },
  { at: 12, story: 'tide', command: 'continue', title: '01 / The shore changes', caption: 'At high tide, the trail loses its dry connection.', detail: 'Terrain-aware A* route / fixed endpoints / water cells excluded' },
  { at: 23, story: 'tide', command: 'continue', title: '01 / The shore changes', caption: 'As the tide retreats, the reef and route emerge again.', detail: 'The same reef colonies stay anchored to the seabed' },
  { at: 30, story: 'cave', command: 'cave-solid', title: '02 / The mountain opens', caption: 'A height field shows a surface. A density field describes a volume.', detail: 'Negative density = solid / positive density = air' },
  { at: 34, story: 'cave', command: 'cave-carve', title: '02 / The mountain opens', caption: 'Subtract a tunnel to make space beneath the surface.', detail: 'CSG subtraction / interpolated Marching Cubes surface' },
  { at: 40, story: 'cave', command: 'cave-pillar', title: '02 / The mountain opens', caption: 'Reverse the operation order. The pillar survives.', detail: 'Subtract, then unite / the order changes the result' },
  { at: 44, story: 'cave', command: 'cave-chunks', title: '02 / The mountain opens', caption: 'A local edit rebuilds nearby chunks, not the whole volume.', detail: '48 cubed cells / 16 cubed cells per chunk' },
  { at: 48, story: 'forest', command: 'forest-branch1', title: '03 / The forest lives', caption: 'One branching rule starts with five segments.', detail: 'L-system / F becomes F[+F]F[-F][&F]' },
  { at: 52, story: 'forest', command: 'forest-branch3', title: '03 / The forest lives', caption: 'Three grammar iterations produce 125 segments.', detail: 'A change in structural complexity, not elapsed growth time' },
  { at: 56, story: 'forest', command: 'forest-crown', title: '03 / The forest lives', caption: 'Leaf clusters turn the branching structure into a tree.', detail: 'Procedural leaf cutouts / instanced geometry / shadowed lighting' },
  { at: 60, story: 'forest', command: 'forest-grow', title: '03 / The forest lives', caption: 'Now time advances: individuals grow, seed and compete.', detail: 'Accelerated educational ecology / model seconds, not biological years' },
  { at: 70, story: 'forest', command: 'overview', title: '03 / The forest lives', caption: 'Population is a history of births and deaths, not just a density slider.', detail: 'Persistent plant state / deterministic seed / 300-plant performance cap' },
  { at: 75, story: 'forest', command: 'continue', title: 'A world shaped by rules', caption: 'Observe. Change a rule. Discover what follows.', detail: 'A procedural atlas by Jiawen Chen / Built with AI-assisted tools' },
]
export function cueAt(seconds: number) {
  return FILM_CUES.findLast(c => seconds >= c.at) ?? FILM_CUES[0]
}
