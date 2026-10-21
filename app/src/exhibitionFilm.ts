export const FILM_DURATION = 110
export const FILM_CUES = [
  { at: 0, story: 'forest', title: 'A world shaped by rules', phase: 'Observe the world', reference: '', capture: '' },
  { at: 4, story: 'tide', title: '01 / When the shoreline moves', phase: 'Before · low tide', reference: '', capture: 'low' },
  { at: 10, story: 'tide', title: '01 / When the shoreline moves', phase: 'Action · amplitude, then time', reference: 'low', capture: '' },
  { at: 22, story: 'tide', title: '01 / When the shoreline moves', phase: 'After · high tide', reference: 'low', capture: 'high' },
  { at: 28, story: 'tide', title: '01 / When the shoreline moves', phase: 'Action · let the tide retreat', reference: 'high', capture: '' },
  { at: 38, story: 'tide', title: '01 / When the shoreline moves', phase: 'After · the coast returns', reference: 'high', capture: '' },
  { at: 42, story: 'cave', title: '02 / Make space inside a mountain', phase: 'Before · solid terrain', reference: '', capture: 'solid' },
  { at: 48, story: 'cave', title: '02 / Make space inside a mountain', phase: 'Action · widen the tunnel', reference: 'solid', capture: '' },
  { at: 56, story: 'cave', title: '02 / Make space inside a mountain', phase: 'After · an open passage', reference: 'solid', capture: 'tunnel' },
  { at: 62, story: 'cave', title: '02 / Make space inside a mountain', phase: 'Action · restore the pillar', reference: 'tunnel', capture: 'pillar' },
  { at: 68, story: 'cave', title: '02 / Make space inside a mountain', phase: 'Action · edit one region', reference: 'pillar', capture: '' },
  { at: 74, story: 'forest', title: '03 / From trees to a population', phase: 'Before · the seeded forest', reference: '', capture: 'forest' },
  { at: 80, story: 'forest', title: '03 / From trees to a population', phase: 'Action · growth rate, then time', reference: 'forest', capture: '' },
  { at: 98, story: 'forest', title: '03 / From trees to a population', phase: 'After · growth and new seedlings', reference: 'forest', capture: '' },
  { at: 104, story: 'forest', title: 'Observe. Change a rule. Look again.', phase: 'Fieldwork / Jiawen Chen', reference: '', capture: '' },
] as const
export function cueAt(seconds: number) { return FILM_CUES.findLast(c => seconds >= c.at) ?? FILM_CUES[0] }
const clamp = (x: number) => Math.max(0, Math.min(1, x))
export function filmAt(seconds: number) {
  const cue = cueAt(seconds), index = FILM_CUES.indexOf(cue), duration = (FILM_CUES[index + 1]?.at ?? FILM_DURATION) - cue.at
  const local = seconds - cue.at, after = [22,38,56,62,68,98].includes(cue.at)
  const compare = after && local >= Math.min(3,duration*.5)
  // An eased out-and-back orbit returns to the identical camera for comparisons.
  const orbit = compare ? 0 : .32 * Math.sin(Math.PI * clamp(local / (duration * .55))) ** 2
  const modelTime = cue.story === 'tide' ? seconds < 10 ? 18 : seconds < 13 ? 18 : seconds < 22 ? 18 + (seconds - 13) * 12 / 9 : seconds < 28 ? 30 : seconds < 38 ? 30 + (seconds - 28) * 1.2 : 42 : seconds < 83 ? 0 : Math.min(18, (seconds - 83) * 18 / 15)
  const caveRadius = seconds < 48 ? 0 : Math.min(5, Math.floor((seconds - 48) / 8 * 5 * 8) / 8)
  const tideAmplitude = 2 + 2 * clamp((seconds - 10) / 3)
  const growthRate = 2 * clamp((seconds - 80) / 3)
  return { seconds, tideAmplitude, growthRate, story: cue.story, cue: cue.at, orbit, compare, modelTime, caveRadius, pillar: seconds >= 62, pocket: seconds >= 68,
    capture: cue.capture && local > duration * .84 ? cue.capture : '' }
}
export type FilmRequest = ReturnType<typeof filmAt>
export type FilmRendered = {
  request: FilmRequest; canvas: HTMLCanvasElement; time: number; sea: number; trees: number; births: number; deaths: number;
  route: number; exposed: number; radius: number; triangles: number; rebuilt: number; chunks: number
}
export type FilmLink = { request: FilmRequest | null; rendered: FilmRendered | null }
export function filmCaption(f: FilmRendered) {
  const r=f.request
  if(r.cue===0)return 'A changing coast. A carved mountain. A forest that keeps growing.'
  if(r.cue===104)return 'Three experiments. The same question: what changes when a rule changes?'
  if(r.story==='tide') {
    if(r.cue===4)return 'At low tide, the beach and reef tips are exposed. The trail is connected.'
    if(r.cue===10&&r.seconds<13)return 'Drag Tide amplitude from 2 to 4. At this low-tide phase, more shore is exposed.'
    if(r.cue===10)return f.route===0 ? 'The water has cut the dry connection. The trail is now disconnected.' : 'The water is rising. Watch the beach narrow around the same trees.'
    if(r.cue===22)return 'The same coast at high tide: exposed reef tips and the dry trail disappear.'
    if(r.cue===28)return f.route>0 ? 'The trail has reconnected. More reef tips emerge as the water retreats.' : 'The tide is retreating. The trail is still waiting for a dry connection.'
    return 'Low tide restores the shoreline. Compare it with the high-water reference.'
  }
  if(r.story==='cave') {
    if(f.radius===0)return 'Begin with solid terrain. There is no tunnel through this volume.'
    if(r.cue===48)return 'Increase the cut radius. The opening widens through real remeshing.'
    if(r.cue===56)return 'The tunnel is empty space beneath solid ground. Compare the same front face.'
    if(r.cue===62)return 'Carve first, then add the pillar. The operation order brings solid material back.'
    return `A local pocket changes the surface. Only ${f.rebuilt} of ${f.chunks} chunks were rebuilt.`
  }
  if(r.cue===74)return 'Start with the same 104 seeded trees. Tide and branch grammar stay fixed.'
  if(r.cue===80&&r.seconds<83)return 'Drag Growth rate from 0 to 2, then advance time. Reproduction stays at 1.'
  if(r.cue===80)return f.births>0 ? 'New seedlings are appearing. Existing trees also grow in size.' : 'Ecological time is advancing. Watch the original trees grow before seedlings appear.'
  return `${f.trees} living trees, ${f.births} births and ${f.deaths} deaths. Compare with the original stand.`
}
export function filmMetrics(f: FilmRendered) {
  return f.request.story==='tide' ? `Water ${f.sea.toFixed(2)} u   /   Trail ${f.route.toFixed(0)} u   /   Exposed reef tips ${f.exposed}` : f.request.story==='cave' ? `Cut radius ${f.radius.toFixed(2)} u   /   ${f.triangles.toLocaleString()} triangles   /   Rebuilt ${f.rebuilt} of ${f.chunks} chunks` : `${f.trees} trees   /   +${f.births} births   /   ${f.deaths} deaths   /   ${f.time.toFixed(1)} model seconds`
}

