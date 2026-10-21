/** Brief illustrated beats, aligned to the existing fourteen-second narration. */
export const STORY_BEATS=[
 {id:'ground',workspace:'noise',at:3.2,station:1,title:'Hills catch the rain.',label:'01 / GROUND',rule:'Noise → height → slopes',note:'A flat field rises into hills. Their shape gives water a direction.',parameters:['Height','Slope']},
 {id:'water',workspace:'simulation',at:5.6,station:2,title:'Water finds a way.',label:'02 / WATER',rule:'Rain → flow → a river',note:'Rain follows the slopes and carries soil downhill.',parameters:['Rain','Flow']},
 {id:'habitat',workspace:'living',at:8,station:3,title:'A place to take root.',label:'03 / HABITAT',rule:'Moisture + terrain → habitat',note:'The waterside becomes a place where a seed could settle.',parameters:['Moisture','Habitat']},
 {id:'life',workspace:'living',at:10,station:4,title:'A forest begins.',label:'04 / LIFE',rule:'A seed → growth → new seeds',note:'A sapling grows, then new seedlings join the landscape.',parameters:['Growth','New seeds']},
] as const
export function storyBeatAt(time:number){return STORY_BEATS.findLast(beat=>time>=beat.at)}
