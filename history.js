import {validateState} from './core.js';
export const MAX_HISTORY_BYTES=1500000;
export function validHistory(value){
 if(!Array.isArray(value))return [];
 const result=[];
 for(const item of value.slice(0,12)){
  try{if(typeof item.id!=='string'||!Number.isFinite(Date.parse(item.at)))continue;result.push({id:item.id,at:item.at,state:validateState(item.state)});}catch{}
 }
 return result;
}
export function checkpoint(history,before,after,id,at){
 const old=validateState(before),next=validateState(after);
 if(JSON.stringify(old)===JSON.stringify(next))return validHistory(history);
 const result=[{id,at,state:old},...validHistory(history)].slice(0,12);
 while(result.length&&new TextEncoder().encode(JSON.stringify(result)).length>MAX_HISTORY_BYTES)result.pop();
 return result;
}
export function recoveryState(history,id){const found=validHistory(history).find(item=>item.id===id);if(!found)throw new Error('Dieser Wiederherstellungspunkt ist nicht mehr verfügbar.');return structuredClone(found.state);}
