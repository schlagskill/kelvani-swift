import { validateState } from './core.js';
import { createWorkspace } from './workspaces.js';

export const STARTERS = [
 { id:'coding', name:['Entwicklung','Development'], description:['Code, Dokumentation und Browser-Werkzeuge an einem Ort.','Code, documentation and browser tools in one place.'], icon:'code', color:'violet', tabs:[['GitHub','https://github.com/'],['MDN Web Docs','https://developer.mozilla.org/'],['Chrome Extensions','https://developer.chrome.com/docs/extensions/']] },
 { id:'research', name:['Recherche','Research'], description:['Quellen sammeln und eine Recherche später weiterführen.','Collect sources and pick up your research later.'], icon:'globe', color:'blue', tabs:[['Wikipedia','https://www.wikipedia.org/'],['Google Scholar','https://scholar.google.com/'],['Internet Archive','https://archive.org/']] },
 { id:'learning', name:['Lernen & Schule','Learning & school'], description:['Lernmaterial, Videos und Wiederholung zusammenhalten.','Keep learning material, videos and revision together.'], icon:'book', color:'mint', tabs:[['Khan Academy','https://www.khanacademy.org/'],['YouTube','https://www.youtube.com/'],['AnkiWeb','https://ankiweb.net/']] },
 { id:'printing', name:['3D-Druck','3D printing'], description:['Modelle finden, konstruieren und Druckideen sammeln.','Find models, design parts and collect printing ideas.'], icon:'spark', color:'amber', tabs:[['Tinkercad','https://www.tinkercad.com/'],['Printables','https://www.printables.com/'],['OpenSCAD','https://openscad.org/']] },
 { id:'writing', name:['Schreiben','Writing'], description:['Entwürfe, Sprache und Texte in einem Arbeitsbereich.','Keep drafts, language and writing in one workspace.'], icon:'book', color:'rose', tabs:[['GitHub Gist','https://gist.github.com/'],['Duden','https://www.duden.de/'],['LanguageTool','https://languagetool.org/']] },
 { id:'planning', name:['Persönliche Planung','Personal planning'], description:['Kalender und wichtige Anlaufstellen für deinen Alltag.','A calendar and useful starting points for your day.'], icon:'briefcase', color:'slate', tabs:[['Google Calendar','https://calendar.google.com/'],['GitHub','https://github.com/'],['Wikipedia','https://www.wikipedia.org/']] },
];
export function templateLibrary(state, language='de') {
 const index=language==='en'?1:0;
 return [
  ...STARTERS.map(item=>({ ...item, id:`starter:${item.id}`, name:item.name[index], description:item.description[index], custom:false, tabs:item.tabs.map(([title,url])=>({ title,url,pinned:false })) })),
  ...(state.templates??[]).map(item=>({ ...structuredClone(item), id:`custom:${item.id}`, originalId:item.id, custom:true, description:'' })),
 ];
}
function cleanTemplate(draft,id,date=new Date().toISOString()) {
 return validateState({ version:1, workspaces:[{ id,name:draft.name,tabs:draft.tabs,color:draft.color??'violet',icon:draft.icon??'folder',updatedAt:date }] }).workspaces[0];
}
export function instantiateTemplate(state,draft,id,date) {
 return createWorkspace(state,cleanTemplate(draft,id,date));
}
export function saveTemplate(state,draft,id,expected=null,date) {
 const template=cleanTemplate(draft,id,date), existing=(state.templates??[]).find(item=>item.id===id);
 if (expected && (!existing || JSON.stringify(existing)!==JSON.stringify(expected))) throw new Error('Diese Vorlage wurde in einem anderen Fenster geändert.');
 if (existing && !expected) throw new Error('Vorlagen-ID bereits vorhanden.');
 return validateState({ ...state,templates:existing?state.templates.map(item=>item.id===id?template:item):[...(state.templates??[]),template] });
}
export function removeTemplate(state,id,expected) {
 const found=(state.templates??[]).find(item=>item.id===id);
 if (!found || JSON.stringify(found)!==JSON.stringify(expected)) throw new Error('Diese Vorlage wurde in einem anderen Fenster geändert.');
 return validateState({ ...state,templates:state.templates.filter(item=>item.id!==id) });
}
