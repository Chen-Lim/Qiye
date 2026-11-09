/** Saved webpages: pending list and a collapsible, searchable viewed list. */
import { h } from '../utils/dom.js';
import { icon } from '../utils/icons.js';
import { FAVICON_FALLBACK } from '../../shared/constants.js';
import * as messaging from '../messaging.js';

let rootEl = null;
let listEl = null;
let viewedListEl = null;
let viewedSection = null;
let feedbackEl = null;
let savedEntries = [];
let searchQuery = '';
let viewedQuery = '';
let sortMode = 'newest';
let viewedOpen = false;
let onRemovedCallback = null;

export function init(el, savedList = [], options = {}) {
  return render(el, savedList, options);
}

/** Broadcasts update lists while keeping searches, sort order and disclosure state. */
export function render(el, savedList = [], options = {}) {
  const sameRoot = rootEl === el;
  if (!sameRoot) {
    searchQuery = viewedQuery = '';
    sortMode = 'newest';
    viewedOpen = false;
    listEl = null;
  }
  rootEl = el;
  if (!rootEl) return;
  const config = Array.isArray(savedList) ? options : savedList;
  onRemovedCallback = typeof config === 'function' ? config : config?.onRemoved;
  const next = (Array.isArray(savedList) ? savedList : []).map((entry) => ({ ...entry }));
  if (sameRoot && sameEntries(savedEntries, next)) return;
  savedEntries = next;
  renderLists();
}

/** Upsert by ID to tolerate a broadcast arriving before the save response. */
export function add(entry) {
  if (!rootEl || !entry?.id) return;
  const existing = savedEntries.find((item) => item.id === entry.id);
  if (existing && sameEntry(existing, entry)) return;
  savedEntries = [{ ...entry }, ...savedEntries.filter((item) => item.id !== entry.id)];
  renderLists();
}

function sameEntry(a, b) {
  return ['id', 'url', 'title', 'favIconUrl', 'savedAt'].every((key) => a[key] === b[key])
    && (a.viewed === true) === (b.viewed === true);
}

function sameEntries(a, b) {
  if (a.length !== b.length) return false;
  const byId = new Map(b.map((entry) => [entry.id, entry]));
  return a.every((entry) => byId.has(entry.id) && sameEntry(entry, byId.get(entry.id)));
}

export function remove(id) {
  const next = savedEntries.filter((entry) => entry.id !== id);
  if (next.length === savedEntries.length) return false;
  savedEntries = next;
  renderLists();
  return true;
}

function createShell() {
  rootEl.textContent = '';
  rootEl.classList.add('sidebar--active');
  rootEl.setAttribute('aria-labelledby', 'savedPagesTitle');
  rootEl.appendChild(h('div', { class: 'sidebar__header sectionHeading' }, [
    h('h2', { class: 'sidebar__title', id: 'savedPagesTitle' }, ['稍后查看']),
    h('span', { class: 'sectionHeading__rule', 'aria-hidden': 'true' }),
    h('span', { class: 'sidebar__count' }),
  ]));
  rootEl.appendChild(createControls());
  listEl = h('div', { class: 'sidebar__list' });
  rootEl.appendChild(listEl);

  const viewedSearch = h('input', {
    class: 'sidebar__search sidebar__viewedSearch', type: 'search',
    placeholder: '搜索已查看网页', 'aria-label': '搜索已查看网页',
  });
  viewedSearch.value = viewedQuery;
  viewedSearch.addEventListener('input', () => {
    viewedQuery = String(viewedSearch.value || '').trim().toLocaleLowerCase();
    renderLists();
  });
  viewedListEl = h('div', { class: 'sidebar__list sidebar__viewedList' });
  viewedSection = h('details', { class: 'sidebar__viewed' }, [
    h('summary', { class: 'sidebar__viewedToggle' }, [
      '已查看', h('span', { class: 'sidebar__viewedCount' }),
    ]),
    h('div', { class: 'sidebar__viewedBody' }, [viewedSearch, viewedListEl]),
  ]);
  viewedSection.open = viewedOpen;
  const disclosure = viewedSection;
  disclosure.addEventListener('toggle', () => {
    if (viewedSection === disclosure) viewedOpen = disclosure.open;
  });
  feedbackEl = h('p', { class: 'sidebar__feedback', role: 'alert' });
  rootEl.appendChild(viewedSection);
  rootEl.appendChild(feedbackEl);
}

function createControls() {
  const search = h('input', {
    class: 'sidebar__search', type: 'search',
    placeholder: '搜索标题或网址', 'aria-label': '搜索稍后查看',
  });
  search.value = searchQuery;
  search.addEventListener('input', () => {
    searchQuery = String(search.value || '').trim().toLocaleLowerCase();
    renderLists();
  });
  const sort = h('select', { class: 'sidebar__sort', 'aria-label': '排序稍后查看' }, [
    h('option', { value: 'newest' }, ['最新保存']),
    h('option', { value: 'oldest' }, ['最早保存']),
    h('option', { value: 'title' }, ['按标题']),
  ]);
  sort.value = sortMode;
  sort.addEventListener('change', () => {
    sortMode = ['newest', 'oldest', 'title'].includes(sort.value) ? sort.value : 'newest';
    renderLists();
  });
  return h('div', { class: 'sidebar__controls' }, [search, sort]);
}

