/**
 * ui/components/domainCard.js
 * ----------------------------
 * 域名卡片：一个 hostname 下的所有 tab，作为一张卡展示。
 *
 * 结构：
 *   <article class="domainCard" data-hostname="example.com">
 *     <header class="domainCard__head">
 *       <img class="domainCard__favicon" />
 *       <h3 class="domainCard__title">example.com (3)</h3>
 *       <button data-action="close-all">关闭全部</button>
 *     </header>
 *     <div class="domainCard__chips"> ...tabChip[] ... </div>
 *   </article>
 *
 * 里程碑：M2。
 */

import { h } from '../utils/dom.js';
import { create as createChip } from './tabChip.js';
import { formatDurationCompact } from '../utils/formatDuration.js';
import { FAVICON_FALLBACK } from '../../shared/constants.js';
import { getGroupLabel, getTabFavicon } from '../utils/domain.js';

/**
 * @param {string} hostname
 * @param {Array} tabs
 * @returns {HTMLElement}
 */
export function create(hostname, tabs) {
  const label = getGroupLabel(hostname);
  const chipsWrap = h('div', { class: 'domainCard__chips' });
  for (const t of tabs) chipsWrap.appendChild(createChip(t));

  const identity = h('div', { class: 'domainCard__identity' }, [
    h('img', {
      class: 'domainCard__favicon',
      src: tabs.map(getTabFavicon).find(Boolean) || FAVICON_FALLBACK,
      alt: '',
      onerror: (e) => { e.target.src = FAVICON_FALLBACK; },
    }),
    h('h3', { class: 'domainCard__title', title: label }, [label]),
    h('span', { class: 'domainCard__count' }, [`(${tabs.length})`]),
  ]);
  const actions = h('div', { class: 'domainCard__actions' }, [
    h('button', {
      class: 'domainCard__closeDupes',
      'data-action': 'close-duplicates',
      'data-hostname': hostname,
      title: '关闭当前卡片中的重复标签页，每个网址保留一个',
      'aria-label': `关闭 ${label} 下的重复标签页，每个网址保留一个`,
      hidden: '',
    }, ['关闭重复']),
    h('button', {
      class: 'domainCard__closeAll',
      'data-action': 'close-all',
      'data-hostname': hostname,
      'aria-label': `关闭 ${label} 下的全部标签页`,
      title: '关闭当前卡片中的全部标签页',
    }, ['关闭全部']),
  ]);
  const head = h('header', { class: 'domainCard__head' }, [
    identity,
    h('span', { class: 'domainCard__time', hidden: '' }),
    h('span', { class: 'domainCard__budget', hidden: '' }),
  ]);

  return h('article', {
    class: 'domainCard',
    'data-hostname': hostname,
  }, [head, chipsWrap, actions]);
}

/**
 * 更新域名卡上的聚合时长。
 * @param {HTMLElement} cardEl .domainCard 根
 * @param {number} ms 该域名所有 open tab 的累计总毫秒
 */
export function updateTime(cardEl, ms) {
  if (!cardEl) return;
  const timeEl = cardEl.querySelector('.domainCard__time');
  if (!timeEl) return;
  if (typeof ms !== 'number' || !Number.isFinite(ms) || ms < 60000) {
    if (!timeEl.hidden) timeEl.hidden = true;
    return;
  }
  const text = formatDurationCompact(ms);
  if (timeEl.hidden) timeEl.hidden = false;
  if (timeEl.textContent !== text) timeEl.textContent = text;
}

/**
 * 更新域名卡上"关闭重复"按钮的可见性和文案。
 * @param {HTMLElement} cardEl .domainCard 根
 * @param {number} dupeCount 该卡中重复的 tab 数（将被关闭的数量）
 */
export function updateBudget(cardEl, usedMs, budgetMs, status) {
  const el = cardEl?.querySelector('.domainCard__budget');
  if (!el) return;
  if (!budgetMs) { el.hidden = true; return; }
  el.hidden = false;
  el.className = `domainCard__budget groupingBudget groupingBudget--${status}`;
  el.textContent = `${formatDurationCompact(usedMs)} / ${formatDurationCompact(budgetMs)}`;
}

export function updateDupeButton(cardEl, dupeCount) {
  if (!cardEl) return;
  const btn = cardEl.querySelector('.domainCard__closeDupes');
  if (!btn) return;
  if (typeof dupeCount !== 'number' || dupeCount < 1) {
    if (!btn.hidden) btn.hidden = true;
    return;
  }
  if (btn.hidden) btn.hidden = false;
  const text = '关闭重复';
  if (btn.textContent !== text) btn.textContent = text;
}
