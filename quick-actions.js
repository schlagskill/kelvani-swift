import{captureWindow}from'./browser.js';import{snapshot}from'./core.js';import{createWorkspace}from'./workspaces.js';
export async function captureIntoWorkspace(api,store,name,mode="window"){if(typeof name!=='string'||!name.trim()||name.trim().length>80)throw Error('Bitte einen Namen mit höchstens 80 Zeichen eingeben.');const win=await api.windows.getCurrent();let data;
if(mode==='active') {
 const window=await api.windows.get(win.id);
 if(window.incognito||window.type!=='normal')throw Error('Private Fenster werden nicht gespeichert.');
 const tabs=snapshot(await api.tabs.query({active:true,windowId:win.id}));
 if(!tabs.length)throw Error('Dieser Tab kann nicht gespeichert werden.');
 data={tabs,source:'Aktueller Tab'};
}else data=await captureWindow(api,win.id);const id=crypto.randomUUID();return store.update(latest=>createWorkspace(latest,{id,name:name.trim(),tabs:data.tabs,source:data.source,color:'violet',icon:'folder',favorite:false}));}
export async function restoreWorkspace(api,store,id,expectedTabs=null){const latest=await store.load();const current=latest.workspaces.find(w=>w.id===id);if(!current||!current.tabs.length)throw Error('Dieser Arbeitsbereich enthält keine verfügbaren Tabs mehr.');if(expectedTabs&&JSON.stringify(current.tabs)!==JSON.stringify(expectedTabs))throw Error('Der Arbeitsbereich wurde geändert. Bitte die Vorschau erneut öffnen.');const win=await api.windows.getCurrent();const response=await api.runtime.sendMessage({type:'swift.open-tabs',requestId:crypto.randomUUID(),tabs:current.tabs,targetWindowId:win.id});if(!response?.ok)throw Error(response?.error??'Öffnen fehlgeschlagen.');return response.result;}