function visibleEntries(entries, query) {
  return entries.filter((entry) => !query ||
    `${entry.title || ''} ${entry.url || ''}`.toLocaleLowerCase().includes(query))
    .sort((a, b) => {
      if (sortMode === 'title') {
        return String(a.title || a.url || '').localeCompare(String(b.title || b.url || ''), undefined, { sensitivity: 'base' });
      }
      const delta = Number(b.savedAt || 0) - Number(a.savedAt || 0);
      return sortMode === 'oldest' ? -delta : delta;
    });
}

function renderLists() {
  if (!rootEl) return;
  const present = savedEntries.length > 0;
  rootEl.hidden = !present;
  rootEl.closest?.('#main')?.classList.toggle('has-saved', present);
  if (!present) {
    rootEl.textContent = '';
    listEl = viewedListEl = viewedSection = feedbackEl = null;
    return;
  }
  if (!listEl) createShell();
  const pending = savedEntries.filter((entry) => entry.viewed !== true);
  const viewed = savedEntries.filter((entry) => entry.viewed === true);
  rootEl.querySelector('.sidebar__count').textContent = String(pending.length);
  rootEl.querySelector('.sidebar__viewedCount').textContent = String(viewed.length);
  viewedSection.hidden = viewed.length === 0;
  fillList(listEl, pending, searchQuery, '全部网页已查看');
  fillList(viewedListEl, viewed, viewedQuery, '暂无已查看网页');
}

function fillList(el, entries, query, emptyMessage) {
  el.textContent = '';
  const visible = visibleEntries(entries, query);
  for (const entry of visible) el.appendChild(createEntryEl(entry));
  if (!visible.length) el.appendChild(h('p', { class: 'sidebar__empty' }, [
    entries.length ? '没有匹配的标签' : emptyMessage,
  ]));
}

function reportError(error) {
  console.error('[栖页] saved page update failed', error);
  if (feedbackEl) feedbackEl.textContent = '操作失败，请重试。';
}

function createEntryEl(entry) {
  const viewed = entry.viewed === true;
  const checkbox = h('input', {
    class: 'sidebar__check', type: 'checkbox',
    'aria-label': viewed ? `恢复到稍后查看：${entry.title || entry.url}` : `标记为已查看：${entry.title || entry.url}`,
    title: viewed ? '取消勾选，恢复到稍后查看' : '勾选移入已查看',
  });
  checkbox.checked = viewed;
  checkbox.addEventListener('change', async () => {
    const nextViewed = checkbox.checked;
    checkbox.disabled = true;
    try {
      const { entry: updated } = await messaging.setSavedViewed(entry.id, nextViewed);
      add(updated);
      if (feedbackEl) feedbackEl.textContent = '';
    } catch (err) {
      checkbox.checked = viewed;
      checkbox.disabled = false;
      reportError(err);
    }
  });
  const favicon = h('img', {
    class: 'sidebar__favicon', src: entry.favIconUrl || FAVICON_FALLBACK, alt: '',
    onerror: (event) => {
      if (event.target.src !== FAVICON_FALLBACK) event.target.src = FAVICON_FALLBACK;
    },
  });
  const title = h('a', {
    class: 'sidebar__entryTitle', href: entry.url, title: entry.title || entry.url,
  }, [entry.title || entry.url || '未命名网页']);
  title.addEventListener('click', async (event) => {
    event.preventDefault();
    try { await chrome.tabs.create({ url: entry.url, active: false }); }
    catch (err) { reportError(err); }
  });
  const removeBtn = h('button', {
    class: 'sidebar__entryRemove', type: 'button', title: '删除', 'aria-label': '删除',
  }, [icon('close')]);
  removeBtn.addEventListener('click', async () => {
    removeBtn.disabled = true;
    try {
      await messaging.removeSaved(entry.id);
      remove(entry.id);
      await onRemovedCallback?.(entry.id);
    } catch (err) {
      removeBtn.disabled = false;
      reportError(err);
    }
  });
  const date = new Date(entry.savedAt);
  const time = Number.isFinite(date.getTime())
    ? `${date.getMonth() + 1}/${date.getDate()} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
    : '';
  let hostname = '';
  try { hostname = new URL(entry.url).hostname; } catch { /* Legacy entry. */ }
  return h('div', { class: 'sidebar__entry', 'data-entry-id': entry.id }, [
    checkbox, favicon,
    h('div', { class: 'sidebar__entryBody' }, [
      title,
      h('div', { class: 'sidebar__entryMeta' }, [
        h('span', { class: 'sidebar__entryDomain', title: hostname }, [hostname]),
        h('span', { class: 'sidebar__entryTime', title: `保存于 ${time}` }, [time]),
      ]),
    ]),
    removeBtn,
  ]);
}
