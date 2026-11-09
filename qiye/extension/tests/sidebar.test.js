import { suite, test, assert } from './testUtil.js';
import * as sidebar from '../ui/views/sidebar.js';

class FakeClassList {
  constructor(owner) { this.owner = owner; }
  add(...names) {
    const set = new Set(this.owner.className.split(/\s+/).filter(Boolean));
    for (const name of names) set.add(name);
    this.owner.className = Array.from(set).join(' ');
  }
  toggle(name, force) {
    const set = new Set(this.owner.className.split(/\s+/).filter(Boolean));
    if (force ?? !set.has(name)) set.add(name);
    else set.delete(name);
    this.owner.className = Array.from(set).join(' ');
  }
}

class FakeElement {
  constructor(tagName) {
    this.tagName = tagName.toUpperCase();
    this.children = [];
    this.parentNode = null;
    this.className = '';
    this.value = '';
    this._textContent = '';
    this.attributes = new Map();
    this.listeners = new Map();
    this.style = {};
    this.classList = new FakeClassList(this);
  }

  get textContent() {
    return this._textContent + this.children.map((child) => child.textContent).join('');
  }

  set textContent(value) {
    this._textContent = String(value);
    this.children = [];
  }

  appendChild(child) {
    child.parentNode = this;
    this.children.push(child);
    return child;
  }

  prepend(child) {
    child.parentNode = this;
    this.children.unshift(child);
  }

  remove() {
    if (!this.parentNode) return;
    const index = this.parentNode.children.indexOf(this);
    if (index >= 0) this.parentNode.children.splice(index, 1);
    this.parentNode = null;
  }

  setAttribute(name, value) {
    this.attributes.set(name, String(value));
  }

  addEventListener(type, handler) {
    const handlers = this.listeners.get(type) || [];
    handlers.push(handler);
    this.listeners.set(type, handlers);
  }

  async dispatch(type) {
    const event = { target: this, preventDefault() {} };
    await Promise.all((this.listeners.get(type) || []).map((handler) => handler(event)));
  }

  async click() {
    await this.dispatch('click');
  }

  querySelector(selector) {
    return this.querySelectorAll(selector)[0] || null;
  }

  querySelectorAll(selector) {
    const matches = [];
    const className = selector.startsWith('.') ? selector.slice(1) : null;
    const visit = (node) => {
      if (className && node.className.split(/\s+/).includes(className)) matches.push(node);
      for (const child of node.children) visit(child);
    };
    for (const child of this.children) visit(child);
    return matches;
  }
}

function installDom() {
  globalThis.document = {
    createElement: (tag) => new FakeElement(tag),
    createTextNode: (text) => {
      const node = new FakeElement('#text');
      node.textContent = text;
      return node;
    },
  };
}

function savedEntry(overrides = {}) {
  return {
    id: 'saved-1',
    url: 'https://example.com/article',
    title: 'Example article',
    favIconUrl: '',
    savedAt: new Date(2026, 0, 2, 3, 4).getTime(),
    ...overrides,
  };
}

function installChrome(removedIds = [], viewedUpdates = [], failViewed = false) {
  const created = [];
  chrome.tabs = {
    create: async (options) => { created.push(options); },
  };
  chrome.runtime = {
    sendMessage: async (message) => {
      if (message.type === 'REQ_REMOVE_SAVED') removedIds.push(message.id);
      if (message.type === 'REQ_SET_SAVED_VIEWED') {
        viewedUpdates.push(message);
        if (failViewed) return { ok: false, error: 'write failed' };
        return { ok: true, data: { entry: savedEntry({ id: message.id, viewed: message.viewed }) } };
      }
      return { ok: true, data: { removed: message.id } };
    },
  };
  return created;
}

function visibleTitles(root) {
  return root.querySelectorAll('.sidebar__entryTitle').map((element) => element.textContent);
}

