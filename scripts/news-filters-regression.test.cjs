const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
function load(file, mocks) {
  const source = fs.readFileSync(file, 'utf8');
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const exports = {};
  vm.runInNewContext(code, { exports, require: name => {
    if (name === './newsLikes') return { observeNewsLikes() {}, newsLikesVersion: () => ({ generation: 0, revision: 0 }) };
    if (name === './sessionEvents') return { subscribeSession() {} };
    if (!(name in mocks)) throw new Error(`Unmocked module: ${name}`);
    return mocks[name];
  }, Date, Intl, Set, Promise });
  return exports;
}
const config = { NEWS_TIME_ZONE: 'Asia/Kuala_Lumpur', NEWS_STALE_TIME: 300000 };
const filters = load('utils/newsFilters.ts', { '@/constants/news': config });
const atMidnight = new Date('2026-11-11T16:00:00Z'); // Nov 12 midnight in Malaysia.
const items = [
  { id: 'today', title: 'Banjir kilat', body: 'Petaling Jaya', category: 'Komuniti', published_at: '2026-11-11T16:00:00Z' },
  { id: 'yesterday', title: 'Banjir semalam', category: 'Komuniti', published_at: '2026-11-11T15:59:59Z' },
  { id: 'education', title: 'Banjir di sekolah', category: 'Pendidikan', date: '12 November 2026' },
  { id: 'today', title: 'Banjir duplicate', category: 'Komuniti', date: '12 November 2026' },
  { id: 'unknown', title: 'Banjir tanpa tarikh', category: 'Komuniti', date: '-' },
];
assert.equal(filters.publicationDay(items[0]), '2026-11-12');
assert.equal(filters.publicationDay(items[1]), '2026-11-11');
assert.equal(filters.publicationDay({ date: '12 November 2026' }), '2026-11-12');
assert.equal(filters.publicationDay({ date: '9 Ogos 2026' }), '2026-08-09');
assert.equal(filters.publicationDay({ created_at: '2026-11-12 00:05:00' }), '2026-11-12');
assert.equal(filters.publicationDay({ date: '31 February 2026' }), null);
assert.equal(filters.publicationDay({ date: 'invalid' }), null);
assert.deepEqual(Array.from(filters.filterNews(items, { query: 'BANJIR Petaling', category: 'Komuniti', date: 'today' }, atMidnight), item => item.id), ['today']);
assert.deepEqual(Array.from(filters.filterNews(items, { date: 'today' }, atMidnight), item => item.id), ['today', 'education']);
assert.equal(filters.filterNews(items, {}, atMidnight).length, 4);
assert.equal(filters.filterNews(items, { query: 'nonexistent' }, atMidnight).length, 0);
assert.deepEqual(Array.from(filters.filterNews(items, { category: 'Komuniti' }, atMidnight), item => item.id), ['today', 'yesterday', 'unknown']);
for (const date of ['today', 'week', 'month']) {
  const result = filters.filterNews(items, { category: 'Komuniti', date }, atMidnight);
  assert.ok(result.length > 0);
  assert.ok(result.every(item => item.category === 'Komuniti'));
}
assert.deepEqual(Array.from(filters.filterNews(items, { category: 'Komuniti', date: 'custom:2026-11-12:2026-11-12' }, atMidnight), item => item.id), ['today']);
assert.deepEqual(Array.from(filters.filterNews(items, { category: 'Komuniti', date: 'custom:2026-11-11:2026-11-12' }, atMidnight), item => item.id), ['today', 'yesterday']);
assert.equal(filters.filterNews(items, { date: 'custom:2026-11-12:2026-11-11' }, atMidnight).length, 0);
assert.equal(filters.customDateRange('custom:2026-02-30:2026-03-01'), null);
assert.equal(filters.filterNews([{ id: 'future', date: '2026-11-13' }], { date: 'custom:2026-11-12:2026-11-14' }, atMidnight).length, 0);
assert.equal(filters.newsDateLabel('custom:2026-10-01:2026-10-01'), '1 Oct 2026');
assert.equal(filters.newsDateLabel('custom:2026-10-01:2026-10-15'), '1 Oct 2026 – 15 Oct 2026');
// Clearing a date restores every date within the selected category.
assert.equal(filters.filterNews(items, { category: 'Komuniti', date: 'all' }, atMidnight).length, 3);
assert.equal(filters.matchesNewsDate(items[0], 'today', new Date('2026-11-12T16:00:00Z')), false);
assert.equal(filters.newsPostingTime({ published_at: '2026-11-11T15:30:00Z' }, atMidnight), '30 min');
assert.equal(filters.newsPostingTime({ date: '12 November 2026' }, atMidnight), '12 November 2026');

async function checkCache() {
  const requests = [];
  let fail = false;
  let finishNews;
  const api = { get(url) {
    requests.push(url);
    if (fail && url === '/news') return Promise.reject(new Error('offline'));
    if (url === '/categories') return Promise.resolve({ data: { categories: [{ name: 'Komuniti' }] } });
    return new Promise(resolve => { finishNews = () => resolve({ data: items }); });
  } };
  const store = load('services/newsFeedStore.ts', { './api': api, '@/constants/news': config });
  const first = store.loadNewsFeed();
  const second = store.loadNewsFeed();
  assert.equal(first, second, 'Concurrent screens should share one request');
  finishNews(); await first;
  assert.equal(store.newsFeedSnapshot().items.length, 4);
  assert.ok(store.newsFeedSnapshot().categories.includes('Komuniti'));
  await store.loadNewsFeed();
  assert.equal(requests.filter(url => url === '/news').length, 1, 'Revisiting a fresh feed must not refetch');
  store.invalidateNewsFeed();
  const reload = store.loadNewsFeed();
  finishNews(); await reload;
  assert.equal(requests.filter(url => url === '/news').length, 2);
  fail = true;
  await store.loadNewsFeed(true);
  assert.ok(store.newsFeedSnapshot().error);
  assert.equal(store.newsFeedSnapshot().items.length, 4, 'Keep real cached articles on a refresh error');
  assert.equal(store.newsFeedSnapshot().refreshing, false);
}
checkCache().then(() => console.log('Passed: local midnight boundaries, legacy dates, combined filters, deduplication, relative time, shared requests, cache reuse, invalidation, and offline recovery.')).catch(error => { console.error(error); process.exitCode = 1; });