export function filmControls(f: FilmRendered) {
  const r=f.request
  if(r.story==='tide') return [
    {label:'Tide amplitude',value:r.tideAmplitude,min:0,max:4,unit:' u',active:r.seconds>=10&&r.seconds<13,note:'2 → 4 · range of the tide'},
    {label:'Tide period',value:24,min:8,max:60,unit:' s',active:false,note:'Held at 24 model seconds'},
    {label:'Preview time',value:f.time,min:18,max:42,unit:' s',active:(r.seconds>=13&&r.seconds<22)||(r.seconds>=28&&r.seconds<38),note:'Clock scrub · not a physics slider'},
  ]
  if(r.story==='cave') return [
    {label:'Cave radius',value:f.radius,min:0,max:9,unit:' u',active:r.cue===48,note:'0 → 5 · subtract a cylinder'},
    {label:'Volume cells',value:48,min:32,max:64,unit:'',active:false,note:'Held at 48³ · 16³ per chunk'},
  ]
  return [
    {label:'Growth rate',value:r.growthRate,min:0,max:3,unit:'',active:r.seconds>=80&&r.seconds<83,note:'0 → 2 · size change per step'},
    {label:'Reproduction rate',value:1,min:0,max:3,unit:'',active:false,note:'Held at 1 · births are counted'},
    {label:'Preview time',value:f.time,min:0,max:18,unit:' s',active:r.seconds>=83&&r.seconds<98,note:'Model time · not biological years'},
  ]
}
