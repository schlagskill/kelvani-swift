import { EMPTY, validateState } from "./core.js";
import {checkpoint,validHistory,recoveryState} from "./history.js";
const HISTORY_KEY="kelvani-swift.history.v1";
const KEY = "kelvani-swift.v1";
export const extensionMode = Boolean(
  globalThis.chrome?.runtime?.id && globalThis.chrome?.storage?.local,
);
export async function load() {
  const value = extensionMode
    ? (await chrome.storage.local.get(KEY))[KEY]
    : JSON.parse(localStorage.getItem(KEY) || "null");
  return validateState(value ?? structuredClone(EMPTY));
}
export async function update(change) {
  if (!navigator.locks)
    throw new Error(
      "Bitte einen aktuellen Chrome- oder Edge-Browser verwenden.",
    );
  return navigator.locks.request(KEY, async () => {
    const before=await load();
    const state = validateState(await change(structuredClone(before)));
    const history=checkpoint(await loadHistory(),before,state,crypto.randomUUID(),new Date().toISOString());
    if (extensionMode) await chrome.storage.local.set({ [KEY]: state, [HISTORY_KEY]: history });
    else {localStorage.setItem(HISTORY_KEY,JSON.stringify(history));localStorage.setItem(KEY, JSON.stringify(state));}
    return state;
  });
}

export async function loadHistory(){
 const value=extensionMode?(await chrome.storage.local.get(HISTORY_KEY))[HISTORY_KEY]:JSON.parse(localStorage.getItem(HISTORY_KEY)||'null');
 return validHistory(value);
}
export async function restoreCheckpoint(id){return update(async()=>recoveryState(await loadHistory(),id));}
