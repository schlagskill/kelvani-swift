import test from 'node:test';import assert from 'node:assert/strict';import {checkpoint,recoveryState,validHistory} from '../history.js';
const empty={version:1,workspaces:[]},workspace={id:'one',name:'One',updatedAt:'2026-10-15T00:00:00Z',tabs:[]};
test('checkpoint preserves deleted workspace for recovery',()=>{const before={...empty,workspaces:[workspace]};const h=checkpoint([],before,empty,'a','2026-10-15T01:00:00Z');assert.deepEqual(recoveryState(h,'a'),before);assert.deepEqual(before.workspaces,[workspace]);});
test('identical states do not create checkpoints',()=>assert.deepEqual(checkpoint([],empty,empty,'a','2026-10-15T01:00:00Z'),[]));
test('invalid history entries excluded',()=>assert.equal(validHistory([{id:'a',at:'bad',state:empty},{id:'b',at:'2026-10-15T00:00:00Z',state:{version:99}}]).length,0));
test('checkpoint retains at most twelve and stale restore is explicit',()=>{let h=[];for(let i=0;i<20;i++)h=checkpoint(h,empty,{...empty,workspaces:[workspace]},String(i),'2026-10-15T00:00:00Z');assert.equal(h.length,12);assert.throws(()=>recoveryState(h,'0'));});
