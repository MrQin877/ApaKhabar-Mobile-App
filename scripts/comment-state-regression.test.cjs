const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
function load(file, mocks = {}, globals = {}) {
  const exports = {};
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true } }).outputText;
  vm.runInNewContext(code, { exports, console, Date, setTimeout, setInterval, clearInterval, ...globals, require: name => { assert.ok(name in mocks, `Unmocked ${name}`); return mocks[name]; } });
  return exports;
}
const flush = async () => { for (let i = 0; i < 25; i++) await Promise.resolve(); };
const helpers = load('utils/newsComments.ts');
const navigation = load('utils/authNavigation.ts');
const jsx = (type, props) => ({ type, props });
const nodes = tree => Array.isArray(tree) ? tree.flatMap(nodes) : tree && typeof tree === 'object' ? [tree, ...nodes(tree.props?.children)] : [];
function renderer() {
  let index = 0;
  const state = [], effects = [];
  return {
    react: {
      forwardRef: fn => fn,
      useCallback(fn, deps) { const i = index++; if (!state[i] || deps.some((value, j) => value !== state[i].deps[j])) state[i] = { deps, value: fn }; return state[i].value; },
      useMemo(fn, deps) { const i = index++; if (!state[i] || deps.some((value, j) => value !== state[i].deps[j])) state[i] = { deps, value: fn() }; return state[i].value; },
      useState(initial) { const i = index++; if (!(i in state)) state[i] = typeof initial === 'function' ? initial() : initial; return [state[i], value => { state[i] = typeof value === 'function' ? value(state[i]) : value; }]; },
      useRef(initial) { const i = index++; return state[i] ||= { current: initial }; },
      useEffect(fn, deps) { const i = index++; const old = state[i]; if (!old || deps.some((value, j) => value !== old.deps[j])) { effects.push(() => { old?.cleanup?.(); state[i] = { deps, cleanup: fn() }; }); } },
    },
    render(fn) { index = 0; const tree = fn(); effects.splice(0).forEach(effect => effect()); return tree; },
    unmount() { state.forEach(value => value?.cleanup?.()); },
  };
}

