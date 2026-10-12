import { validateState, saveWorkspace, mergeBackup, filterWorkspaces } from './core.js';
import { load, update, extensionMode } from './storage.js';
const $ = s => document.querySelector(s);
let state, busy = false;
const status = (message, error = false) => { $('#status').textContent = message; $('#status').className = error ? 'error' : ''; };
function element(tag, value, className) { const e = document.createElement(tag); e.textContent = value; if (className) e.className = className; return e; }
function lock(value) { busy = value; for (const button of document.querySelectorAll('button')) button.disabled = value || (!extensionMode && button.dataset.extension === 'true'); if (!extensionMode) { $('#capture').disabled = true; $('#refresh').disabled = true; } }
async function mutate(change, message) { const next = await update(change); state = next; render(); status(message); }
async function run(action) { if (busy) return; lock(true); try { await action(); } catch (error) { status(error.message, true); } finally { lock(false); } }
async function windows() {
  if (!extensionMode) { $('#window-select').replaceChildren(element('option', 'Erweiterung installieren')); return; }
  const list = await chrome.windows.getAll({ populate: true, windowTypes: ['normal'] });
  const previous = $('#window-select').value; $('#window-select').replaceChildren();
  for (const window of list.filter(w => !w.incognito)) { const option = element('option', `Fenster ${window.id} · ${window.tabs?.length || 0} Tabs${window.focused ? ' · aktiv' : ''}`); option.value = window.id; if (String(window.id) === previous || (!previous && window.focused)) option.selected = true; $('#window-select').append(option); }
}
function render() {
  $('#count').textContent = state.workspaces.length; $('#workspaces').replaceChildren(); $('#navigation').replaceChildren();
  const all = element('button', '◫ Alle Arbeitsbereiche'); all.addEventListener('click', () => { $('#filter').value = ''; render(); }); $('#navigation').append(all);
  for (const w of state.workspaces) { const nav = element('button', w.name); nav.addEventListener('click', () => { $('#filter').value = w.name; render(); }); $('#navigation').append(nav); }
  const filtered = filterWorkspaces(state, $('#filter').value);
  if (!filtered.length) $('#workspaces').append(element('div', state.workspaces.length ? 'Keine passenden Arbeitsbereiche gefunden.' : 'Dein erster Arbeitsbereich wartet. Speichere oben die Tabs eines Fensters.', 'empty'));
  for (const workspace of filtered) {
    const card = element('article', '', 'workspace'); const heading = element('div', '', 'workspace-heading');
    const title = element('div', ''); title.append(element('h3', workspace.name), element('p', `${workspace.tabs.length} Tabs · ${new Date(workspace.updatedAt).toLocaleString('de-DE', { dateStyle: 'medium', timeStyle: 'short' })}`));
    const actions = element('div', '', 'actions');
    const open = element('button', 'In neuem Fenster öffnen ↗'); open.dataset.extension = 'true'; open.disabled = !extensionMode;
    open.addEventListener('click', () => run(async () => {
      const opened = await chrome.windows.create({ url: workspace.tabs.map(t => t.url), focused: true });
      let pinFailures = 0;
      for (const [i, tab] of (opened.tabs || []).entries()) if (workspace.tabs[i]?.pinned && tab.id != null) { try { await chrome.tabs.update(tab.id, { pinned: true }); } catch { pinFailures++; } }
      status(pinFailures ? 'Fenster geöffnet; einige Tabs konnten nicht angeheftet werden.' : 'Arbeitsbereich in einem neuen Fenster geöffnet.');
    }));
    const rename = element('button', 'Umbenennen', 'secondary'); rename.addEventListener('click', () => run(async () => { const name = prompt('Neuer Name des Arbeitsbereichs:', workspace.name); if (name === null) return; await mutate(current => ({ ...current, workspaces: current.workspaces.map(w => w.id === workspace.id ? { ...w, name } : w) }), 'Arbeitsbereich umbenannt.'); }));
    const remove = element('button', 'Entfernen', 'secondary'); remove.addEventListener('click', () => run(async () => { if (!confirm(`Arbeitsbereich „${workspace.name}“ entfernen? Offene Tabs bleiben erhalten. Sichere ihn bei Bedarf zuerst per Export.`)) return; await mutate(current => ({ ...current, workspaces: current.workspaces.filter(w => w.id !== workspace.id) }), 'Arbeitsbereich entfernt.'); }));
    actions.append(open, rename, remove); heading.append(title, actions); card.append(heading);
    const list = element('div', '', 'tab-list');
    for (const tab of workspace.tabs) { const a = element('a', '', 'tab'); a.href = tab.url; a.target = '_blank'; a.rel = 'noopener noreferrer'; a.append(element('span', tab.pinned ? '◈' : '↗', 'tab-icon'), element('span', tab.title || new URL(tab.url).hostname), element('small', new URL(tab.url).hostname)); list.append(a); }
    card.append(list); $('#workspaces').append(card);
  }
}
$('#filter').addEventListener('input', render);
$('#capture-form').addEventListener('submit', event => { event.preventDefault(); const name = $('#workspace-name').value; const windowId = Number($('#window-select').value); run(async () => { if (!extensionMode) throw new Error('Bitte die Browser-Erweiterung installieren.'); const tabs = await chrome.tabs.query({ windowId }); await mutate(current => saveWorkspace(current, name, tabs, crypto.randomUUID(), new Date().toISOString()), 'Arbeitsbereich gespeichert. Deine Tabs bleiben geöffnet.'); $('#workspace-name').value = ''; }); });
$('#refresh').addEventListener('click', () => run(windows));
$('#export').addEventListener('click', () => run(async () => { const current = await load(); const url = URL.createObjectURL(new Blob([JSON.stringify(current, null, 2)], { type: 'application/json' })); const a = document.createElement('a'); a.href = url; a.download = 'kelvani-swift-backup.json'; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); status('Backup exportiert.'); }));
$('#import').addEventListener('change', event => { const file = event.target.files[0]; event.target.value = ''; if (!file) return; run(async () => { if (file.size > 2e6) throw new Error('Backup ist größer als 2 MB.'); const incoming = validateState(JSON.parse(await file.text())); await mutate(current => mergeBackup(current, incoming, () => crypto.randomUUID()), 'Backup importiert. Vorhandene Arbeitsbereiche bleiben erhalten.'); }); });
$('#demo').hidden = extensionMode;
$('#demo-load').addEventListener('click', () => run(async () => {
  const incoming = { version: 1, workspaces: [
    { id: 'demo-coding', name: 'Coding', updatedAt: '2026-10-12T10:00:00Z', tabs: [{ url: 'https://github.com/', title: 'GitHub', pinned: true }, { url: 'https://developer.chrome.com/docs/extensions/', title: 'Chrome Extension Docs', pinned: false }] },
    { id: 'demo-inspiration', name: 'Inspiration', updatedAt: '2026-10-12T10:00:00Z', tabs: [{ url: 'https://example.com/', title: 'Eine neue Idee', pinned: false }] }
  ] };
  await mutate(current => mergeBackup(current, incoming, () => crypto.randomUUID()), 'Beispieldaten geladen.');
}));
try { state = await load(); render(); await windows(); lock(false); } catch (error) { status(`Start fehlgeschlagen: ${error.message}. Vorhandene Daten werden nicht überschrieben.`, true); lock(true); }
