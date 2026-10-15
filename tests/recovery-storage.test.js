import test from 'node:test';import assert from 'node:assert/strict';
const values={};let fail=false,queue=Promise.resolve();
globalThis.chrome={runtime:{id:'recovery-tests'},storage:{local:{get:async key=>({[key]:structuredClone(values[key])}),set:async patch=>{if(fail)throw new Error('quota');Object.assign(values,structuredClone(patch));}}}};
Object.defineProperty(navigator,'locks',{configurable:true,value:{request:(_key,fn)=>{const next=queue.then(fn);queue=next.catch(()=>{});return next;}}});
const {load,update,loadHistory,restoreCheckpoint}=await import('../storage.js');
const workspace={id:'a',name:'Projekt',updatedAt:'2026-10-15T00:00:00Z',tabs:[{url:'https://example.com/',title:'Example',pinned:false}]};
test('deleting and restoring retains latest checkpoint and current state',async()=>{
 await update(s=>({...s,workspaces:[workspace]}));await update(s=>({...s,workspaces:[]}));const history=await loadHistory();const deleted=history.find(h=>h.state.workspaces.length===1);assert.ok(deleted);await restoreCheckpoint(deleted.id);assert.equal((await load()).workspaces[0].tabs[0].url,'https://example.com/');assert.equal((await loadHistory())[0].state.workspaces.length,0);
});
test('quota failure commits neither state nor history',async()=>{const before=structuredClone(values);fail=true;await assert.rejects(update(s=>({...s,workspaces:[]})),/quota/);fail=false;assert.deepEqual(values,before);});
test('callback mutation cannot change checkpoint before state',async()=>{await update(s=>{s.workspaces[0].name='Changed';return s;});const history=await loadHistory();assert.equal(history[0].state.workspaces[0].name,'Projekt');assert.equal((await load()).workspaces[0].name,'Changed');});
