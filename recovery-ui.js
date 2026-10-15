import {loadHistory,restoreCheckpoint} from './storage.js';
const container=document.querySelector('.header-actions');
if(container){
 const button=document.createElement('button');button.className='icon-button';button.textContent='↶';button.title='Wiederherstellung';button.setAttribute('aria-label','Wiederherstellungspunkte');container.prepend(button);
 const dialog=document.createElement('dialog');dialog.className='recovery-dialog';dialog.setAttribute('aria-label','Arbeitsbereiche wiederherstellen');document.body.append(dialog);
 button.addEventListener('click',async()=>{
  dialog.replaceChildren();const heading=document.createElement('h2');heading.textContent='Wiederherstellung';const note=document.createElement('p');note.textContent='Bis zu zwölf frühere Stände deiner Arbeitsbereiche werden lokal gespeichert, soweit das Speicherlimit es zulässt.';
  const close=document.createElement('button');close.textContent='Schließen';close.addEventListener('click',()=>dialog.close());dialog.append(heading,note);
  try{const entries=await loadHistory();if(!entries.length){const empty=document.createElement('p');empty.textContent='Noch keine Wiederherstellungspunkte vorhanden.';dialog.append(empty);}
   for(const entry of entries){const row=document.createElement('div');row.className='recovery-row';const label=document.createElement('span');label.textContent=new Date(entry.at).toLocaleString()+' · '+entry.state.workspaces.length+' Arbeitsbereiche';const restore=document.createElement('button');restore.textContent='Wiederherstellen';restore.addEventListener('click',async()=>{
    if(!confirm('Diesen Stand wiederherstellen? Der aktuelle Stand bleibt als neuer Wiederherstellungspunkt erhalten.'))return;
    restore.disabled=true;try{await restoreCheckpoint(entry.id);location.reload();}catch(error){note.textContent=error.message;restore.disabled=false;}
   });row.append(label,restore);dialog.append(row);}
  }catch(error){note.textContent=error.message;}dialog.append(close);dialog.showModal();
 });dialog.addEventListener('close',()=>button.focus());
}
