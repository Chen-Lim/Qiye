import { suite, test, assert } from './testUtil.js';
import { getHostname, normalizeUrl } from '../shared/hostname.js';
import { isWorkbenchUrl, getTabGroupKey, groupByDomain, WORKBENCH_GROUP } from '../ui/utils/domain.js';
import { getDuplicateTabIds } from '../ui/views/tabsGridDuplicates.js';

const ownUrl = 'chrome-extension://qiye-test/index.html';

function withOwnRuntime(fn) {
  const previous = globalThis.chrome;
  globalThis.chrome = { runtime: { getURL: (path) => `chrome-extension://qiye-test/${path}` } };
  try { fn(); } finally { globalThis.chrome = previous; }
}

suite('Workbench tab visibility', () => {
  test('recognizes own index page, including query/hash, and Chrome new tab', () => {
    assert.ok(isWorkbenchUrl(ownUrl, ownUrl));
    assert.ok(isWorkbenchUrl(`${ownUrl}?from=newtab#saved`, ownUrl));
    assert.ok(isWorkbenchUrl('chrome://newtab/', ownUrl));
    assert.ok(isWorkbenchUrl('chrome://newtab', ownUrl));
  });

  test('excludes other extensions, internal pages and invalid URLs', () => {
    for (const url of [
      'chrome-extension://other/index.html',
      'chrome-extension://qiye-test/blocked.html',
      'chrome://newtab/other', 'chrome://settings/', 'about:blank', 'invalid',
    ]) assert.equal(isWorkbenchUrl(url, ownUrl), false, url);
    assert.equal(isWorkbenchUrl(ownUrl, ''), false);
  });

  test('keeps own pages out of shared website timing and saved URL normalization', () => {
    for (const url of [ownUrl, 'chrome://newtab/']) {
      assert.equal(getHostname(url), '');
      assert.equal(normalizeUrl(url), '');
    }
  });

  test('groups all own tabs together while retaining ordinary domains', () => withOwnRuntime(() => {
    const tabs = [
      { id: 1, url: ownUrl }, { id: 2, url: 'chrome://newtab/' },
      { id: 3, url: `${ownUrl}#saved` }, { id: 4, url: 'https://example.com/a' },
      { id: 5, url: 'chrome://settings/' }, { id: 6, url: 'chrome-extension://other/index.html' },
    ];
    assert.equal(getTabGroupKey(ownUrl), WORKBENCH_GROUP);
    const { groups } = groupByDomain(tabs);
    assert.deepEqual(groups.map(({ hostname, tabs }) => [hostname, tabs.map(tab => tab.id)]), [
      [WORKBENCH_GROUP, [1, 2, 3]], ['example.com', [4]],
    ]);
  }));

  test('closes own duplicates across URL forms and keeps the earliest tab', () => withOwnRuntime(() => {
    const tabs = new Map([
      [9, { url: 'chrome://newtab/' }], [3, { url: ownUrl }],
      [5, { url: `${ownUrl}?from=newtab` }],
      [20, { url: 'https://example.com/a#one' }], [21, { url: 'https://example.com/a#two' }],
      [22, { url: 'chrome-extension://other/index.html' }],
    ]);
    assert.deepEqual(getDuplicateTabIds(tabs, WORKBENCH_GROUP), [5, 9]);
    assert.deepEqual(getDuplicateTabIds(tabs, 'example.com'), [21]);
  }));
});
