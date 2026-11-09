/**
 * ui/views/privateModeWidget.js
 * ----------------------------
 * Header 上的隐私模式快捷按钮。
 *
 * 交互：
 *   - 未激活 → 点击弹出 dropdown 选时长（15/30/45/60/120 分钟）
 *   - 已激活 → 按钮变 active 态，显示精确到秒的剩余时间，点击关闭
 *
 * 数据流：
 *   - 首帧：init(state.privateMode)
 *   - 订阅：BCAST_STATE_CHANGE → update(payload.privateMode)
 *   - BCAST_TICK → tickUpdate() 刷新剩余时间
 *
 * 里程碑：M9 → v2.1（P2-22：逻辑收敛到 createHeaderWidget 工厂）。
 */

import { createHeaderWidget } from './headerWidget.js';
import * as messaging from '../messaging.js';

const ICON_SVG = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M8 5v14M16 5v14"/></svg>';

const widget = createHeaderWidget({
  btnId: 'privateModeToggle',
  iconSvg: ICON_SVG,
  text: '暂停记录',
  presets: [15, 30, 45, 60, 120],
  presetLabel: (min) => (min >= 60 ? `${min / 60} 小时` : `${min} 分钟`),
  onStart: (min) => messaging.startPrivateMode(min),
  onStop: () => messaging.stopPrivateMode(),
  createDropdownExtra: () => {
    const note = document.createElement('p');
    note.className = 'headerWidget__note';
    note.textContent = '仅暂停栖页计时记录，浏览器历史仍会保留。';
    return note;
  },
  titleIdle: '选择暂停栖页记录的时长',
  titleActive: '点击恢复栖页记录',
  logName: 'privateModeWidget',
});

export const init = widget.init;
export const update = widget.update;
export const tickUpdate = widget.tickUpdate;
