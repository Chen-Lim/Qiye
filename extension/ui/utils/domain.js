/**
 * ui/utils/domain.js
 * -------------------
 * URL → hostname 分组规则。
 *
 * 职责：
 *   - getHostname(url)  提取 hostname（含 localhost:port 保留端口）
 *   - isHomepage(url)   是否属于 HOMEPAGE_HOSTS 且是根/首页路径
 *   - groupByDomain(tabs) 按 hostname 分组，额外显示栖页自身
 *
 * 里程碑：M2。
 */

import { HOMEPAGE_HOSTS } from '../../shared/constants.js';
import { getHostname } from '../../shared/hostname.js';

// 保持 ui/utils/domain.js 的对外 re-export，其他 UI 模块继续从这里 import
export { getHostname };

export const WORKBENCH_GROUP = '__qiye';

/**
 * Chrome 新标签页和当前扩展的主页面都属于栖页。
 * 只在 UI 放开这两种地址，共享的计时和网页保存规则保持独立。
 */
export function isWorkbenchUrl(url, workbenchUrl = globalThis.chrome?.runtime?.getURL?.('index.html')) {
  let parsed;
  try { parsed = new URL(url); } catch { return false; }
  if (parsed.protocol === 'chrome:' && parsed.hostname === 'newtab') {
    return parsed.pathname === '/' || parsed.pathname === '';
  }
  if (parsed.protocol !== 'chrome-extension:' || !workbenchUrl) return false;
  let ownPage;
  try { ownPage = new URL(workbenchUrl); } catch { return false; }
  return ownPage.protocol === parsed.protocol
    && ownPage.hostname === parsed.hostname
    && ownPage.pathname === parsed.pathname;
}

export function getTabGroupKey(url) {
  return isWorkbenchUrl(url) ? WORKBENCH_GROUP : getHostname(url);
}

export function getGroupLabel(key) {
  return key === WORKBENCH_GROUP ? '栖页' : key;
}

export function getTabFavicon(tab) {
  return isWorkbenchUrl(tab.url)
    ? (globalThis.chrome?.runtime?.getURL?.('icons/icon48.png') || 'icons/icon48.png')
    : tab.favIconUrl;
}

/**
 * 根路径判定：HOMEPAGE_HOSTS 的成员 且 path 是 "/" / "" / 常见首页路径。
 * @param {string} url
 */
export function isHomepage(url) {
  const host = getHostname(url);
  if (!host) return false;
  // www.x.com / x.com 已被 getHostname 归一化
  const matched = HOMEPAGE_HOSTS.some((h) => host === h || host.endsWith('.' + h));
  if (!matched) return false;
  let u;
  try { u = new URL(url); } catch { return false; }
  const p = u.pathname || '/';
  // 常见首页路径：/、/home、/feed（X、LinkedIn）、/mail/u/0/ 的根（Gmail）
  if (p === '/' || p === '') return true;
  if (p === '/home' || p === '/feed') return true;
  if (host.includes('mail.google.com') && /^\/mail\/u\/\d+\/?$/.test(p)) return true;
  return false;
}

/**
 * 把 tab 数组按 hostname 分组。
 *   - Homepages 进独立的 "__homepages" 桶
 *   - 栖页主页面和 Chrome 新标签页进入 "__qiye" 桶，其他浏览器内部页仍过滤
 *
 * 返回结构：
 *   {
 *     homepages: TabInfo[],                   // 平铺一串（UI 自己聚合成一张卡）
 *     groups: Array<{hostname, tabs: TabInfo[]}>  // 按 tabs.length desc 排序
 *   }
 *
 * @param {Array<{id:number,url:string,title:string,favIconUrl?:string,windowId:number}>} tabs
 */
export function groupByDomain(tabs) {
  const homepages = [];
  /** @type {Map<string, any[]>} */
  const byHost = new Map();

  for (const t of tabs || []) {
    if (!t || !t.url) continue;
    const host = getTabGroupKey(t.url);
    if (!host) continue;
    if (isHomepage(t.url)) {
      homepages.push(t);
      continue;
    }
    if (!byHost.has(host)) byHost.set(host, []);
    byHost.get(host).push(t);
  }

  const groups = Array.from(byHost.entries())
    .map(([hostname, tabs]) => ({ hostname, tabs }))
    .sort((a, b) => b.tabs.length - a.tabs.length || a.hostname.localeCompare(b.hostname));

  return { homepages, groups };
}
