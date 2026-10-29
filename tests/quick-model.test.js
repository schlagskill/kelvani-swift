import test from 'node:test';import assert from 'node:assert/strict';import{visibleWorkspaces,restoredMessage}from'../quick-model.js';
const space=(id,favorite=false,date='2026-10-01')=>({id,name:id,favorite,updatedAt:date,tabs:[{title:'Docs',url:'https://example.com/docs'}]});
test('popup prioritizes favorites, then recency without changing stored order',()=>{const input=[space('old'),space('recent',false,'2026-10-13'),space('favorite',true)];assert.deepEqual(visibleWorkspaces(input).map(w=>w.id),['favorite','recent','old']);assert.equal(input[0].id,'old');});
test('popup search finds tab titles and URLs and removes the default six-item limit',()=>{const input=Array.from({length:9},(_,i)=>space('project'+i));assert.equal(visibleWorkspaces(input).length,6);assert.equal(visibleWorkspaces(input,'docs').length,9);assert.equal(visibleWorkspaces(input,'not found').length,0);});
test('partial restore failures stay visible in feedback',()=>{assert.match(restoredMessage({opened:2,reused:1,failed:[{}]}),/1 fehlgeschlagen/);assert.match(restoredMessage({opened:2,reused:1,failed:[{}]},true),/1 failed/);});

test('restore feedback includes pin and focus failures in both languages',()=>{
 const result={opened:2,reused:1,failed:[],pinFailures:1,focusFailed:true};
 assert.match(restoredMessage(result),/1 nicht angeheftet/);
 assert.match(restoredMessage(result),/Fokus konnte nicht gesetzt werden/);
 assert.match(restoredMessage(result,true),/1 not pinned/);
 assert.match(restoredMessage(result,true),/Could not focus the tab/);
});
test('successful restore feedback stays concise without warnings',()=>{
 assert.equal(restoredMessage({opened:2,reused:1,failed:[],pinFailures:0,focusFailed:false}),'2 geöffnet · 1 wiederverwendet');
 assert.equal(restoredMessage({opened:2},true),'2 opened · 0 reused');
});
