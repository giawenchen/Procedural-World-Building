import manifest from './journeyShort.json'
export const JOURNEY=manifest
export type JourneySection=typeof manifest.sections[number]
export function journeyAt(seconds:number){
 const t=Math.max(0,Math.min(manifest.duration,Number.isFinite(seconds)?seconds:0))
 const index=manifest.sections.findLastIndex(c=>t>=c.at),section=manifest.sections[Math.max(0,index)]
 const local=t-section.at
 // Each short shot traverses the original experiment, including its baseline and A/B hold.
 const sourceStart=section.sourceStart??0,sourceEnd=section.sourceEnd??0
 const studyTime=sourceStart+(sourceEnd-sourceStart-.025)*Math.min(1,local/section.duration)
 return {time:t,index,section,local,caption:manifest.captions.find(c=>t>=c.start&&t<c.end)?.text??'',studyTime,finished:t>=manifest.duration}
}
export const journeyStamp=(seconds:number)=>`${Math.floor(seconds/60)}:${String(Math.floor(seconds%60)).padStart(2,'0')}`
