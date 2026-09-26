'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

function memoryStorage() {
  const data = {};
  return {
    getItem(k) { return Object.prototype.hasOwnProperty.call(data, k) ? data[k] : null; },
    setItem(k, v) { data[k] = String(v); },
    removeItem(k) { delete data[k]; }
  };
}

function loadApp() {
  const sandbox = { window: {}, console, localStorage: memoryStorage() };
  vm.createContext(sandbox);
  ['play-data.js', 'chat-data.js', 'chat-data-extra.js', 'outing-data.js', 'outing-enrich.js', 'storage.js'].forEach((name) => {
    const file = path.join(__dirname, '..', 'js', name);
    vm.runInContext(fs.readFileSync(file, 'utf8'), sandbox, { filename: file });
  });
  return { storage: sandbox.window.GamePicker.storage, localStorage: sandbox.localStorage };
}

function testCatalog() {
  const S = loadApp().storage;
  const state = S.defaultState();
  const items = state.modules.outing.items;
  const ids = items.map((item) => item.id);
  assert.strictEqual(new Set(ids).size, ids.length, 'outing ids must be unique');
  assert.ok(!ids.includes('excel-place'), 'shared excel-place id must be gone');
  assert.strictEqual(items.filter((item) => item.nameZh === '莲花山公园').length, 1);

  const lianhua = items.find((item) => item.nameZh === '莲花山公园');
  assert.strictEqual(lianhua.area, '福田');
  assert.ok(lianhua.highlights.includes('登顶'));
  assert.ok(String(lianhua.notes).includes('周末建议早出发'));
  assert.ok(String(lianhua.notes).includes('2024-11-02') || (lianhua.visitHistory || []).includes('2024-11-02'));

  const expect = {
    '人才公园': 'hiking',
    '深圳博物馆古代艺术馆': 'museum',
    '华大时空中心': 'rainy',
    '宜家': 'mall',
    '珠海长隆海洋王国': 'theme-park',
    '科技园文体中心羽毛球馆': 'rainy',
    '西丽环湖绿道': 'hiking',
    '罗田森林公园': 'cycling',
    '南澳岛': 'hiking',
    '顺德博物馆': 'museum'
  };
  Object.keys(expect).forEach((name) => {
    const item = items.find((place) => place.nameZh === name);
    assert.ok(item, 'missing place ' + name);
    assert.strictEqual(item.categoryId, expect[name], name);
  });

  assert.strictEqual(S.durationMatches('2–3小时', '2'), true);
  assert.strictEqual(S.durationMatches('2小时', '2'), true);
  assert.strictEqual(S.durationMatches('1–2天', '2'), false);
  assert.strictEqual(S.durationMatches('半天', '2'), false);
  assert.strictEqual(S.durationMatches('半天', '半天'), true);
  assert.strictEqual(S.durationMatches('1–2天', '一天'), false);
  assert.strictEqual(S.durationMatches('一天', '一天'), true);
  assert.strictEqual(S.durationMatches('', ''), true);

  items.filter((item) => item.categoryId === 'rainy').forEach((item) => {
    assert.notStrictEqual(item.indoorOutdoor, '室外', item.nameZh + ' should not be an outdoor rainy-day pick');
  });
  assert.notStrictEqual(items.find((item) => item.nameZh === '深圳大学').categoryId, 'museum');
  assert.notStrictEqual(items.find((item) => item.nameZh === '云巴').categoryId, 'cycling');
  assert.strictEqual(S.outingPitch(items.find((item) => item.nameZh === '桂湾公园')), '小火车');
  assert.ok(S.outingPitch(lianhua).includes('登顶'));
  const nanshan = S.outingPitch(items.find((item) => item.nameZh === '大南山'));
  assert.ok(nanshan.includes('北登山口'));
  assert.ok(nanshan.indexOf('\n') === -1);
  assert.ok(S.mapQuery(items.find((item) => item.nameZh === '中山公园')).indexOf('深圳南山') === 0);
  const vanke = items.find((item) => item.nameZh === '万科广场');
  assert.ok(S.mapQuery(vanke).indexOf('东莞') !== -1);
  assert.ok(S.mapQuery(vanke).indexOf('深圳') === -1);
  assert.ok(state.modules.play.items.length >= 50, 'play catalog should include the added activities');
  assert.ok(state.modules.chat.items.length >= 248, 'chat catalog should include the added cards');
  assert.ok(S.outingPitch(items.find((item) => item.nameZh === '人才公园')).includes('深圳湾'));
  assert.ok(items.some((item) => item.nameZh === '深圳欢乐谷'));
  assert.strictEqual(items.filter((item) => item.nameZh === '深圳欢乐谷').length, 1);
  const descriptions = new Set(state.modules.play.items.map((item) => item.descriptionZh));
  assert.ok(descriptions.size > 20, 'play descriptions should not all be the same sentence');

  const bedtime = state.modules.chat.categories.find((category) => category.id === 'bedtime');
  assert.strictEqual(bedtime.nameZh, '睡前入梦');
  const logic = state.modules.chat.items.find((item) => item.id === 'chat-logic-01');
  assert.ok(logic.hintZh);
  assert.ok(logic.thinkingPromptZh);
  assert.ok(logic.answerZh);
}

function testRoundTrip() {
  const loadedApp = loadApp();
  const S = loadedApp.storage;
  const state = S.defaultState();
  const before = state.modules.outing.items.length;
  const victim = state.modules.outing.items.find((item) => item.nameZh === '人才公园');
  const survivor = state.modules.outing.items.find((item) => item.nameZh === '荔香公园');
  state.modules.outing.items = state.modules.outing.items.filter((item) => item.id !== victim.id);
  const play = state.modules.play.items[0];
  play.favorite = true;
  play.nameZh = '改过的名字';
  state.modules.play.items.unshift({
    id: 'custom-test',
    nameZh: '自建活动',
    nameEn: 'Custom',
    categoryId: 'toy',
    emoji: '🎈',
    descriptionZh: '测试',
    descriptionEn: 'Test',
    favorite: false,
    source: 'custom',
    createdAt: 1,
    updatedAt: 1,
    pickCount: 0,
    lastPickedAt: null
  });
  assert.strictEqual(S.saveState(state), true);
  const loaded = S.loadState().state;
  assert.strictEqual(loaded.modules.outing.items.length, before - 1);
  assert.ok(!loaded.modules.outing.items.some((item) => item.id === victim.id));
  assert.ok(loaded.modules.outing.items.some((item) => item.id === survivor.id));
  const edited = loaded.modules.play.items.find((item) => item.id === play.id);
  assert.strictEqual(edited.favorite, true);
  assert.strictEqual(edited.nameZh, '改过的名字');
  assert.ok(loaded.modules.play.items.some((item) => item.id === 'custom-test' && item.source === 'custom'));

  loadedApp.localStorage.setItem(S.KEY, '{');
  const bad = S.loadState();
  assert.strictEqual(bad.corrupt, true);
  assert.ok(bad.state.modules.outing.items.length > 200);
  assert.ok(!bad.state.modules.outing.items.some((item) => item.id === 'excel-place'));
}

testCatalog();
testRoundTrip();
console.log('storage tests passed');
