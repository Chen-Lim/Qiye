/**
 * Isolated Chrome acceptance test.
 * PLAYWRIGHT_MODULE=/absolute/path/to/playwright/index.mjs node extension/tests/browser-ui.mjs
 * Never uses an existing browser profile. Sample sites are served by request interception.
 */
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const source = fileURLToPath(new URL('../', import.meta.url));
const output = process.env.QIYE_SCREENSHOT_DIR || path.join(tmpdir(), 'qiye-browser-check');
await mkdir(output, { recursive: true });
const errors = [];
let page;
const iconSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"><rect width="24" height="24" rx="5" fill="#875465"/><path d="M6 7h12v10H6zm2 3h8m-8 3h5" fill="none" stroke="#fff" stroke-width="1.5"/></svg>';
const context = await chromium.launchPersistentContext('', {
  channel: 'chrome',
  headless: true,
  viewport: { width: 1440, height: 1000 },
  ignoreDefaultArgs: ['--disable-extensions'],
  args: ['--enable-unsafe-extension-debugging'],
});

try {
  const cdp = await context.browser().newBrowserCDPSession();
  const { id } = await cdp.send('Extensions.loadUnpacked', { path: source.replace(/\/$/, '') });
  const uiUrl = `chrome-extension://${id}/index.html`;
  const siteTitles = [
    ['code', '标签管理与专注记录', '代码与交互实现'],
    ['notes', 'RAG 实践笔记：检索精度与评估', 'Agent 架构设计与工具调用'],
    ['workspace', '产品共创讨论记录', '本周学习计划与反馈'],
    ['docs', 'Web API 文档', 'CSS 布局与字体规范'],
    ['video', '学习视频：理解工具调用', '稍后想看的视频'],
    ['product', '产品方案与验证', '用户访谈记录'],
  ];
  await context.route('http://*.qiye.test/**', async (route) => {
    const url = new URL(route.request().url());
    if (url.pathname === '/favicon.svg') {
      return route.fulfill({ contentType: 'image/svg+xml', body: iconSvg });
    }
    const site = siteTitles.find(([host]) => url.hostname === `${host}.qiye.test`);
    const title = site?.[Number(url.pathname.split('/').pop()) + 1] || '验收用网页';
    await route.fulfill({
      contentType: 'text/html; charset=utf-8',
      body: `<!doctype html><meta charset="utf-8"><title>${title}</title><link rel="icon" href="/favicon.svg"><h1>${title}</h1><p>独立浏览器中的验收示例。</p>`,
    });
  });
  page = await context.newPage();
  page.setDefaultTimeout(10000);
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto(uiUrl);
  await page.evaluate(async () => {
    await chrome.storage.local.set({ __welcomeBannerDismissed: true });
    await chrome.runtime.sendMessage({ type: 'REQ_SET_THEME', theme: 'light' });
  });
  for (const [host] of siteTitles) {
    for (let i = 0; i < 2; i++) {
      const tab = await context.newPage();
      await tab.goto(`http://${host}.qiye.test/page/${i}`);
    }
  }
  await page.reload();
  await page.locator('.tabChip').first().waitFor();
  const waitForCount = async (target, count) => {
    await target.waitForFunction((expected) => {
      const chips = document.querySelectorAll('.tabChip:not(.tabChip--leaving)').length;
      return chips === expected
        && document.querySelector('.header .status')?.textContent.startsWith(`${expected} 个标签页`)
        && document.querySelector('#openTabsSummary')?.textContent.endsWith(`${expected} 个标签页`);
    }, count);
  };
  const ownCard = (target) => target.locator('.domainCard[data-hostname="__qiye"]');
  await waitForCount(page, 13);
  assert.equal(await ownCard(page).locator('.tabChip').count(), 1);
  assert.equal(await page.title(), '栖页');
  const manifest = await page.evaluate(() => chrome.runtime.getManifest());
  assert.equal(manifest.name, '栖页');
  assert.equal(manifest.action.default_title, '栖页');
  assert.equal(await page.locator('#sidebar').isVisible(), false);
  assert.equal(await page.locator('#sidebar').textContent(), '');
  const widthWithoutSaved = await page.locator('.openTabs').evaluate((el) => el.clientWidth);
  await page.screenshot({ path: `${output}/栖页-未保存.png`, fullPage: true });

  const peer = await context.newPage();
  peer.on('pageerror', (error) => errors.push(error.message));
  await peer.goto(uiUrl);
  await peer.locator('.tabChip').first().waitFor();
  await waitForCount(page, 14);
  await waitForCount(peer, 14);
  assert.equal(await ownCard(page).locator('.tabChip').count(), 2);
  assert.equal(await ownCard(page).locator('.domainCard__title').textContent(), '栖页');
  assert.equal(await ownCard(page).locator('.tabChip__save:not([hidden])').count(), 0);
  assert.ok((await ownCard(page).locator('.tabChip__favicon').first().getAttribute('src')).endsWith('/icons/icon48.png'));
  const firstSave = page.locator('.tabChip__save:not([hidden])').first();
  const savedChipId = await firstSave.getAttribute('data-tab-id');
  await firstSave.click();
  await page.locator('.sidebar__entry').first().waitFor();
  await peer.locator('.sidebar__entry').first().waitFor();
  assert.equal(await page.locator('.sidebar__entry').count(), 1, 'first save cannot duplicate');
  assert.ok(await page.locator('.openTabs').evaluate((el) => el.clientWidth) < widthWithoutSaved);
  await page.screenshot({ path: `${output}/栖页-首次保存.png`, fullPage: true });
  const favicon = await page.locator('.sidebar__favicon').getAttribute('src');
  assert.ok(favicon.includes('favicon.svg'), 'saved item uses the original tab favicon');

  await page.locator('.sidebar__check').click();
  await page.waitForFunction(() => document.querySelector('.sidebar__viewedCount')?.textContent === '1');
  await peer.waitForFunction(() => document.querySelector('.sidebar__viewedCount')?.textContent === '1');
  assert.equal(await page.locator('.sidebar__count').textContent(), '0');
  assert.equal(await page.locator('#sidebar').isVisible(), true);
  await page.locator('.sidebar__viewedToggle').click();
  await page.locator('.sidebar__viewedSearch').fill('不存在的词');
  assert.equal(await page.locator('.sidebar__viewedList .sidebar__entry').count(), 0);
  await page.locator('.sidebar__viewedSearch').fill('');
  await page.reload();
  await page.waitForFunction(() => document.querySelector('.sidebar__viewedCount')?.textContent === '1');
  assert.equal(await page.evaluate(async () => (await chrome.storage.local.get('saved')).saved[0].viewed), true);
  await page.locator('.sidebar__viewedToggle').click();
  assert.equal(await page.locator('.sidebar__viewedList .sidebar__check').isChecked(), true);
  await page.locator('.sidebar__viewedList .sidebar__check').click();
  await page.waitForFunction(() => document.querySelector('.sidebar__count')?.textContent === '1');
  await peer.waitForFunction(() => document.querySelector('.sidebar__count')?.textContent === '1');

  // Exercise immediate consecutive changes while responses and broadcasts arrive.
  for (let i = 0; i < 8; i++) {
    await page.locator('.sidebar__check').first().click();
    await page.waitForFunction(() => document.querySelector('.sidebar__count')?.textContent === '0');
    if (!await page.locator('.sidebar__viewed').evaluate((el) => el.open)) {
      await page.locator('.sidebar__viewedToggle').click();
    }
    await page.locator('.sidebar__viewedList .sidebar__check').click();
    await page.waitForFunction(() => document.querySelector('.sidebar__count')?.textContent === '1');
  }

  // Two lists and search/disclosure state survive broadcasts from another page.
  await page.locator(`.tabChip:not([data-tab-id="${savedChipId}"]) .tabChip__save:not([hidden])`).first().click();
  await page.waitForFunction(() => document.querySelector('.sidebar__count')?.textContent === '2');
  await page.locator('.sidebar__check').first().click();
  await page.waitForFunction(() => document.querySelector('.sidebar__count')?.textContent === '1');
  await page.locator('.sidebar__search').first().fill('记录');
  await page.locator('.sidebar__sort').selectOption('oldest');
  const open = await page.locator('.sidebar__viewed').evaluate((el) => el.open);
  if (!open) await page.locator('.sidebar__viewedToggle').click();
  await peer.locator('.tabChip__save:not(:disabled):not([hidden])').first().click();
  await page.waitForFunction(() => document.querySelector('.sidebar__count')?.textContent === '2');
  assert.equal(await page.locator('.sidebar__search').first().inputValue(), '记录');
  assert.equal(await page.locator('.sidebar__sort').inputValue(), 'oldest');
  assert.equal(await page.locator('.sidebar__viewed').evaluate((el) => el.open), true);
  await page.locator('.sidebar__search').first().fill('');
  await page.screenshot({ path: `${output}/栖页-保存与已查看.png`, fullPage: true });

  await page.locator('#settingsToggle').click();
  assert.equal(await page.getByText('分类与分组', { exact: true }).count(), 0);
  assert.equal(await page.getByRole('combobox', { name: '分组方式' }).count(), 0);
  await page.screenshot({ path: `${output}/栖页-精简设置.png`, fullPage: true });
  await page.locator('#settingsToggle').click();
  await page.evaluate(() => chrome.runtime.sendMessage({ type: 'REQ_SET_THEME', theme: 'dark' }));
  await page.waitForFunction(() => document.documentElement.dataset.theme === 'dark');
  await page.screenshot({ path: `${output}/栖页-深色.png`, fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, 'mobile page must not overflow');
  await page.screenshot({ path: `${output}/栖页-手机布局.png`, fullPage: true });
  await page.setViewportSize({ width: 1440, height: 1000 });

  // Removing all records from one page hides the sidebar everywhere.
  await page.evaluate(async () => {
    const response = await chrome.runtime.sendMessage({ type: 'REQ_GET_SAVED' });
    for (const entry of response.data.saved) {
      await chrome.runtime.sendMessage({ type: 'REQ_REMOVE_SAVED', id: entry.id });
    }
  });
  await page.waitForFunction(() => document.querySelector('#sidebar').hidden);
  await peer.waitForFunction(() => document.querySelector('#sidebar').hidden);
  assert.equal(await page.locator('#sidebar').textContent(), '');
  assert.equal(await page.locator('.openTabs').evaluate((el) => el.clientWidth), widthWithoutSaved);
  const newTab = await context.newPage();
  newTab.on('pageerror', (error) => errors.push(error.message));
  await newTab.goto('chrome://newtab/');
  await newTab.locator('.brand').waitFor();
  assert.equal(await newTab.locator('.brand').textContent(), '栖页');
  assert.equal(await newTab.evaluate(() => chrome.runtime.getManifest().name), '栖页');
  await waitForCount(page, 15);
  await waitForCount(peer, 15);
  await waitForCount(newTab, 15);
  assert.equal(await ownCard(page).locator('.tabChip').count(), 3, 'direct and new-tab URLs share a group');
  await newTab.screenshot({ path: `${output}/栖页-新标签页验收.png`, fullPage: true });

  // Activate an existing own tab without creating another one.
  const peerId = await peer.evaluate(async () => (await chrome.tabs.getCurrent()).id);
  const newTabId = await newTab.evaluate(async () => (await chrome.tabs.getCurrent()).id);
  const pagesBeforeActivate = context.pages().length;
  await ownCard(page).locator(`.tabChip[data-tab-id="${peerId}"] .tabChip__title`).click();
  await page.waitForFunction(async (expected) => (await chrome.tabs.query({ active: true, currentWindow: true }))[0]?.id === expected, peerId);
  assert.equal(context.pages().length, pagesBeforeActivate);
  await waitForCount(page, 15);

  // Closing one own tab updates the other pages immediately.
  await ownCard(page).locator(`.tabChip[data-tab-id="${newTabId}"] .tabChip__close`).click();
  await waitForCount(page, 14);
  await waitForCount(peer, 14);
  assert.equal(await page.evaluate(async (tabId) => (await chrome.tabs.query({})).some(tab => tab.id === tabId), newTabId), false);
  const duplicate = await context.newPage();
  duplicate.on('pageerror', (error) => errors.push(error.message));
  await duplicate.goto('chrome://newtab/');
  await waitForCount(page, 15);
  await duplicate.locator('.brand').waitFor();
  let duplicatePrompt;
  page.once('dialog', async (dialog) => {
    duplicatePrompt = dialog.message();
    await dialog.accept();
  });
  await ownCard(page).locator('.domainCard__closeDupes').click();
  await waitForCount(page, 13);
  assert.match(duplicatePrompt, /关闭 2 个重复标签页/);
  assert.equal(await ownCard(page).locator('.tabChip').count(), 1);
  assert.equal(await ownCard(page).locator('.domainCard__closeDupes').isVisible(), false);

  // A live tab moves in/out of the group as its URL changes.
  const navigation = await context.newPage();
  navigation.on('pageerror', (error) => errors.push(error.message));
  await navigation.goto('chrome://newtab/');
  await waitForCount(page, 14);
  await navigation.goto('http://code.qiye.test/navigation/0');
  await waitForCount(page, 14);
  assert.equal(await ownCard(page).locator('.tabChip').count(), 1);
  await navigation.goto('chrome://settings/');
  await waitForCount(page, 13);
  await navigation.goto('chrome://newtab/');
  await waitForCount(page, 14);
  await page.reload();
  await waitForCount(page, 14);
  await waitForCount(navigation, 14);
  assert.equal(await ownCard(page).locator('.tabChip').count(), 2);
  await page.evaluate(() => chrome.runtime.sendMessage({ type: 'REQ_SET_THEME', theme: 'light' }));
  await page.waitForFunction(() => document.documentElement.dataset.theme === 'light');
  await page.screenshot({ path: `${output}/栖页-自身标签页.png`, fullPage: true });
  const ownTabsEvidence = await page.evaluate(async () => ({
    ownTabs: (await chrome.tabs.query({})).filter(tab => tab.url === 'chrome://newtab/' || tab.url === chrome.runtime.getURL('index.html')).map(tab => ({ id: tab.id, url: tab.url })),
    visibleTabs: document.querySelectorAll('.tabChip').length,
    header: document.querySelector('.header .status').textContent,
    summary: document.querySelector('#openTabsSummary').textContent,
  }));

  // Canceling close-all retains the tabs; accepting it closes every own tab.
  page.once('dialog', async (dialog) => {
    assert.match(dialog.message(), /关闭 栖页 下的 2 个标签页/);
    await dialog.dismiss();
  });
  await ownCard(page).locator('.domainCard__closeAll').click();
  await waitForCount(page, 14);
  page.once('dialog', dialog => dialog.accept());
  const pageClosed = page.waitForEvent('close');
  const navigationClosed = navigation.waitForEvent('close');
  await ownCard(page).locator('.domainCard__closeAll').click();
  await pageClosed;
  await navigationClosed;
  assert.equal(context.pages().filter(tab => tab.url().startsWith(uiUrl) || tab.url() === 'chrome://newtab/').length, 0);
  assert.deepEqual(errors, [], 'no page errors during acceptance');
  assert.match(await readFile(`${source}/../LICENSE`, 'utf8'), /^MIT License/);
  const result = {
    passed: true, manifest: { name: manifest.name, version: manifest.version },
    browserVersion: context.browser().version(),
    sampleTabs: 12, ownTabsEvidence,
    checks: ['empty/first-save', 'original favicon', 'viewed/restore', 'refresh persistence', 'multi-page sync', 'search/sort preservation', 'settings removed', 'dark/mobile', 'last-delete', 'new-tab override', 'own tab counts/list', 'own tab activation', 'own tab single close', 'own duplicates across URL forms', 'URL changes/internal exclusion', 'own group close-all', 'root license present'],
    screenshots: ['未保存', '首次保存', '保存与已查看', '精简设置', '深色', '手机布局', '新标签页验收', '自身标签页'].map((state) => `${output}/栖页-${state}.png`),
    pageErrors: errors,
  };
  await writeFile(path.join(output, 'result.json'), JSON.stringify(result, null, 2));
  console.log(JSON.stringify(result, null, 2));
} catch (error) {
  const failure = { passed: false, error: error.stack || String(error), pageErrors: errors };
  if (page && !page.isClosed()) {
    try {
      await page.screenshot({ path: path.join(output, 'failure.png'), fullPage: true, timeout: 5000 });
      failure.page = await page.evaluate(() => ({
        url: location.href,
        count: document.querySelector('.sidebar__count')?.textContent,
        entries: [...document.querySelectorAll('.sidebar__entry')].map(el => ({
          id: el.dataset.entryId, checked: el.querySelector('input')?.checked,
          viewed: !!el.closest('.sidebar__viewedList'), text: el.textContent,
        })),
        feedback: document.querySelector('.sidebar__feedback')?.textContent,
      }));
    } catch (diagnosticError) {
      failure.diagnosticError = String(diagnosticError);
    }
  }
  await writeFile(path.join(output, 'result.json'), JSON.stringify(failure, null, 2))
    .catch(diagnosticError => console.error('Could not save failure diagnostics:', diagnosticError));
  console.error(JSON.stringify(failure, null, 2));
  throw error;
} finally {
  await context.close();
}
