const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync('app/(tabs)/news_content/[id].tsx', 'utf8').replace(/\r\n/g, '\n');
const flush = async () => { for (let i = 0; i < 10; i++) await Promise.resolve(); };

(async () => {
  let focus, detailCalls = 0, route, failure = '', result = null;
  const context = {
    id: '42', liking: false, ready: true,
    useFocusEffect: callback => { focus = callback; }, useCallback: callback => callback,
    scroll: { current: null },
    getNewsDetail: async () => { detailCalls++; return { id: '42' }; },
    getNewsList: async () => [], unwrap: value => value, latestPosts: value => value,
    setNews() {}, setError() {}, setLoading() {}, setRelated() {}, setRelatedError() {},
    setActionError: value => { failure = value; },
    likeState: { toggle: async () => result },
    router: { push: value => { route = value; } },
  };
  vm.createContext(context);
  const start = source.indexOf('  useFocusEffect(useCallback(() => {\n    let active');
  assert.ok(start > 0, 'Detail loading must run on focus');
  const effect = source.slice(start, source.indexOf('\n\n  const ready', start)).replace(/unwrap<[^;]+?>\(/g, 'unwrap(');
  vm.runInContext(effect, context);
  let cleanup = focus(); await flush(); cleanup();
  cleanup = focus(); await flush(); cleanup();
  assert.equal(detailCalls, 2, 'Reopening a mounted detail must refetch server engagement');
  const likeStart = source.indexOf('  const like = async');
  vm.runInContext(source.slice(likeStart, source.indexOf('  const body', likeStart)) + '\nglobalThis.like = like;', context);
  await context.like();
  assert.equal(route.pathname, '/(auth)/login');
  assert.equal(route.params.returnTo, '/(tabs)/news_content/42');
  assert.equal(failure, '');
  route = null; result = { liked: true, count: 2 };
  await context.like(); assert.equal(route, null);
  context.likeState.toggle = async () => { throw Error('offline'); };
  await context.like(); assert.ok(failure.includes('Cuba lagi'));
  console.log('Passed: refetch on detail refocus, guest Like login return, authenticated Like, and network error handling.');
})().catch(error => { console.error(error); process.exitCode = 1; });
