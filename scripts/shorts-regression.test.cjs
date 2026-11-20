const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const requests = [];
let release;
const deferred = new Promise(resolve => { release = resolve; });
const mocks = {
  './api': { __esModule: true, default: { get: async (url, options) => {
    requests.push([url, options]);
    if (url === '/shorts') { await deferred; return { data: { mobile_feed: true, shorts: { data: [{ id: 8, status: 'published' }, { id: 9, status: 'archived' }, { id: 10, deleted_at: 'today' }], next_page_url: '/api/shorts?page=2' } } }; }
    if (url === '/shorts/8') return { data: { data: { id: 8, title: 'Video' } } };
    if (url === '/shorts/8/comments') return { data: { count: 12, comments: { data: [{ id: '1', replies_count: 1 }], next_page_url: 'next' } } };
    if (url.endsWith('/replies')) return { data: { data: [{ id: '2', parent_id: '1' }], next_page_url: null } };
    throw Error(url);
  }, post: async (url, body) => { requests.push([url, body]); return { data: { message: 'Laporan diterima.' } }; } } },
  './guestCommentService': { postShortComment() {}, postShortCommentReply() {} },
  './authService': { getToken: async () => null },
  './sessionEvents': { subscribeSession() {} },
};
const exportsObject = {};
vm.runInNewContext(ts.transpileModule(fs.readFileSync('services/shortsService.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText, { exports: exportsObject, require: name => { if (!mocks[name]) throw Error(name); return mocks[name]; }, Date, Map, Promise, setTimeout });
(async () => {
  const a = exportsObject.getShorts(); const b = exportsObject.getShorts(); release();
  const [first, second] = await Promise.all([a, b]);
  assert.equal(first, second);
  assert.equal(requests.length, 1, 'Concurrent homepage/feed requests coalesce');
  assert.deepEqual(Array.from(first.items, item => item.id), ['8']);
  assert.equal(first.next, 2);
  await exportsObject.getShorts();
  assert.equal(requests.length, 1, 'First page is cached');
  await Promise.all([exportsObject.getShort('8'), exportsObject.getShort('8')]);
  assert.equal(requests.filter(([url]) => url === '/shorts/8').length, 1);
  const snapshot = await exportsObject.shortComments('8');
  assert.equal(snapshot.total, 12);
  assert.equal(snapshot.nextPage, 2, 'Additional comment pages are requested by the reader');
  assert.equal(snapshot.comments.length, 2);
  await exportsObject.shortsCommentAdapter.report('12', 'Komentar menghina warga.', '8');
  assert.equal(requests.at(-1)[0], '/shorts/8/comments/12/report');
  assert.equal(requests.at(-1)[1].reason, 'Komentar menghina warga.');
  console.log('Shorts service regression tests passed');
})().catch(error => { console.error(error); process.exitCode = 1; });
