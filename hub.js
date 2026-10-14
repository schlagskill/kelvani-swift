import { siteIcon } from './site-icons.js';
import { icon } from "./assets/ui/icons.js?v=1.0";
import { templateLibrary } from './templates.js';
import { hubTranslate } from './hub-i18n.js?v=0.7.0-final';
import { COLORS, ICONS } from './workspaces.js';
import { safeUrl } from './core.js';

export function mountHub(api) {
 const $=id=>document.getElementById(id), ht=key=>hubTranslate(api.language(),key);
 const { el, button, symbol }=api;
 let original=null, onlyFavorites=false, lastMatching=[], recordNumber=0;
 $('only-favorites').onclick=()=>{onlyFavorites=!onlyFavorites;render(lastMatching);};$('workspace-sort').onchange=()=>render(lastMatching);
 function view(mode) { $('search').value=''; api.setView(mode); }
 for(const id of ['home-templates','templates-entry']) $(id).onclick=()=>view('templates');
 for(const id of ['home-view','overview-entry']) $(id).onclick=()=>view('home');
 for(const id of ['home-guide','help-entry']) $(id).onclick=()=>api.showDialog('guide-dialog');
 for(const id of ['home-new','home-blank','templates-blank']) $(id).onclick=()=>api.createEmpty();
 $('template-add-link').onclick=()=>{ appendLink({ title:'',url:'',pinned:false }); $('template-links').lastChild.querySelector('.draft-url').focus(); };
 $('template-form').onsubmit=event=>{
  event.preventDefault();
  try { const draft=readDraft(); if(draft) api.create(draft,event.submitter).then(ok=>{if(ok)$('template-dialog').close();}); } catch(error) { api.error(error); }
 };
 for(const [id,replace] of [['template-save-new',false],['template-update',true]]) $(id).onclick=async()=>{
  try { const draft=readDraft(); if(!draft)return; const ok=await api.save(draft,replace?original:null,$(id)); if(ok)$('template-dialog').close(); } catch(error){api.error(error);}
 };
 $('template-delete').onclick=()=>{
  if(!original)return;const saved=structuredClone(original);$('template-dialog').close();api.remove(saved);
 };
 function appendLink(tab) {
  const row=el('div','draft-link'), check=el('input');check.type='checkbox';check.checked=true;
  check.setAttribute('aria-label',`${ht('include')}: ${tab.title||ht('addLink')}`);
  const fields=el('div','draft-fields'), title=el('input','draft-title'),url=el('input','draft-url');
  title.value=tab.title;title.maxLength=300;title.placeholder=ht('title');title.setAttribute('aria-label',ht('title'));
  url.type='url';url.value=tab.url;url.required=true;url.maxLength=8192;url.placeholder='https://example.com';url.setAttribute('aria-label',ht('url'));
  row.dataset.pinned=String(Boolean(tab.pinned));
  title.addEventListener('input',()=>check.setAttribute('aria-label',`${ht('include')}: ${title.value||ht('addLink')}`));
  check.onchange=()=>{url.disabled=!check.checked;title.disabled=!check.checked;row.classList.toggle('excluded',!check.checked);};
  fields.append(title,url);
  row.append(check,fields,button(ht('removeLink'),()=>row.remove(),'icon-button'));
  row.lastChild.replaceChildren(icon('close'));$('template-links').append(row);
 }
 function readDraft() {
  if(!$('template-form').reportValidity())return null;
  const tabs=[...$('template-links').children].filter(row=>row.querySelector('[type=checkbox]').checked).map(row=>{
   const url=safeUrl(row.querySelector('.draft-url').value.trim());
   return { url,title:row.querySelector('.draft-title').value.trim()||new URL(url).hostname,pinned:row.dataset.pinned==='true' };
  });
  return { name:$('template-name').value.trim(),color:$('template-color').value,icon:$('template-icon').value,tabs };
 }
 function preview(template, source=null) {
  original=source?structuredClone(source):null;
  $('template-name').value=template.name;
  $('template-color').replaceChildren(...COLORS.map(color=>{const node=el('option','',api.t(`color_${color}`));node.value=color;return node;}));$('template-color').value=template.color??'violet';
  $('template-icon').replaceChildren(...ICONS.map(icon=>{const node=el('option','',api.t(`icon_${icon}`));node.value=icon;return node;}));$('template-icon').value=template.icon??'folder';
  $('template-links').replaceChildren();template.tabs.forEach(appendLink);
  $('template-update').hidden=!original;$('template-delete').hidden=!original;
  api.showDialog('template-dialog');$('template-name').focus();
 }
 function chips(tabs) {
  const node=el('div','domain-chips');
  for(const tab of tabs.slice(0,3))node.append(el('span','',new URL(tab.url).hostname.replace(/^www\./,'')));
  if(tabs.length>3)node.append(el('span','',`+${tabs.length-3}`));
  return node;
 }
 function templateCard(template) {
  const card=button(template.name,()=>preview(template,template.custom?api.state().templates.find(item=>item.id===template.originalId):null),'template-card');
  const head=el('div','card-top');head.append(symbol(template),el('span','card-category',template.custom?ht('customTemplates'):`${template.tabs.length} ${ht('links')}`));
  card.replaceChildren(head,el('h3','',template.name),el('p','card-description',template.description||template.tabs.slice(0,2).map(tab=>tab.title).join(' · ')||ht('blank')),chips(template.tabs));
  const foot=el('div','card-footer',ht('useTemplate'));foot.append(el('span','','↗'));card.append(foot);return card;
 }
 function workspaceCard(workspace) {
  const row=el('div','space-list-item');row.setAttribute('role','listitem');
  const card=button(workspace.name,()=>api.select(workspace.id),'space-row');
  const name=el('div','space-copy'),title=el('h3','',workspace.name);
  if(workspace.favorite){const star=icon('star');star.classList.add('favorite-star');title.append(star);}
  const preview=el('div','space-preview'),icons=el('span','site-stack');
  for(const tab of workspace.tabs.slice(0,3))icons.append(siteIcon(tab.url,api.faviconRuntime));
  preview.append(icons,el('span','space-domains',workspace.tabs.slice(0,2).map(tab=>new URL(tab.url).hostname.replace(/^www\./,'')).join(' · ')||ht('emptySpace')));
  name.append(title,preview);
  const count=el('span','space-tab-count',String(workspace.tabs.length));
  count.append(el('span','visually-hidden',' '+api.t(workspace.tabs.length===1?'tab':'tabs')));
  const date=el('span','space-updated',new Intl.DateTimeFormat(api.language(),{day:'numeric',month:'short',...(new Date(workspace.updatedAt).getFullYear()!==new Date().getFullYear()?{year:'numeric'}:{})}).format(new Date(workspace.updatedAt)));date.title=new Intl.DateTimeFormat(api.language(),{dateStyle:'medium',timeStyle:'short'}).format(new Date(workspace.updatedAt));
  const contextId='space-context-'+(++recordNumber);preview.id=contextId;count.id=contextId+'-count';date.id=contextId+'-date';
  date.prepend(el('span','visually-hidden',ht('editedColumn')+' '));
  card.setAttribute('aria-describedby',`${preview.id} ${count.id} ${date.id}`);
  card.replaceChildren(symbol(workspace),name,count,date,icon('right'));
  row.append(card);return row;
 }
 function render(matching) {
  lastMatching=matching; const english=api.language()==='en';
  $('only-favorites').textContent=english?'Favorites':'Favoriten';$('only-favorites').setAttribute('aria-pressed',String(onlyFavorites));$('sort-label').textContent=english?'Sort':'Sortierung';
  [...$('workspace-sort').options].forEach((option,i)=>option.textContent=(english?['Recently updated','Name','Tab count']:['Zuletzt bearbeitet','Name','Anzahl Tabs'])[i]);
  const all=api.state().workspaces;const stats=[[all.length,english?'Workspaces':'Arbeitsbereiche'],[all.reduce((n,w)=>n+w.tabs.length,0),english?'Saved tabs':'Gesicherte Tabs'],[all.filter(w=>w.favorite).length,english?'Favorites':'Favoriten']];
  $('overview-stats').hidden=all.length===0;
  document.querySelector('.overview-controls').hidden=all.length===0;
  $('overview-stats').replaceChildren(...stats.map(([count,label])=>{const card=el('div','overview-stat');card.append(el('strong','',String(count)),el('span','',label));return card;}));
  matching=[...matching].filter(w=>!onlyFavorites||w.favorite).sort((a,b)=>$('workspace-sort').value==='name'?a.name.localeCompare(b.name,api.language()):$('workspace-sort').value==='size'?b.tabs.length-a.tabs.length:Date.parse(b.updatedAt)-Date.parse(a.updatedAt));
  document.querySelectorAll('[data-hub]').forEach(node=>node.textContent=ht(node.dataset.hub));
  const view=api.view();document.body.dataset.view=view;
  for(const [id,glyph] of [['home-view','folder'],['live-view','globe'],['templates-entry','book']])$(id).prepend(icon(glyph));
  $('home-panel').hidden=view!=='home';$('templates-panel').hidden=view!=='templates';
  $('home-view').setAttribute('aria-pressed',String(view==='home'));
  $('overview-entry').setAttribute('aria-current',view==='home'?'page':'false');
  $('templates-entry').setAttribute('aria-current',view==='templates'?'page':'false');
  if(api.compact){$('home-view').textContent=ht('shortHome');$('saved-view').textContent=ht('areas');$('live-view').textContent=ht('shortLive');}
  if(view==='templates') {$('search').placeholder=ht('templateSearch');$('search').setAttribute('aria-label',ht('templateSearch'));}
  $('spaces-count').textContent=String(api.state().workspaces.length);
  $('workspace-cards').replaceChildren(...matching.map(workspaceCard));
  document.querySelector('.space-list-heading').hidden=!matching.length;
  $('home-empty').hidden=matching.length>0;
  $('home-empty').querySelector('p').hidden=!(all.length&&!matching.length);
  if(api.state().workspaces.length && !matching.length){$('home-empty').querySelector('h3').textContent=onlyFavorites?(english?'No favorites yet.':'Noch keine Favoriten.'):api.t('noResults');$('home-empty').querySelector('p').textContent=onlyFavorites?(english?'Mark a workspace with the star to find it here.':'Markiere einen Arbeitsbereich mit dem Stern, um ihn hier wiederzufinden.'):api.t('noResultsHelp');}
  const library=templateLibrary(api.state(),api.language()),query=$('search').value.trim().toLocaleLowerCase();
  const filtered=library.filter(item=>`${item.name} ${item.description} ${item.tabs.map(tab=>`${tab.title} ${tab.url}`).join(' ')}`.toLocaleLowerCase().includes(query));
  $('starter-grid').replaceChildren(...filtered.filter(item=>!item.custom).map(templateCard));
  $('custom-grid').replaceChildren(...filtered.filter(item=>item.custom).map(templateCard));
  $('own-template-help').hidden=Boolean((api.state().templates??[]).length);
  $('template-no-results').hidden=filtered.length>0;
  $('save-space-template').disabled=!api.workspace()||api.unavailable();
 }
 return { render,openWorkspace:workspace=>preview(workspace),openLibrary:()=>view('templates') };
}