(async () => {
  for (const count of [0, 1, 2, 11]) for (const authenticated of [false, true]) {
    const r = renderer(); let firstRead, reads = 0, writes = 0;
    const initial = { comments: Array.from({ length: count }, (_, i) => ({ id: String(i + 1), content: 'Existing', author: 'Reader' })), total: count };
    const updated = { comments_list: [...initial.comments, { id: '99', content: 'New comment', author: 'Reader' }], comments_count: count + 1 };
    const changes = [];
    const news = {
      getNewsDetail: async id => { assert.equal(id, '17'); reads++; return reads === 1 ? new Promise(resolve => { firstRead = resolve; }) : updated; },
      postComment: async (id, content) => { assert.equal(id, '17'); assert.equal(content, 'New comment'); writes++; return { status: 'published', comments_count: count + 1 }; },
    };
    const native = { ActivityIndicator: 'Loading', Keyboard: { dismiss() {}, addListener: () => ({ remove() {} }) }, StyleSheet: { create: value => value, hairlineWidth: 1 }, Text: 'Text', View: 'View', RefreshControl: 'Refresh', useWindowDimensions: () => ({ height: 800 }) };
    const sheet = load('components/news/CommentsSheet.tsx', {
      '@/components/ui/FormError': { FormError: 'FormError' }, react: r.react,
      'react/jsx-runtime': { jsx, jsxs: jsx, Fragment: 'Fragment' }, 'react-native': native,
      'heroui-native/bottom-sheet': { BottomSheet: Object.assign('BottomSheet', { Portal: 'Portal', Overlay: 'Overlay', Content: 'Content', Title: 'Title' }) },
      'heroui-native/hooks': { useBottomSheetAwareHandlers: () => ({}) }, 'heroui-native/input': { Input: 'Input' },
      '@gorhom/bottom-sheet': { BottomSheetFlatList: 'List' }, 'heroui-native/button': { Button: 'Button' }, '@expo/vector-icons': { Ionicons: 'Icon' },
      'expo-router': { useRouter: () => ({ push() {} }) }, 'react-native-safe-area-context': { useSafeAreaInsets: () => ({ top: 0, bottom: 0 }) },
      '@/constants/theme': { Design: { contentWidth: 680 } }, '@/services/authService': { getToken: async () => authenticated ? 'token' : null, getUser: async () => null },
      '@/services/sessionEvents': { subscribeSession: () => () => {} }, '@/services/newsService': news, '@/utils/newsComments': helpers,
      './CommentReportForm': { CommentReportForm: 'ReportForm' }, './CommentRow': { CommentRow: 'Row' }, './GuestCommentLimitDialog': { GuestCommentLimitDialog: 'Dialog' },
    }, { setInterval: () => 0, clearInterval() {} });
    const props = { newsId: '17', visible: true, initialSnapshot: initial, theme: {}, onClose() {}, onChange: snapshot => changes.push(snapshot) };
    const render = () => r.render(() => sheet.CommentsSheet(props));
    const find = (tree, label) => nodes(tree).find(node => node.props?.accessibilityLabel === label);
    render(); await flush(); let tree = render();
    find(tree, 'Tulis komen').props.onChangeText('New comment'); tree = render();
    assert.equal(find(tree, 'Hantar komen').props.isDisabled, false, `count=${count}, auth=${authenticated}: list loading is not a submission permission`);
    const submission = find(tree, 'Hantar komen').props.onPress(); await flush();
    assert.equal(writes, 1); assert.equal(changes.at(-1).total, count + 1, 'Use POST-confirmed count before a slow GET completes');
    firstRead({ comments_list: initial.comments, comments_count: count }); await flush(); await submission;
    assert.equal(reads, 2, 'A pre-POST request must not swallow the post-POST read');
    assert.ok(changes.every(snapshot => snapshot.total === count + 1), 'Stale reads cannot revert confirmed counts');
    tree = render(); assert.equal(nodes(tree).find(node => node.type === 'List').props.data.length, count + 1);
    news.postComment = async () => { throw { response: { status: 422, data: { errors: { content: ['Duplicate submission'] } } } }; };
    find(tree, 'Tulis komen').props.onChangeText('Keep this draft'); tree = render();
    await find(tree, 'Hantar komen').props.onPress(); tree = render();
    assert.equal(find(tree, 'Tulis komen').props.value, 'Keep this draft');
    assert.equal(nodes(tree).find(node => node.type === 'FormError' && node.props.message).props.message, 'Duplicate submission');
    r.unmount();
  }
  console.log('Passed: guest/auth composers at 0/1/2/11 comments, slow initial loads, server-confirmed counts, stale read ordering, and shared validation errors with retained drafts.');
  let finish;
  const store = load('services/newsFeedStore.ts', {
    './newsLikes': { newsLikesVersion: () => ({}), observeNewsLikes() {} },
    './sessionEvents': { subscribeSession() {} }, '@/constants/news': { NEWS_STALE_TIME: 60_000 },
    './api': { get: async path => path === '/categories' ? { data: { categories: [] } } : new Promise(resolve => { finish = count => resolve({ data: [{ id: '17', comments: count }] }); }) },
  });
  const firstFeed = store.loadNewsFeed();
  store.updateNewsCommentCount('17', 1); finish(0); await firstFeed;
  assert.equal(store.newsFeedSnapshot().items[0].comments, 1);
  const nextFeed = store.loadNewsFeed(true);
  store.updateNewsCommentCount('17', 2); finish(1); await nextFeed;
  assert.equal(store.newsFeedSnapshot().items[0].comments, 2, 'An older feed response cannot undo a confirmed comment');
  const freshFeed = store.loadNewsFeed(true); finish(1); await freshFeed;
  assert.equal(store.newsFeedSnapshot().items[0].comments, 1, 'A later authoritative read can reflect moderator removal');
  const keys = [];
  const service = load('services/newsService.ts', {
    './newsLikes': {}, './api': {}, './apiConfig': {},
    './newsFeedStore': { invalidateNewsFeed() {}, updateNewsCommentCount: (id, count) => keys.push([id, count]) },
    './guestCommentService': { submitPublicComment: async () => ({ status: 'published', comments_count: 2 }) },
  });
  await service.postComment('17', 'Root'); await service.postCommentReply('99', 'Reply', '17');
  assert.deepEqual(keys, [['17', 2], ['17', 2]], 'Reply counts belong to the news ID, not the comment ID');
  console.log('Passed: immediate feed count updates, stale feed ordering, later moderator changes, and correct news-ID mapping for reply counts.');
})().catch(error => { console.error(error); process.exitCode = 1; });
