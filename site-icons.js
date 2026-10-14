import { safeUrl } from './core.js';

// Use the browser's favicon cache. Never send a saved URL to an icon service.
export function faviconUrl(pageUrl, runtime) {
  if (!runtime?.id || typeof runtime.getURL !== 'function') return null;
  try {
    const page = new URL(safeUrl(pageUrl));
    page.hash = '';
    const result = new URL(runtime.getURL('_favicon/'));
    result.searchParams.set('pageUrl', page.href);
    result.searchParams.set('size', '32');
    return result.href;
  } catch { return null; }
}

export function siteIcon(pageUrl, runtime, doc = document) {
  const holder = doc.createElement('span');
  holder.className = 'tab-icon';
  holder.setAttribute('aria-hidden', 'true');
  const fallback = doc.createElement('span');
  try { fallback.textContent = new URL(pageUrl).hostname.replace(/^www\./, '').slice(0, 1).toUpperCase(); }
  catch { fallback.textContent = '↗'; }
  holder.append(fallback);
  const source = faviconUrl(pageUrl, runtime);
  if (source) {
    const image = doc.createElement('img');
    image.alt = ''; image.width = 20; image.height = 20;
    image.hidden = true;
    image.addEventListener('load', () => { fallback.hidden = true; image.hidden = false; }, { once: true });
    image.addEventListener('error', () => { image.remove(); fallback.hidden = false; }, { once: true });
    image.src = source;
    holder.append(image);
  }
  return holder;
}
