const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
function load(file, mocks = {}, globals = {}) {
  const exports = {};
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX } }).outputText;
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
  const storage = new Map(); const calls = []; let auth = null, failure = null, clock = 100_000, issuance = 0;
  const secureStore = { getItemAsync: async key => storage.get(key) || null, setItemAsync: async (key, value) => storage.set(key, value) };
  const token = 'a'.repeat(64);
  const mocks = {
    'expo-secure-store': secureStore, 'react-native': { Platform: { OS: 'android' } }, './authService': { getToken: async () => auth },
    './api': {
      get: async (path, config) => { calls.push({ method: 'get', path, config }); return { data: { challenge: `challenge:${path}` } }; },
      post: async (path, body, config) => {
        calls.push({ method: 'post', path, body, config });
        if (path === '/guest-comments/identity') { issuance++; return { data: { token } }; }
        if (failure) throw failure;
        return { data: { status: 'pending_review', remaining_quota: 2 } };
      },
    },
  };
  const globals = { Date: class extends Date { static now() { return clock; } }, setTimeout: (fn, ms) => { clock += ms; fn(); } };
  let service = load('services/guestCommentService.ts', mocks, globals);
  const result = await service.submitPublicComment('/news/42/comment', 'news', '42', 'First');
  assert.equal(result.status, 'pending_review'); assert.equal(result.remaining_quota, 2);
  assert.equal(storage.get('guest_comment_identity_v1'), token);
  assert.equal(calls.at(-1).config.headers['X-Guest-Token'], token);
  assert.equal(calls.at(-1).body.website, ''); assert.ok(clock >= 103_100);
  await service.submitPublicComment('/comments/7/replies', 'news', '42', 'Reply');
  assert.equal(calls.filter(call => call.method === 'get').length, 1, 'Reuse an aged challenge for the same article');
  // Reload the module as after an app restart: storage, not a local quota or identity variable, is authoritative.
  service = load('services/guestCommentService.ts', mocks, globals);
  await service.postShortComment('9', 'Short comment');
  await service.postShortCommentReply('9', '2', 'Short reply');
  assert.equal(issuance, 1); assert.equal(calls.at(-1).path, '/shorts/9/comments/2/replies');
  assert.equal(calls.at(-1).config.headers['X-Guest-Token'], token);
  for (const status of [401, 422, 429, 500]) {
    failure = { response: { status, data: {} } };
    await assert.rejects(service.postShortComment('9', 'Keep draft'), error => error === failure);
    assert.equal(issuance, 1, 'Never evade errors or quota by silently rotating a guest identity');
  }
  failure = null; auth = 'authenticated';
  await service.submitPublicComment('/news/42/comment', 'news', '42', 'Logged in');
  assert.deepEqual(JSON.parse(JSON.stringify(calls.at(-1).body)), { content: 'Logged in' });
  assert.equal(calls.at(-1).config, undefined, 'Authenticated comments use existing bearer interceptor');
  auth = null;
  const broken = load('services/guestCommentService.ts', { ...mocks, 'expo-secure-store': { getItemAsync: async () => null, setItemAsync: async () => { throw Error('Storage failed'); } } }, globals);
  const before = calls.length;
  await assert.rejects(broken.postShortComment('9', 'Do not send'), /Storage failed/);
  assert.equal(calls.length, before + 1, 'No comment is submitted unless its credential was saved');

  assert.equal(helpers.isGuestQuotaError({ response: { status: 422, data: { code: 'guest_comment_quota_exceeded' } } }), true);
  for (const error of [{}, { response: { status: 401 } }, { response: { status: 429 } }, { response: { status: 422, data: { errors: { content: ['Duplicate'] } } } }]) assert.equal(helpers.isGuestQuotaError(error), false);
  assert.equal(navigation.authDestination('/(tabs)/news_content/42?comments=open'), '/(tabs)/news_content/42?comments=open');
  assert.equal(navigation.authDestination('/(tabs)/news_content/42'), '/(tabs)/news_content/42');
  assert.equal(navigation.authDestination('/(tabs)/news_content/42?redirect=https://outside.test'), '/(tabs)/news_content');
  assert.equal(navigation.authDestination('https://outside.test'), '/(tabs)/news_content');

  const themes = load('constants/theme.ts', { 'react-native': { Platform: { select: value => value.default } } }).Colors;
  const events = load('services/sessionEvents.ts');
  const r = renderer(); let sessionToken = null, route, mode = 'quota', sent = 0;
  const runtime = { jsx, jsxs: jsx, Fragment: 'Fragment' };
  const native = { ActivityIndicator: 'Loading', Keyboard: { dismiss() {}, addListener: () => ({ remove() {} }) }, StyleSheet: { create: value => value, hairlineWidth: 1 }, Text: 'Text', View: 'View', RefreshControl: 'Refresh', useWindowDimensions: () => ({ height: 800 }) };
  const snapshots = { comments: [{ id: '7', content: 'Public', author: 'Guest12345' }], total: 1 };
  const news = {
    getNewsDetail: async () => ({ comments_list: snapshots.comments, comments_count: 1 }),
    postComment: async () => { sent++; if (mode === 'quota') throw { response: { status: 422, data: { code: 'guest_comment_quota_exceeded' } } }; if (mode === 'throttle') throw { response: { status: 429 } }; return { status: 'published', remaining_quota: sessionToken ? null : 0 }; },
    postCommentReply: async () => ({ status: 'pending_review', remaining_quota: 1 }),
  };
  const Dialog = 'GuestLimit';
  const sheet = load('components/news/CommentsSheet.tsx', {
    '@/components/ui/FormError': { FormError: 'FormError' },
    react: r.react, 'react/jsx-runtime': runtime, 'react-native': native,
    'heroui-native/bottom-sheet': { BottomSheet: Object.assign('BottomSheet', { Portal: 'Portal', Overlay: 'Overlay', Content: 'Content', Title: 'Title' }) },
    'heroui-native/hooks': { useBottomSheetAwareHandlers: () => ({}) }, 'heroui-native/input': { Input: 'Input' },
    '@gorhom/bottom-sheet': { BottomSheetFlatList: 'List' }, 'heroui-native/button': { Button: 'Button' }, '@expo/vector-icons': { Ionicons: 'Icon' },
    'expo-router': { useRouter: () => ({ push: value => { route = value; } }) },
    'react-native-safe-area-context': { useSafeAreaInsets: () => ({ top: 0, bottom: 0 }) },
    '@/constants/theme': { Design: { contentWidth: 680 } }, '@/services/authService': { getToken: async () => sessionToken, getUser: async () => null },
    '@/services/sessionEvents': events, '@/services/newsService': news, '@/utils/newsComments': helpers,
    './CommentRow': { CommentRow: 'Row' }, './GuestCommentLimitDialog': { GuestCommentLimitDialog: Dialog },
  }, { setInterval: () => 0, clearInterval() {} });
  let closed = 0;
  const props = { newsId: '42', visible: true, initialSnapshot: snapshots, theme: themes.light, onClose: () => { closed++; }, onChange() {} };
  const render = () => r.render(() => sheet.CommentsSheet(props));
  const find = (tree, label) => nodes(tree).find(node => node.props?.accessibilityLabel === label);
  render(); await flush(); let tree = render();
  find(tree, 'Tulis komen').props.onChangeText('Preserve this draft'); tree = render();
  await Promise.all([find(tree, 'Hantar komen').props.onPress(), find(tree, 'Hantar komen').props.onPress()]); tree = render();
  assert.equal(sent, 1); assert.equal(nodes(tree).find(node => node.type === Dialog).props.visible, true);
  nodes(tree).find(node => node.type === Dialog).props.onClose(); tree = render();
  assert.equal(nodes(tree).find(node => node.type === Dialog).props.visible, false);
  assert.equal(find(tree, 'Tulis komen').props.value, 'Preserve this draft');
  assert.equal(nodes(tree).find(node => node.type === 'List').props.data.length, 1); assert.equal(closed, 0);
  mode = 'success'; await find(tree, 'Hantar komen').props.onPress(); tree = render();
  find(tree, 'Tulis komen').props.onChangeText('Another comment after zero remaining'); tree = render();
  mode = 'throttle'; await find(tree, 'Hantar komen').props.onPress(); tree = render();
  assert.equal(nodes(tree).find(node => node.type === Dialog).props.visible, false);
  mode = 'quota'; await find(tree, 'Hantar komen').props.onPress(); tree = render();
  nodes(tree).find(node => node.type === Dialog).props.onLogin();
  assert.equal(route.pathname, '/(auth)/login'); assert.equal(navigation.authDestination(route.params.returnTo), '/(tabs)/news_content/42?comments=open');
  sessionToken = 'logged-in'; events.sessionChanged(); await flush(); tree = render();
  assert.equal(nodes(tree).find(node => node.type === Dialog).props.visible, false);
  mode = 'success'; await find(tree, 'Hantar komen').props.onPress(); tree = render();
  assert.equal(find(tree, 'Tulis komen').props.value, ''); r.unmount();

  const dialog = load('components/news/GuestCommentLimitDialog.tsx', {
    '@/constants/theme': load('constants/theme.ts', { 'react-native': { Platform: { select: value => value.default } } }),
    'react/jsx-runtime': runtime, 'react-native': { ...native, Modal: 'Modal', ScrollView: 'Scroll' },
    '@expo/vector-icons': { Ionicons: 'Icon' }, 'heroui-native/button': { Button: 'Button' },
    'react-native-safe-area-context': { useSafeAreaInsets: () => ({ top: 12, bottom: 24 }) },
  });
  for (const theme of [themes.light, themes.dark]) {
    let dismiss = 0, login = 0;
    const modal = dialog.GuestCommentLimitDialog({ visible: true, theme, onClose: () => dismiss++, onLogin: () => login++ });
    assert.equal(modal.type, 'Modal'); assert.equal(modal.props.animationType, 'fade');
    assert.ok(nodes(modal).some(node => node.props?.style?.some?.(style => style.backgroundColor === theme.card)));
    const buttons = nodes(modal).filter(node => node.type === 'Button');
    buttons[0].props.onPress(); buttons[1].props.onPress(); buttons[2].props.onPress();
    assert.equal(dismiss, 2); assert.equal(login, 1);
  }
  console.log('Passed: persisted guest credential, shared News/Shorts submissions, challenge timing, error handling, quota dialog, retained draft/list, login return target, session changes, and light/dark dialog structure.');
})().catch(error => { console.error(error); process.exitCode = 1; });
