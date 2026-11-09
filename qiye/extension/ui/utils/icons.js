import { h } from './dom.js';

const paths = {
  bookmark: '<path d="M6 4h12v17l-6-4-6 4V4Z"/>',
  close: '<path d="m6 6 12 12M18 6 6 18"/>',
  home: '<path d="m3 10 9-7 9 7M5 9v12h14V9M9 21v-8h6v8"/>',
  pause: '<path d="M8 5v14M16 5v14"/>',
  excluded: '<circle cx="12" cy="12" r="9"/><path d="m6 6 12 12"/>',
};

/** Decorative line icons; the surrounding control supplies its accessible name. */
export function icon(name, className = '') {
  const el = h('span', { class: `uiIcon ${className}`.trim(), 'aria-hidden': 'true' });
  el.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${paths[name] || paths.bookmark}</svg>`;
  return el;
}
