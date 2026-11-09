import { h } from '../utils/dom.js';
import { settingsErrorMessage } from '../utils/settingsErrors.js';
import * as messaging from '../messaging.js';

function section(title, description) {
  return h('div', { class: 'sp__section' }, [
    h('div', { class: 'sp__sectionHeader' }, [
      h('span', { class: 'sp__sectionTitle' }, [title]),
    ]),
    h('p', { class: 'sp__desc' }, [description]),
  ]);
}

function select(options, value, label) {
  const el = h('select', { class: 'sp__select', 'aria-label': label });
  for (const [optionValue, text] of options) {
    const option = h('option', { value: optionValue }, [text]);
    option.selected = String(optionValue) === String(value);
    el.appendChild(option);
  }
  return el;
}

function report(error, host) {
  console.error('[栖页] settings update failed', error);
  host.textContent = settingsErrorMessage(error);
}

function renderAppearance(config, onConfig) {
  const el = section('外观', '选择浅色、深色，或跟随系统。');
  const theme = select([['system', '跟随系统'], ['light', '浅色'], ['dark', '深色']], config.theme, '主题');
  const status = h('p', { class: 'sp__feedback', role: 'status' });
  theme.addEventListener('change', async () => {
    try { onConfig((await messaging.setTheme(theme.value)).config); }
    catch (err) { report(err, status); }
  });
  el.append(h('label', { class: 'sp__field' }, [
    h('span', { class: 'sp__fieldLabel' }, ['主题']), theme,
  ]), status);
  return el;
}

function renderData(config, onConfig) {
  const el = section('历史数据', '可长期保留，或自动清理指定天数以前的记录。');
  const retention = select([
    ['forever', '永久保留'], ['30', '保留 30 天'], ['90', '保留 90 天'], ['180', '保留 180 天'], ['365', '保留 1 年'],
  ], config.historyRetentionDays ?? 'forever', '历史保留时间');
  const status = h('p', { class: 'sp__feedback', role: 'status' });
  retention.addEventListener('change', async () => {
    const days = retention.value === 'forever' ? null : Number(retention.value);
    try { onConfig((await messaging.setRetention(days)).config); }
    catch (err) { report(err, status); }
  });
  el.append(h('div', { class: 'sp__actionRow' }, [retention]), status);
  return el;
}

function renderFocusHosts(config, onConfig) {
  const el = section('允许访问的网站', '专注计时开启「限制网站访问」后，只允许访问此列表中的网站。每行一个域名；支持 *.example.com，请勿填写完整链接。');
  const area = h('textarea', {
    class: 'sp__textarea', rows: '4', placeholder: 'workspace.feishu.cn\n*.example.com',
    'aria-label': '专注时允许访问的域名', 'aria-describedby': 'focusHostsFeedback',
  });
  area.value = (config.focusAllowedHosts || []).join('\n');
  const status = h('p', { class: 'sp__feedback', role: 'status', id: 'focusHostsFeedback' });
  area.addEventListener('input', () => {
    area.removeAttribute('aria-invalid');
    status.textContent = '';
  });
  const save = h('button', { class: 'sp__btn sp__btn--primary', type: 'button' }, ['保存网站列表']);
  save.addEventListener('click', async () => {
    save.disabled = true;
    try {
      const hosts = area.value.split(/[\n,]+/).map((value) => value.trim()).filter(Boolean);
      onConfig((await messaging.setFocusHosts(hosts)).config);
      (document.getElementById('focusHostsFeedback') || status).textContent = '已保存';
    } catch (err) {
      if (/invalid host/.test(String(err?.message))) area.setAttribute('aria-invalid', 'true');
      report(err, status);
    } finally { save.disabled = false; }
  });
  el.append(area, save, status);
  return el;
}

export function renderAdvancedSettings(config, onConfig) {
  const root = document.createDocumentFragment();
  root.append(
    h('h3', { class: 'sp__groupTitle' }, ['常用设置']),
    renderAppearance(config, onConfig),
    renderData(config, onConfig),
    renderFocusHosts(config, onConfig),
  );
  return root;
}
