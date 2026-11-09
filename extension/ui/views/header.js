/**
 * ui/views/header.js
 * -------------------
 * "今日工作"时长 + pauseReasons / privateMode / focusTimer 状态指示。
 *
 * 数据流：
 *   - 首帧：main.js 调 render(initial) 把 todayMs + isActive 塞进来
 *   - 订阅：main.js 订阅 BCAST_TICK（1s 一次），调 updateTodayMs(ms, isActive)
 *   - 订阅：main.js 订阅 BCAST_STATE_CHANGE，调 updateStateBadges(state)
 *
 * "今日工作"以 HH:mm:ss 显示累计时长，直接使用 SW 每秒推送的数字。
 *   本 view 不做本地插值，暂停时也不会自行增加时间。
 *   这是 v1.3.5 教训：UI 不要做"影子时钟"，影子时钟和 SW 的真相会漂移。
 *
 * 里程碑：M5。
 */

import { $ } from '../utils/dom.js';

/** @type {HTMLElement|null} */
let valueEl = null;
/** @type {HTMLElement|null} */
let dotEl = null;
/** @type {HTMLElement|null} */
let containerEl = null;
/** @type {HTMLElement|null} */
let statusEl = null;

/** 本地缓存，避免无意义 DOM 写入 */
let lastRenderedText = '';
let lastRenderedActive = null;

/** 累计时长的时:分:秒显示；小时不按一天取模。 */
function formatTodayDuration(ms) {
  const seconds = typeof ms === 'number' && Number.isFinite(ms) && ms > 0
    ? Math.floor(ms / 1000)
    : 0;
  return [
    Math.floor(seconds / 3600),
    Math.floor((seconds % 3600) / 60),
    seconds % 60,
  ].map(value => String(value).padStart(2, '0')).join(':');
}

/**
 * 首次渲染。容错：元素不存在就跳过（header 可能被外部定制替换）。
 * @param {{todayMs:number, isActive:boolean}} initial
 */
export function render(initial = {}) {
  containerEl = $('#todayWork');
  valueEl = $('#todayWorkValue');
  dotEl = $('#todayWorkDot');
  statusEl = $('.header .status');

  if (!containerEl || !valueEl) return;

  containerEl.hidden = false;
  updateTodayMs(initial.todayMs ?? 0, !!initial.isActive);
}

/**
 * @param {number} ms 今日累计工作毫秒
 * @param {boolean} [isActive] 是否正在计时（SW 的 tracking.isActive）。undefined 时不改圆点状态
 */
export function updateTodayMs(ms, isActive) {
  if (!valueEl) return;
  const text = formatTodayDuration(ms);
  if (text !== lastRenderedText) {
    valueEl.textContent = text;
    lastRenderedText = text;
  }
  if (typeof isActive === 'boolean' && dotEl && isActive !== lastRenderedActive) {
    dotEl.classList.toggle('is-active', isActive);
    lastRenderedActive = isActive;
  }
}

/**
 * pauseReasons / privateMode / focusTimer 变化。
 * M5 只用 pauseReasons 控制 dot；privateMode/focusTimer 在 M8 接。
 * @param {{pauseReasons?: string[], tracking?: {isActive?: boolean}}} state
 */
export function updateStateBadges(state) {
  if (!dotEl) return;
  const isActive = !!state?.tracking?.isActive;
  if (isActive !== lastRenderedActive) {
    dotEl.classList.toggle('is-active', isActive);
    lastRenderedActive = isActive;
  }
}

/**
 * 更新产品名旁的 status（tabs 数 + 暂停原因）。
 * 单独暴露给 main.js 用，避免 main.js 自己操 DOM。
 */
export function updateStatus(tabCount, pauseReasons = []) {
  if (!statusEl) statusEl = $('.header .status');
  if (!statusEl) return;
  const reasons = pauseReasons.length > 0 ? ` · ⏸ ${pauseReasons.join(',')}` : '';
  statusEl.textContent = `${tabCount} 个标签页${reasons}`;
}
