import { validateState, saveWorkspace, mergeBackup, filterWorkspaces, snapshot, removeSavedTabs } from './core.js';
import { captureWindow, openSavedTabs } from './browser.js';
import { load, update, extensionMode } from './storage.js';
import { $, el, button, notify, showDialog, download, readBackup, wireDialogs } from './ui.js';
let state, selectedId = null, selectedUrl = null, checked = new Set(), mode = 'saved', busy = false, incoming, retryResult, unavailable = false;
let selectedTheme = 'auto'; const systemDark = matchMedia('(prefers-color-scheme: dark)');
function applyTheme() { document.body.dataset.theme = selectedTheme === 'auto' ? (systemDark.matches ? 'night' : 'sand') : selectedTheme; }
systemDark.addEventListener('change', applyTheme);
const workspace = () => state.workspaces.find(w => w.id === selectedId);
function lock() { for (const node of document.querySelectorAll('button')) { if (!node.hasAttribute('data-close')) node.disabled = unavailable || busy || (node.dataset.live === 'true' && !extensionMode); } document.body.setAttribute('aria-busy', String(busy)); }
async function run(action, errorSelector = null) { if (busy || unavailable) return; busy = true; lock(); try { await action(); } catch (error) { if (errorSelector) $(errorSelector).textContent = error.message; else notify(error.message, true); } finally { busy = false; lock(); } }
async function mutate(change) { state = await update(change); render(); }
function choose(id) { selectedId = id; selectedUrl = null; checked.clear(); $('#tab-filter').value = ''; render(); }
function render() {
  const focusId = document.activeElement?.id;
  const list = filterWorkspaces(state, $('#filter').value); $('#workspace-cards').replaceChildren();
  if (!list.some(w => w.id === selectedId)) { selectedId = list[0]?.id ?? null; selectedUrl = null; checked.clear(); }
  $('#empty').hidden = list.length > 0;
  $('#empty').textContent = state.workspaces.length ? 'Keine passenden Arbeitsbereiche. Ändere oder lösche deinen Suchbegriff.' : 'Noch kein Arbeitsbereich. Sichere die Tabs eines Browserfensters oder importiere ein Backup.';
  for (const w of list) {
    const card = button('', () => choose(w.id), 'workspace-card'); card.id = `workspace-${w.id}`; card.setAttribute('aria-pressed', w.id === selectedId); card.append(el('strong', w.name), el('span', `${w.tabs.length} Tabs`, 'count'));
    const time = el('time', new Date(w.updatedAt).toLocaleString('de-DE', { dateStyle: 'medium', timeStyle: 'short' })); time.dateTime = w.updatedAt; card.append(time); $('#workspace-cards').append(card);
  }
  const w = workspace(); $('#workspace-view').hidden = !w;
  if (w) {
    $('#workspace-title').textContent = w.name; $('#workspace-meta').textContent = `Manuell gesichert · ${w.source ?? 'Quelle nicht gespeichert'} · ${new Date(w.updatedAt).toLocaleString('de-DE')} · Offene Tabs bleiben unverändert`;
    const query = $('#tab-filter').value.trim().toLocaleLowerCase(); const tabs = w.tabs.filter(t => `${t.title} ${t.url}`.toLocaleLowerCase().includes(query));
    if (!tabs.some(t => t.url === selectedUrl)) selectedUrl = tabs[0]?.url ?? null;
    checked = new Set([...checked].filter(url => w.tabs.some(t => t.url === url)));
    $('#tab-count').textContent = `${tabs.length} von ${w.tabs.length}`; $('#tabs').replaceChildren();
    if (!tabs.length) $('#tabs').append(el('p', 'Keine passenden Tabs. Suche zurücksetzen, um alle anzuzeigen.', 'empty'));
    for (const [index, tab] of tabs.entries()) {
      const row = el('div', '', `tab-row${selectedUrl === tab.url ? ' selected' : ''}`), label = el('label', '', 'tab-select'), check = el('input'); check.id = `tab-check-${index}`; check.type = 'checkbox'; check.checked = checked.has(tab.url); check.setAttribute('aria-label', `${tab.title} auswählen`);
      check.addEventListener('change', () => { if (check.checked) checked.add(tab.url); else checked.delete(tab.url); render(); }); label.append(check);
      const pick = button('', () => { selectedUrl = tab.url; render(); }, 'tab-pick'); pick.id = `tab-pick-${index}`; pick.setAttribute('aria-pressed', selectedUrl === tab.url); pick.append(el('span', tab.title || new URL(tab.url).hostname), el('small', new URL(tab.url).hostname)); row.append(label, pick); $('#tabs').append(row);
    }
    const tab = w.tabs.find(t => t.url === selectedUrl); $('#tab-detail').hidden = !tab;
    if (tab) { $('#detail-title').textContent = tab.title || new URL(tab.url).hostname; $('#detail-url').textContent = tab.url; $('#detail-pin').textContent = tab.pinned ? 'Wird angeheftet geöffnet.' : 'Nicht angeheftet.'; }
  }
  $('#selection-bar').hidden = !checked.size; $('#selection-count').textContent = `${checked.size} ${checked.size === 1 ? 'Tab' : 'Tabs'} ausgewählt`; lock();
  if (focusId && document.activeElement?.id !== focusId) document.getElementById(focusId)?.focus({ preventScroll: true });
}
async function liveWindows() {
  $('#windows').replaceChildren();
  if (!extensionMode) { $('#windows').append(el('p', 'Installiere KelvaniSwift als Erweiterung, um deine offenen Browserfenster zu sehen.', 'empty')); return []; }
  const windows = (await chrome.windows.getAll({ populate: true, windowTypes: ['normal'] })).filter(w => !w.incognito);
  for (const window of windows) {
    const card = el('article', '', 'window-card'), header = el('div', '', 'section-heading'); header.append(el('h3', `Fenster ${window.id}${window.focused ? ' · aktiv' : ''}`), button('Dieses Fenster sichern', () => openCapture(window.id), 'primary'));
    const list = el('ul', '', 'window-tabs');
    for (const tab of window.tabs ?? []) {
      const li = el('li'), target = button(tab.title || tab.url || 'Tab', () => run(async () => { await chrome.tabs.update(tab.id, { active: true }); await chrome.windows.update(window.id, { focused: true }); }), 'text-button'); li.append(target); list.append(li);
    }
    card.append(header, el('p', `${snapshot(window.tabs ?? []).length} unterstützte, unterschiedliche Web-Tabs`, 'muted'), list); $('#windows').append(card);
  }
  if (!windows.length) $('#windows').append(el('p', 'Keine normalen Browserfenster verfügbar.', 'empty'));
  return windows;
}
async function setMode(value) {
  mode = value; $('#saved-view').hidden = mode !== 'saved'; $('#windows-view').hidden = mode !== 'windows';
  for (const key of ['saved', 'windows']) { $(`#view-${key}`).setAttribute('aria-pressed', mode === key); $(`#nav-${key}`).setAttribute('aria-pressed', mode === key); $(`#nav-${key}`).classList.toggle('active', mode === key); }
  $('#filter').disabled = mode === 'windows'; $('#page-title').textContent = mode === 'saved' ? 'Zurück zu deiner Arbeit.' : 'Deine offenen Fenster.'; $('#page-description').textContent = mode === 'saved' ? 'Gespeicherte Arbeitsbereiche. Ein Klick zurück in deinen Kontext.' : 'Aktuell offene Tabs. Sichere ein Fenster, ohne etwas zu schließen.';
  if (mode === 'windows') await liveWindows();
}
async function refreshOptions(preferred = null) {
  const select = $('#window-select'), previous = preferred ?? Number(select.value); select.replaceChildren();
  if (!extensionMode) { select.append(el('option', 'Erweiterung installieren')); return; }
  const windows = (await chrome.windows.getAll({ populate: true, windowTypes: ['normal'] })).filter(w => !w.incognito);
  for (const w of windows) { const count = snapshot(w.tabs ?? []).length, option = el('option', `Fenster ${w.id} · ${count} Web-Tabs${w.focused ? ' · aktiv' : ''}`); option.value = w.id; option.disabled = !count; select.append(option); }
  const preferredOption = [...select.options].find(option => Number(option.value) === previous && !option.disabled) ?? [...select.options].find(option => !option.disabled); if (preferredOption) select.value = preferredOption.value; else { const option = el('option', 'Kein Fenster mit unterstützten Tabs'); option.value = ''; select.append(option); select.value = ''; }
}
async function openCapture(id = null) { await run(async () => { $('#capture-form').reset(); $('#capture-error').textContent = ''; await refreshOptions(id); showDialog('#capture-dialog'); }); }
function displayOpenResult(result) {
  retryResult = result; $('#retry-panel').hidden = !result.failed.length; $('#failures').replaceChildren();
  for (const failure of result.failed) $('#failures').append(el('li', `${failure.tab.title || failure.tab.url}: ${failure.reason}`));
  notify(`${result.opened} Tabs geöffnet.${result.failed.length ? ` ${result.failed.length} fehlgeschlagen.` : ''}${result.pinFailures ? ` ${result.pinFailures} Tabs konnten nicht angeheftet werden.` : ''}`, Boolean(result.failed.length || result.pinFailures));
}
async function openTabs(tabs) { if (!extensionMode) throw new Error('Bitte KelvaniSwift als Browser-Erweiterung installieren.'); displayOpenResult(await openSavedTabs(chrome, tabs, (done, total) => notify(`Öffne Tabs: ${done} von ${total} …`))); }
async function removeTabs(urls) {
  const w = structuredClone(workspace()); if (!w) return;
  await mutate(current => removeSavedTabs(current, w.id, urls, w.tabs)); checked.clear(); render();
  notify('Tabs aus der Sicherung entfernt. Offene Tabs bleiben erhalten.', false, () => run(async () => {
    await mutate(current => { const target = current.workspaces.find(item => item.id === w.id); if (!target) throw new Error('Der Arbeitsbereich wurde entfernt. Bitte ein Backup verwenden.'); const tabs = [...target.tabs]; for (const tab of w.tabs.filter(t => urls.includes(t.url))) if (!tabs.some(t => t.url === tab.url)) tabs.splice(Math.min(w.tabs.indexOf(tab), tabs.length), 0, tab); return { ...current, workspaces: current.workspaces.map(item => item.id === w.id ? { ...item, tabs } : item) }; }); notify('Tabs in der Sicherung wiederhergestellt.');
  }));
}
wireDialogs();
for (const key of ['saved', 'windows']) for (const prefix of ['view', 'nav']) $(`#${prefix}-${key}`).addEventListener('click', () => run(() => setMode(key)));
$('#filter').addEventListener('input', () => { checked.clear(); render(); }); $('#tab-filter').addEventListener('input', render);
$('#capture-trigger').dataset.live = 'true'; $('#refresh').dataset.live = 'true'; $('#capture-submit').dataset.live = 'true'; $('#open-workspace').dataset.live = 'true'; $('#open-tab').dataset.live = 'true'; $('#open-selection').dataset.live = 'true'; $('#retry').dataset.live = 'true';
$('#capture-trigger').addEventListener('click', () => openCapture()); $('#refresh').addEventListener('click', () => run(() => refreshOptions(), '#capture-error')); $('#refresh-windows').addEventListener('click', () => run(liveWindows));
$('#capture-form').addEventListener('submit', event => { event.preventDefault(); const name = $('#workspace-name').value, id = Number($('#window-select').value); run(async () => { const capture = await captureWindow(chrome, id); const nextId = crypto.randomUUID(); await mutate(current => saveWorkspace(current, name, capture.tabs, nextId, new Date().toISOString(), capture.source)); selectedId = nextId; render(); await setMode('saved'); $('#capture-dialog').close(); notify(`Arbeitsbereich gesichert. ${capture.tabs.length} Tabs${capture.omitted ? `; ${capture.omitted} interne, unsichere oder doppelte Tabs ausgelassen` : ''}. Offene Tabs bleiben erhalten.`); }, '#capture-error'); });
$('#open-workspace').addEventListener('click', () => { const tabs = workspace()?.tabs; if (tabs) run(() => openTabs(tabs)); }); $('#open-selection').addEventListener('click', () => { const tabs = workspace()?.tabs.filter(tab => checked.has(tab.url)); if (tabs?.length) run(() => openTabs(tabs)); });
$('#open-tab').addEventListener('click', () => { const tab = workspace()?.tabs.find(t => t.url === selectedUrl); if (tab) run(async () => { await chrome.tabs.create({ url: tab.url, pinned: tab.pinned, active: true }); notify('Tab geöffnet. Die Sicherung bleibt erhalten.'); }); });
$('#clear-selection').addEventListener('click', () => { checked.clear(); render(); }); $('#remove-selection').addEventListener('click', () => run(() => removeTabs([...checked]))); $('#remove-tab').addEventListener('click', () => run(() => removeTabs([selectedUrl])));
$('#retry').addEventListener('click', () => run(async () => { displayOpenResult(await openSavedTabs(chrome, retryResult.failed.map(item => item.tab), (done, total) => notify(`Erneuter Versuch: ${done} von ${total} …`), retryResult.windowId)); }));
$('#manage-workspace').addEventListener('click', () => { $('#rename').value = workspace().name; $('#manage-error').textContent = ''; showDialog('#manage-dialog'); });
$('#rename-form').addEventListener('submit', event => { event.preventDefault(); const id = selectedId, name = $('#rename').value; run(async () => { await mutate(current => { if (!current.workspaces.some(w => w.id === id)) throw new Error('Der Arbeitsbereich wurde zwischenzeitlich entfernt.'); return { ...current, workspaces: current.workspaces.map(w => w.id === id ? { ...w, name } : w) }; }); $('#manage-dialog').close(); notify('Name gespeichert. Der Sicherungszeitpunkt bleibt unverändert.'); }, '#manage-error'); });
$('#remove-workspace').addEventListener('click', () => { const w = structuredClone(workspace()), index = state.workspaces.findIndex(item => item.id === w.id); run(async () => { await mutate(current => ({ ...current, workspaces: current.workspaces.filter(item => item.id !== w.id) })); $('#manage-dialog').close(); notify('Arbeitsbereich entfernt. Offene Tabs bleiben erhalten.', false, () => run(async () => { await mutate(current => { if (current.workspaces.some(item => item.id === w.id)) return current; const workspaces = [...current.workspaces]; workspaces.splice(index, 0, w); return { ...current, workspaces }; }); choose(w.id); notify('Arbeitsbereich wiederhergestellt.'); })); }, '#manage-error'); });
$('#nav-data').addEventListener('click', () => { $('#theme').value = selectedTheme; $('#settings-error').textContent = ''; showDialog('#settings-dialog'); });
$('#theme').addEventListener('change', () => run(async () => { const value = $('#theme').value; if (extensionMode) await chrome.storage.local.set({ 'kelvani-swift.theme': value }); else localStorage.setItem('kelvani-swift.theme', value); selectedTheme = value; applyTheme(); }, '#settings-error'));
$('#export').addEventListener('click', () => run(async () => { download(await load(), 'kelvani-swift-backup.json'); notify('Backup exportiert.'); }, '#settings-error'));
$('#import-trigger').addEventListener('click', () => $('#import').click()); $('#import').addEventListener('change', async event => { const file = event.target.files[0]; event.target.value = ''; if (!file) return; await run(async () => { incoming = await readBackup(file, validateState); const preview = mergeBackup(state, incoming, crypto.randomUUID); $('#import-preview').textContent = `${file.name}: ${incoming.workspaces.length} Bereiche im Backup, ${preview.workspaces.length - state.workspaces.length} neue Bereiche.`; $('#import-error').textContent = ''; showDialog('#import-dialog'); }, '#settings-error'); });
$('#import-confirm').addEventListener('click', () => run(async () => { await mutate(current => mergeBackup(current, incoming, crypto.randomUUID)); $('#import-dialog').close(); $('#settings-dialog').close(); notify('Backup zusammengeführt. Bestehende Arbeitsbereiche bleiben erhalten.'); }, '#import-error'));
$('#demo').hidden = extensionMode;
$('#demo-load').addEventListener('click', () => run(async () => { const date = new Date().toISOString(); const demo = { version: 1, workspaces: [{ id: 'demo-kelvani', name: 'Kelvani entwickeln', updatedAt: date, tabs: [{ title: 'GitHub · KelvaniTab', url: 'https://github.com/schlagskill/kelvani-tab', pinned: false }, { title: 'Chrome Extension Docs', url: 'https://developer.chrome.com/docs/extensions/', pinned: false }, { title: 'MDN · Web Extensions', url: 'https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions', pinned: false }, { title: 'KelvaniSwift · Issues', url: 'https://github.com/schlagskill/kelvani-swift/issues', pinned: false }] }] }; if (state.workspaces.some(w => w.id === 'demo-kelvani')) { choose('demo-kelvani'); return; } await mutate(current => mergeBackup(current, demo, crypto.randomUUID)); choose('demo-kelvani'); notify('Fiktive Beispieldaten für die Browser-Vorschau geladen.'); }));
async function refresh() { if (unavailable) return; try { state = await load(); render(); } catch (error) { notify(error.message, true); } }
if (extensionMode) chrome.storage.onChanged.addListener((changes, area) => { if (area === 'local' && changes['kelvani-swift.v1']) refresh(); }); else window.addEventListener('storage', event => { if (event.key === 'kelvani-swift.v1') refresh(); });
try { state = await load(); selectedTheme = (extensionMode ? (await chrome.storage.local.get('kelvani-swift.theme'))['kelvani-swift.theme'] : localStorage.getItem('kelvani-swift.theme')) ?? 'auto'; if (!['auto', 'sand', 'night'].includes(selectedTheme)) selectedTheme = 'auto'; applyTheme(); render(); } catch (error) { unavailable = true; notify(`Start fehlgeschlagen: ${error.message}. Vorhandene Daten werden nicht überschrieben.`, true); lock(); }
