export const ATLAS_DURATION=328
export const ATLAS_CUES=[
 {at:0,id:'intro',title:'A world is a collection of rules',session:'FIELDWORK / JIAWEN CHEN',note:'A procedural atlas · AI-assisted experiments · Sessions 1–7'},
 {at:8,id:'noise',title:'01 / First, a field of numbers',session:'SESSION 3 · MAPS',note:'Seed 17 · change frequency; keep amplitude and octaves fixed'},
 {at:26,id:'resolution',title:'The same field, sampled differently',session:'SESSION 3 · RESOLUTION',note:'Frequency 4 · same 160-unit domain · wireframe reveals sampling'},
 {at:40,id:'shader',title:'A material makes the height legible',session:'SESSION 3 · SHADERS',note:'Same geometry · moving the snow threshold only changes the material'},
 {at:52,id:'erosion',title:'02 / Rain leaves a record',session:'SESSION 4 · EROSION',note:'Two identical starting fields · same steps · different rainfall'},
 {at:74,id:'climate',title:'Climate becomes a habitat map',session:'SESSION 4 · BIOMES',note:'Same terrain and temperature · moisture changes classification'},
 {at:92,id:'density',title:'03 / What exists inside the ground?',session:'SESSION 5 · DENSITY',note:'Negative = solid · zero = surface · the slice reveals the interior'},
 {at:108,id:'cave',title:'Subtract space. Change the order.',session:'SESSION 5 · CSG',note:'A cylinder cuts the volume · adding a pillar afterward restores solid'},
 {at:128,id:'pocket',title:'A small edit has a local footprint',session:'SESSION 5 · CHUNKING',note:'Same 48³ cells · 16³ chunks · cached distant meshes need no rebuild'},
 {at:140,id:'voxel-resolution',title:'Detail has a measurable cost',session:'SESSION 5 · PERFORMANCE',note:'Same density, extent and 16³ chunks · CPU mesh timings, not FPS'},
 {at:154,id:'chunks',title:'Smaller chunks, different overhead',session:'SESSION 5 · OPTIMIZATION',note:'Same 48³ field and pocket · count local rebuilds versus all chunks'},
 {at:166,id:'meshing',title:'One volume, several ways to build a surface',session:'SESSION 5 · MESHING ALTERNATIVES',note:'Technique guide · this project implements Marching Cubes'},
 {at:174,id:'wind',title:'04 / Give every point a direction',session:'SESSION 6 · VECTOR FIELDS',note:'Same seeded particles, speed and time · direction 0° versus 90°'},
 {at:192,id:'fluid',title:'Transport is only part of a fluid',session:'SESSION 6 · ADVECTION & PRESSURE',note:'Same 40² grid, forcing and time · 0 versus 40 pressure iterations'},
 {at:212,id:'grammar',title:'05 / One rule becomes branches',session:'SESSION 7 · L-SYSTEMS',note:'F → F[+F]F[-F][&F] · parallel rewriting · fixed 30° branch angle'},
 {at:230,id:'angle',title:'Keep the grammar. Open the crown.',session:'SESSION 7 · PLANT FORM',note:'Same three iterations and 125 segments · change branch angle only'},
 {at:238,id:'growth',title:'Separate size from births',session:'SESSION 7 · GROWTH',note:'Same 104 plants · reproduction off · growth rate 0 versus 2'},
 {at:246,id:'population',title:'A tree has a life. A forest has a history.',session:'SESSION 7 · ECOSYSTEMS',note:'Same initial 104 plants and growth 2 · reproduction 0 versus 1'},
 {at:268,id:'competition',title:'Crowding is a rule, too',session:'SESSION 7 · COMPETITION',note:'Same initial plants, growth, reproduction and time · crowding radius 0 versus 5'},
 {at:276,id:'tide',title:'One change can alter where you can go',session:'CONNECTED STUDY · TIDE & PATH',note:'Plant state fixed · prescribed tide · A* excludes flooded ground'},
 {at:296,id:'planet',title:'All these questions belong to one world',session:'FIELDWORK / PROCEDURAL WORLD BUILDING',note:'A rotating procedural planet · linked visual controls, independent study domains'},
] as const
export type AtlasKind=typeof ATLAS_CUES[number]['id']
const clamp=(v:number)=>Math.max(0,Math.min(1,v))
export const mix=(a:number,b:number,t:number)=>a+(b-a)*clamp(t)
export function atlasAt(seconds:number){const s=Math.max(0,Math.min(ATLAS_DURATION,seconds)),cue=ATLAS_CUES.findLast(c=>s>=c.at)!,i=ATLAS_CUES.indexOf(cue),duration=(ATLAS_CUES[i+1]?.at??ATLAS_DURATION)-cue.at,local=s-cue.at,p=clamp((local-Math.min(3,duration*.22))/Math.max(3,duration-8)),orbit=.28*Math.sin(Math.PI*clamp(local/(duration*.7)))**2;return {seconds:s,cue,kind:cue.id,local,duration,p,orbit,compare:local>duration-Math.min(5,duration*.28)}}
export type AtlasRequest=ReturnType<typeof atlasAt>
export type AtlasControl={label:string;value:number;min:number;max:number;unit?:string;note:string;active?:boolean}
export type AtlasFrame={request:AtlasRequest;canvas:HTMLCanvasElement;caption:string;metrics:string;controls:AtlasControl[];notes:string[];reference?:HTMLCanvasElement;referenceLabel?:string;referenceMetrics?:string;label?:string;paired?:boolean;measurements?:Record<string,unknown>}
export type AtlasLink={request:AtlasRequest;frame:AtlasFrame|null}
