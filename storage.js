import { EMPTY, validateState } from './core.js';
const KEY = 'kelvani-swift.v1';
export const extensionMode = Boolean(globalThis.chrome?.runtime?.id && globalThis.chrome?.storage?.local);
export async function load() { const value = extensionMode ? (await chrome.storage.local.get(KEY))[KEY] : JSON.parse(localStorage.getItem(KEY) || 'null'); return validateState(value ?? structuredClone(EMPTY)); }
export async function update(change) {
  if (!navigator.locks) throw new Error('Bitte einen aktuellen Chrome- oder Edge-Browser verwenden.');
  return navigator.locks.request(KEY, async () => { const state = validateState(await change(await load())); if (extensionMode) await chrome.storage.local.set({ [KEY]: state }); else localStorage.setItem(KEY, JSON.stringify(state)); return state; });
}
