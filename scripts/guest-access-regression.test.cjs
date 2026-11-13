const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
function load(file, mocks = {}) {
  const exports = {};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true } }).outputText,
    { exports, console, require: name => { assert.ok(name in mocks, name); return mocks[name]; } });
  return exports;
}
const jsx = (type, props) => ({ type, props });
const runtime = { jsx, jsxs: jsx };
const nodes = tree => Array.isArray(tree) ? tree.flatMap(nodes) : tree && typeof tree === 'object' ? [tree, ...nodes(tree.props?.children)] : [];
const text = tree => nodes(tree).filter(n => n.type === 'Text').map(n => n.props.children);
const button = (tree, label) => nodes(tree).find(n => n.type === 'Button' && text(n).includes(label));
const navigation = load('utils/authNavigation.ts');
function hooks() {
  let cursor = 0;
  const values = [];
  return { react: { useCallback: fn => fn, useState: initial => { const i = cursor++; if (!(i in values)) values[i] = initial; return [values[i], next => { values[i] = typeof next === 'function' ? next(values[i]) : next; }]; }, useRef: initial => { const i = cursor++; return values[i] ||= { current: initial }; } }, render(fn) { cursor = 0; return fn(); } };
}
const flush = async () => { for (let i = 0; i < 10; i++) await Promise.resolve(); };
(async () => {
  for (const destination of ['/(tabs)/profile', '/(tabs)/notification']) assert.equal(navigation.authDestination(destination), destination);
  assert.equal(navigation.authDestination('https://outside.test'), '/(tabs)/news_content');
  const events = load('services/sessionEvents.ts');
  const renderer = hooks(); let onFocus, cleanup, route, token = null, scheme = 'light', pendingRead;
  const themes = load('constants/theme.ts', { 'react-native': { Platform: { select: options => options.default } } }).Colors;
  const screens = load('components/auth/GuestAccess.tsx', {
    react: renderer.react, 'react/jsx-runtime': runtime,
    'react-native': { ActivityIndicator: 'Loading', ScrollView: 'Scroll', StatusBar: 'StatusBar', Text: 'Text', View: 'View', StyleSheet: { create: value => value, hairlineWidth: 1 } },
    'expo-router': { router: { push: value => { route = value; } }, useFocusEffect: fn => { onFocus = fn; } },
    'heroui-native/button': { Button: 'Button' }, '@expo/vector-icons': { Ionicons: 'Icon' },
    'react-native-safe-area-context': { useSafeAreaInsets: () => ({ top: 20, bottom: 10, left: 0, right: 0 }) },
    '@/constants/theme': { Design: { contentWidth: 680 }, getTheme: () => themes[scheme] },
    '@/hooks/use-color-scheme': { useColorScheme: () => scheme },
    '@/services/authService': { getToken: () => pendingRead || Promise.resolve(token) },
    '@/services/sessionEvents': events,
  });
  for (const section of ['notification', 'profile']) {
    for (scheme of ['light', 'dark']) {
      const page = screens.GuestAccess({ section });
      assert.equal(page.props.style[1].backgroundColor, themes[scheme].background);
      assert.ok(text(page).includes(section === 'notification' ? 'Log masuk untuk melihat notifikasi' : 'Log masuk untuk mengakses profil'));
      button(page, 'Log masuk').props.onPress(); assert.equal(route.pathname, '/(auth)/login'); assert.equal(route.params.returnTo, `/(tabs)/${section}`);
      button(page, 'Daftar akaun').props.onPress(); assert.equal(route.pathname, '/(auth)/register'); assert.equal(route.params.returnTo, `/(tabs)/${section}`);
    }
  }
  const renderGate = () => renderer.render(() => screens.PrivateSection({ section: 'profile', children: 'PRIVATE' }));
  assert.ok(nodes(renderGate()).some(n => n.type === 'Loading')); cleanup = onFocus(); await flush();
  assert.equal(renderGate().type, screens.GuestAccess); // No private component or API mounted.
  token = 'account-a'; events.sessionChanged(); await flush(); assert.equal(renderGate().props.children, 'PRIVATE');
  token = null; events.sessionChanged(); await flush(); assert.equal(renderGate().type, screens.GuestAccess);
  cleanup(); assert.ok(nodes(renderGate()).some(n => n.type === 'Loading'));
  cleanup = onFocus(); await flush(); assert.equal(renderGate().type, screens.GuestAccess); // Cancel auth: same guest tab.
  let resolve; pendingRead = new Promise(yes => { resolve = yes; }); events.sessionChanged();
  pendingRead = null; token = null; events.sessionChanged(); await flush(); resolve('old-session'); await flush();
  assert.equal(renderGate().type, screens.GuestAccess); cleanup();
  for (const destination of [undefined, '/(tabs)/profile', '/(tabs)/notification', '/(tabs)/news_content/42?comments=open']) {
    const r = hooks(); let target, action;
    const auth = load('hooks/useAuth.ts', {
      react: r.react, 'react-native': { Platform: { OS: 'web' } },
      'expo-router': { router: { replace: value => { target = value; action = 'replace'; }, dismissTo: value => { target = value; action = 'dismiss'; } } },
      '../utils/authNavigation': navigation,
      '../constants/authData': { VALIDATION_RULES: { email: { pattern: /@/ }, password: { minLength: 8 } } },
      '../services/authService': { login: async () => {} },
    });
    const render = () => r.render(() => auth.useAuth(destination));
    let form = render(); form.setEmail('test@example.test'); form.setPassword('Password123');
    await render().login(); assert.equal(target, destination || '/(tabs)/news_content'); assert.equal(action, destination ? 'dismiss' : 'replace');
  }
  for (const destination of ['/(tabs)/profile', '/(tabs)/notification']) {
    let back = 0, replaced;
    const ui = {
      '../ui/FormInput': { FormInput: 'Input' }, '../ui/FormError': { FormError: 'FormError' },
      '../../utils/formValidation': load('utils/formValidation.ts', {}),
 react: { useState: value => [value, () => {}] }, 'react/jsx-runtime': runtime,
      'react-native': { ActivityIndicator: 'Loading', Text: 'Text', View: 'View', Modal: 'Modal', ScrollView: 'Scroll', TextInput: 'Input', StyleSheet: { create: value => value }, Keyboard: { dismiss() {} } },
      'expo-router': { router: { canGoBack: () => true, back: () => { back++; }, replace: value => { replaced = value; } } },
      'heroui-native/button': { Button: 'Button' }, '@expo/vector-icons': { Ionicons: 'Icon' },
      'react-native-safe-area-context': { useSafeAreaInsets: () => ({ bottom: 0 }) },
      '@/constants/theme': { Design: { contentWidth: 680 }, getTheme: () => themes.light },
      '../../constants/theme': { Design: { contentWidth: 680 }, getTheme: () => themes.light },
      '@/hooks/use-color-scheme': { useColorScheme: () => 'light' }, '../../hooks/use-color-scheme': { useColorScheme: () => 'light' },
      '../KeyboardForm': { KeyboardForm: 'Form' }, './PasswordInput': { PasswordInput: 'Input' },
      '../../hooks/useAuth': { useAuth: value => { assert.equal(value, destination); return { errors: {} }; } },
      '@/hooks/useRegistration': { useRegistration: value => { assert.equal(value, destination); return { fields: {}, errors: {}, step: 1, method: 'email' }; } },
      '../phone-number-input': {}, '../ui/tabs': {}, './BirthDatePicker': {},
    };
    let page = load('components/auth/LoginForm.tsx', ui).LoginForm({ returnTo: destination });
    button(page, 'Daftar').props.onPress(); assert.equal(replaced.pathname, '/(auth)/register'); assert.equal(replaced.params.returnTo, destination);
    nodes(page).find(n => n.props?.accessibilityLabel === 'Kembali').props.onPress(); assert.equal(back, 1);
    page = load('components/auth/RegisterForm.tsx', ui).RegisterForm({ returnTo: destination });
    button(page, 'Log masuk').props.onPress(); assert.equal(replaced.pathname, '/(auth)/login'); assert.equal(replaced.params.returnTo, destination);
    nodes(page).find(n => n.props?.accessibilityLabel === 'Kembali').props.onPress(); assert.equal(back, 2);
  }
  const storage = new Map([['auth_token', 'old-token'], ['user', 'private-cache']]);
  let resolveProfile;
  const authService = load('services/authService.ts', {
    './sessionEvents': events, './pushToken': {}, 'react-native': { Platform: { OS: 'android' } },
    'expo-secure-store': { getItemAsync: async key => storage.get(key) || null, setItemAsync: async (key, value) => storage.set(key, value), deleteItemAsync: async key => storage.delete(key) },
    './api': { get: () => new Promise(resolve => { resolveProfile = resolve; }), post: async () => { throw Error('offline'); } },
  });
  const profileRequest = authService.getProfile(); await flush(); await authService.logout();
  resolveProfile({ data: { name: 'Old account' } }); await assert.rejects(profileRequest, /Session changed/);
  assert.equal(storage.has('auth_token'), false); assert.equal(storage.has('user'), false);
  const calls = [];
  load('services/newsService.ts', { './newsLikes': { observeNewsLikes() {}, newsLikesVersion: () => ({}) }, './api': { get: async path => { calls.push(path); return { data: [] }; } }, './guestCommentService': {}, './newsFeedStore': {}, './apiConfig': { API_BASE_URL: 'local-test' } }).getNewsList();
  assert.equal(calls[0], '/news');
  console.log('Passed: guest light/dark UI, login/register destinations, fail-closed private gate, logout/account events, auth cancellation/refocus, stale session reads, login return/default navigation and public news API.');
})().catch(error => { console.error(error); process.exitCode = 1; });
