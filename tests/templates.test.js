import test from 'node:test';
import assert from 'node:assert/strict';
import { EMPTY, validateState, mergeBackup } from '../core.js';
import { templateLibrary, STARTERS, instantiateTemplate, saveTemplate, removeTemplate } from '../templates.js';
const date='2026-10-13T10:00:00Z';
const draft=()=>templateLibrary(EMPTY,'de')[0];
test('six bilingual starter templates use safe unique URLs and never mutate defaults',()=>{
 assert.equal(STARTERS.length,6);
 for(const language of ['de','en'])for(const item of templateLibrary(EMPTY,language)) {
  assert.ok(item.name&&item.description);const created=instantiateTemplate(EMPTY,item,crypto.randomUUID(),date);
  assert.equal(created.workspaces[0].tabs.length,3);
 }
 assert.equal(EMPTY.workspaces.length,0);
});
test('customised starter creates an independent workspace with selected links and metadata',()=>{
 const template=draft();template.name='My project';template.tabs=template.tabs.slice(1);
 const state=instantiateTemplate(EMPTY,template,'project',date);
 assert.equal(state.workspaces[0].name,'My project');assert.equal(state.workspaces[0].tabs.length,2);
 state.workspaces[0].tabs[0].title='Changed';assert.equal(templateLibrary(EMPTY)[0].tabs[1].title,'MDN Web Docs');
});
test('saving a template is independent of existing workspaces, snapshots and settings',()=>{
 const state={...instantiateTemplate(EMPTY,draft(),'project',date),settings:{language:'en',theme:'dark'}};
 const saved=saveTemplate(state,state.workspaces[0],'template',null,date);
 assert.equal(saved.templates.length,1);assert.equal(saved.workspaces.length,1);assert.deepEqual(saved.settings,state.settings);
 saved.templates[0].tabs[0].title='Changed';assert.equal(state.workspaces[0].tabs[0].title,'GitHub');
});
test('template edits and deletes detect changes in another view and leave instantiated workspaces intact',()=>{
 const state=saveTemplate(instantiateTemplate(EMPTY,draft(),'project',date),draft(),'template',null,date),original=state.templates[0];
 const changed=saveTemplate(state,{...draft(),name:'Updated'},'template',original,date);
 assert.throws(()=>saveTemplate(changed,draft(),'template',original,date),/anderen Fenster/);
 assert.throws(()=>removeTemplate(changed,'template',original),/anderen Fenster/);
 const removed=removeTemplate(changed,'template',changed.templates[0]);assert.equal(removed.templates.length,0);assert.equal(removed.workspaces.length,1);
});
test('template backups merge safely, retain both conflicting versions, and preserve current preferences',()=>{
 const first=saveTemplate(EMPTY,draft(),'template',null,date);
 const second=saveTemplate(EMPTY,{...draft(),name:'Other'},'template',null,date);
 const merged=mergeBackup({...first,settings:{language:'de',theme:'light'}},{...second,settings:{language:'en',theme:'dark'}},()=> 'new-id');
 assert.equal(merged.templates.length,2);assert.deepEqual(merged.settings,{language:'de',theme:'light'});
 assert.deepEqual(mergeBackup(first,first,()=> 'unused'),first);
});
test('old backups remain unchanged; empty templates are allowed but unsafe or duplicate URLs are rejected',()=>{
 assert.deepEqual(validateState(EMPTY),EMPTY);assert.equal(saveTemplate(EMPTY,{...draft(),tabs:[]},'empty',null,date).templates[0].tabs.length,0);
 for(const tabs of [[{title:'Bad',url:'javascript:alert(1)',pinned:false}],[draft().tabs[0],draft().tabs[0]]]) assert.throws(()=>saveTemplate(EMPTY,{...draft(),tabs},'bad',null,date));
});
test('template capacity and duplicate IDs reject the complete change without losing existing data',()=>{
 const state={version:1,workspaces:[],templates:Array.from({length:50},(_,i)=>({...draft(),id:String(i),updatedAt:date}))};
 const valid=validateState(state),before=JSON.stringify(valid);
 assert.throws(()=>saveTemplate(valid,draft(),'overflow',null,date));assert.equal(JSON.stringify(valid),before);
 assert.throws(()=>saveTemplate(valid,draft(),'0',null,date));
});
test('custom and starter IDs cannot shadow one another in the visible library',()=>{
 const state=saveTemplate(EMPTY,draft(),'coding',null,date),library=templateLibrary(state);
 assert.equal(new Set(library.map(item=>item.id)).size,7);assert.ok(library.some(item=>item.id==='starter:coding'));assert.ok(library.some(item=>item.id==='custom:coding'));
});
