import test from 'node:test'; import assert from 'node:assert/strict';
let listener, created;
globalThis.chrome={action:{onClicked:{addListener:callback=>{listener=callback;}}},runtime:{getURL:path=>`chrome-extension://test/${path}`},tabs:{create:async options=>{created=options;}}};
await import('../background.js');
test('toolbar opens the packaged manager without requesting an external page',()=>{listener();assert.deepEqual(created,{url:'chrome-extension://test/index.html'});});
