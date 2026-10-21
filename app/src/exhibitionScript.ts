export type ExhibitStory = 'tide' | 'cave' | 'forest'
export type ExhibitCommand = { id: number; name: string }
export const STORIES = {
  tide: { number: '01', title: 'Change the tide.', question: 'When the coast moves, where can you walk?', note: 'Water level changes reef exposure and the walkable trail. A prescribed tide, not a wave solver.' },
  cave: { number: '02', title: 'Open the mountain.', question: 'What happens when empty space becomes a design tool?', note: 'A density field describes solid and air. Marching Cubes reveals their boundary.' },
  forest: { number: '03', title: 'Grow a forest.', question: 'How does one branching rule become a living population?', note: 'Branch grammar defines form. Growth, seeds and competition change the population over time.' },
} as const