suite('Save for Later sidebar', () => {
  test('clicking title opens tab but keeps saved entry', async () => {
    installDom();
    const root = new FakeElement('aside');
    const removedIds = [];
    const created = installChrome(removedIds);

    sidebar.render(root, [savedEntry()]);
    await root.querySelector('.sidebar__entryTitle').click();

    assert.deepEqual(created, [{ url: 'https://example.com/article', active: false }]);
    assert.deepEqual(removedIds, [], 'opening must not remove saved entry');
    assert.equal(root.querySelectorAll('.sidebar__entry').length, 1, 'entry stays visible');
    assert.equal(root.querySelector('.sidebar__count').textContent, '1');
  });

  test('clicking remove deletes the item and calls optional callback', async () => {
    installDom();
    const root = new FakeElement('aside');
    const removedIds = [];
    const callbackIds = [];
    installChrome(removedIds);

    sidebar.init(root, [savedEntry()], {
      onRemoved: async (id) => { callbackIds.push(id); },
    });
    await root.querySelector('.sidebar__entryRemove').click();

    assert.deepEqual(removedIds, ['saved-1']);
    assert.deepEqual(callbackIds, ['saved-1']);
    assert.equal(root.querySelectorAll('.sidebar__entry').length, 0);
    assert.equal(root.hidden, true, 'entire section hidden after last removal');
    assert.equal(root.textContent, '', 'no heading or placeholder left');
  });

  test('search matches title and URL case-insensitively', async () => {
    installDom();
    const root = new FakeElement('aside');
    installChrome();
    sidebar.render(root, [
      savedEntry({ id: 'alpha', title: 'Alpha Guide', url: 'https://example.com/a' }),
      savedEntry({ id: 'docs', title: 'Second item', url: 'https://docs.example.com/needle' }),
      savedEntry({ id: 'other', title: 'Other', url: 'https://other.example.com' }),
    ]);

    const search = root.querySelector('.sidebar__search');
    search.value = 'ALPHA';
    await search.dispatch('input');
    assert.deepEqual(visibleTitles(root), ['Alpha Guide']);

    search.value = 'docs.example.com';
    await search.dispatch('input');
    assert.deepEqual(visibleTitles(root), ['Second item']);

    search.value = 'missing';
    await search.dispatch('input');
    assert.deepEqual(visibleTitles(root), []);
    assert.equal(root.querySelector('.sidebar__empty').textContent, '没有匹配的标签');
  });

  test('sorts by newest, oldest, and title', async () => {
    installDom();
    const root = new FakeElement('aside');
    installChrome();
    sidebar.render(root, [
      savedEntry({ id: 'beta', title: 'Beta', savedAt: 30 }),
      savedEntry({ id: 'zulu', title: 'Zulu', savedAt: 10 }),
      savedEntry({ id: 'alpha', title: 'alpha', savedAt: 20 }),
    ]);

    assert.deepEqual(visibleTitles(root), ['Beta', 'alpha', 'Zulu']);

    const sort = root.querySelector('.sidebar__sort');
    sort.value = 'oldest';
    await sort.dispatch('change');
    assert.deepEqual(visibleTitles(root), ['Zulu', 'alpha', 'Beta']);

    sort.value = 'title';
    await sort.dispatch('change');
    assert.deepEqual(visibleTitles(root), ['alpha', 'Beta', 'Zulu']);
  });

  test('empty sidebar has no heading and first save reveals exactly one entry', () => {
    installDom();
    const root = new FakeElement('aside');
    sidebar.render(root, []);
    assert.equal(root.hidden, true);
    assert.equal(root.textContent, '');
    sidebar.add(savedEntry());
    sidebar.add(savedEntry());
    assert.equal(root.hidden, false);
    assert.equal(root.querySelectorAll('.sidebar__entry').length, 1);
  });

  test('checkbox moves entry to viewed and can restore it', async () => {
    installDom();
    const root = new FakeElement('aside');
    const updates = [];
    installChrome([], updates);
    sidebar.render(root, [savedEntry()]);
    const check = root.querySelector('.sidebar__check');
    check.checked = true;
    await check.dispatch('change');
    assert.equal(updates[0].viewed, true);
    assert.equal(root.querySelector('.sidebar__count').textContent, '0');
    assert.equal(root.querySelector('.sidebar__viewed').hidden, false);
    assert.equal(root.querySelector('.sidebar__viewedCount').textContent, '1');
    assert.equal(root.hidden, false, 'viewed records keep section available');
    const restore = root.querySelector('.sidebar__viewedList').querySelector('.sidebar__check');
    restore.checked = false;
    await restore.dispatch('change');
    assert.equal(updates[1].viewed, false);
    assert.equal(root.querySelector('.sidebar__count').textContent, '1');
    assert.equal(root.querySelector('.sidebar__viewed').hidden, true);
  });

  test('duplicate save response and broadcast do not replace a checkbox during interaction', () => {
    installDom();
    const root = new FakeElement('aside');
    const entry = savedEntry();
    sidebar.render(root, [entry]);
    const check = root.querySelector('.sidebar__check');
    check.checked = true;
    sidebar.add({ ...entry });
    sidebar.render(root, [{ ...entry }]);
    assert.equal(root.querySelector('.sidebar__check'), check);
    assert.equal(check.checked, true, 'native click state preserved until change handler');
  });

  test('failed viewed update keeps the entry pending and shows feedback', async () => {
    installDom();
    const root = new FakeElement('aside');
    installChrome([], [], true);
    sidebar.render(root, [savedEntry()]);
    const check = root.querySelector('.sidebar__check');
    check.checked = true;
    await check.dispatch('change');
    assert.equal(check.checked, false);
    assert.equal(check.disabled, false);
    assert.equal(root.querySelector('.sidebar__count').textContent, '1');
    assert.equal(root.querySelector('.sidebar__feedback').textContent, '操作失败，请重试。');
  });

  test('broadcast preserves pending search sort viewed search and disclosure', async () => {
    installDom();
    const root = new FakeElement('aside');
    sidebar.render(root, [
      savedEntry({ id: 'pending' }),
      savedEntry({ id: 'viewed', viewed: true, title: 'Viewed guide' }),
    ]);
    const search = root.querySelector('.sidebar__search');
    search.value = 'example';
    await search.dispatch('input');
    const sort = root.querySelector('.sidebar__sort');
    sort.value = 'oldest';
    await sort.dispatch('change');
    const viewedSearch = root.querySelector('.sidebar__viewedSearch');
    viewedSearch.value = 'guide';
    await viewedSearch.dispatch('input');
    const details = root.querySelector('.sidebar__viewed');
    details.open = true;
    await details.dispatch('toggle');
    sidebar.render(root, [
      savedEntry({ id: 'pending' }),
      savedEntry({ id: 'another', title: 'Unrelated' }),
      savedEntry({ id: 'viewed', viewed: true, title: 'Viewed guide' }),
    ]);
    assert.equal(root.querySelector('.sidebar__search'), search);
    assert.equal(search.value, 'example');
    assert.equal(sort.value, 'oldest');
    assert.equal(viewedSearch.value, 'guide');
    assert.equal(details.open, true);
    assert.deepEqual(visibleTitles(root.querySelector('.sidebar__viewedList')), ['Viewed guide']);
  });
});
