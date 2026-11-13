const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
function load(file, mocks) {
  const exports = {};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true } }).outputText,
    { exports, require: name => { assert.ok(name in mocks, name); return mocks[name]; } });
  return exports;
}
const jsx = (type, props) => ({ type, props });
const runtime = { jsx, jsxs: jsx };
const nodes = tree => Array.isArray(tree) ? tree.flatMap(nodes) : tree && typeof tree === 'object' ? [tree, ...nodes(tree.props?.children)] : [];
const get = (tree, type) => nodes(tree).find(n => n.type === type);
function hooks() {
  const slots = []; let cursor = 0;
  return { react: { useState(initial) { const i = cursor++; if (!(i in slots)) slots[i] = initial; return [slots[i], next => { slots[i] = typeof next === 'function' ? next(slots[i]) : next; }]; }, useRef(initial) { const i = cursor++; return slots[i] ||= { current: initial }; } }, render(fn) { cursor = 0; return fn(); } };
}
const themes = load('constants/theme.ts', { 'react-native': { Platform: { select: options => options.default } } });
const validators = load('utils/formValidation.ts', {});
function setup(scheme = 'light') {
  const h = hooks(); let resolve, reject, payload, calls = 0, route;
  const theme = themes.Colors[scheme];
  const Screen = load('app/(tabs)/profile/change-password.tsx', {
    react: h.react, 'react/jsx-runtime': runtime,
    'react-native': { View: 'View', Text: 'Text', StatusBar: 'StatusBar', StyleSheet: { create: value => value } },
    'expo-router': { router: { canGoBack: () => false, replace: value => { route = value; } } },
    '@expo/vector-icons': { Ionicons: 'Icon' }, 'heroui-native/button': { Button: 'Button' },
    'react-native-safe-area-context': { useSafeAreaInsets: () => ({ top: 24, bottom: 16, left: 0, right: 0 }) },
    '../../../components/KeyboardForm': { KeyboardForm: 'Form' }, '../../../components/auth/PasswordInput': { PasswordInput: 'Password' }, '../../../components/auth/AuthButton': { AuthButton: 'Submit' },
    '@/components/ui/FormError': { FormError: 'Error' }, '@/utils/formValidation': validators,
    '../../../constants/theme': { ...themes, getTheme: () => theme }, '../../../hooks/use-color-scheme': { useColorScheme: () => scheme },
    '../../../services/api': { post: (url, body) => { calls++; assert.equal(url, '/api/change-password'); payload = body; return new Promise((yes, no) => { resolve = yes; reject = no; }); } },
  }).default;
  return { render: () => h.render(Screen), theme, calls: () => calls, payload: () => payload, resolve: () => resolve({}), reject: value => reject(value), route: () => route };
}
function fill(app, current, password, confirmation) {
  const fields = nodes(app.render()).filter(n => n.type === 'Password');
  [current, password, confirmation].forEach((value, i) => fields[i].props.onChangeText(value));
}
(async () => {
  for (const scheme of ['light', 'dark']) {
    const app = setup(scheme); let page = app.render();
    assert.equal(page.props.style.backgroundColor, scheme === 'dark' ? app.theme.background : app.theme.accent);
    assert.equal(get(page, 'Submit').props.variant, 'solid');
    let fields = nodes(page).filter(n => n.type === 'Password');
    assert.deepEqual(fields.map(n => n.props.accessibilityLabel), ['Kata laluan semasa', 'Kata laluan baharu', 'Ulang kata laluan']);
    assert.ok(fields.every(n => n.props.style[1].backgroundColor === app.theme.card && n.props.style[0].height === 52));
    fields[0].props.onFocus(); assert.equal(nodes(app.render()).find(n => n.type === 'Password').props.style[1].borderColor, app.theme.primary);
    await get(app.render(), 'Submit').props.onPress(); assert.equal(app.calls(), 0); assert.ok(nodes(app.render()).filter(n => n.type === 'Password').every(n => n.props.error));
    for (const values of [['old-pass', 'short', 'short'], ['old-pass', 'new-password', 'mismatch'], ['same-pass', 'same-pass', 'same-pass']]) {
      fill(app, ...values); await get(app.render(), 'Submit').props.onPress(); assert.equal(app.calls(), 0);
    }
    fill(app, 'old-pass', 'abcdefgh', 'abcdefgh'); // Preserve the existing 8-character rule without imposing new complexity requirements.
    page = app.render(); const submit = get(page, 'Submit').props.onPress;
    const pending = submit(); await submit(); assert.equal(app.calls(), 1);
    assert.deepEqual(JSON.parse(JSON.stringify(app.payload())), { current_password: 'old-pass', password: 'abcdefgh', password_confirmation: 'abcdefgh' });
    page = app.render(); assert.equal(get(page, 'Submit').props.loading, true); assert.ok(nodes(page).filter(n => n.type === 'Password').every(n => n.props.editable === false));
    app.reject({ response: { data: { message: 'Validation failed', errors: { current_password: ['Kata laluan semasa salah.'] } } } }); await pending;
    page = app.render(); assert.equal(get(page, 'Error').props.message, 'Validation failed'); assert.equal(get(page, 'Password').props.error, 'Kata laluan semasa salah.');
    fill(app, 'correct-old', 'new-password', 'new-password'); const retry = get(app.render(), 'Submit').props.onPress(); assert.equal(app.calls(), 2); app.resolve(); await retry;
    page = app.render(); assert.ok(!get(page, 'Submit')); assert.ok(nodes(page).some(n => n.type === 'Text' && n.props.children === 'Kata Laluan Berjaya Ditukar!'));
    get(page, 'Button').props.onPress(); assert.equal(app.route(), '/(tabs)/profile');
  }
  // The shared eye button remains aligned with the input when inline errors expand its wrapper.
  const h = hooks();
  const Password = load('components/auth/PasswordInput.tsx', {
    react: h.react, 'react/jsx-runtime': runtime, '../ui/FormInput': { FormInput: 'Input' }, '@expo/vector-icons': { Ionicons: 'Icon' },
    'react-native': { View: 'View', TouchableOpacity: 'Toggle', StyleSheet: { create: value => value, flatten: value => value } },
    '../../constants/theme': { getTheme: () => themes.Colors.light }, '../../hooks/use-color-scheme': { useColorScheme: () => 'light' },
  }).PasswordInput;
  const render = () => h.render(() => Password({ style: { height: 52 }, error: 'Inline error', value: 'password' }));
  let page = render(); assert.equal(get(page, 'Toggle').props.style[1].height, 52); assert.equal(get(page, 'Input').props.secureTextEntry, true);
  get(page, 'Toggle').props.onPress(); page = render(); assert.equal(get(page, 'Input').props.secureTextEntry, false); assert.equal(get(page, 'Icon').props.name, 'eye-off-outline');
  console.log('Passed: light/dark layout, shared input sizing/focus, unchanged password rules and endpoint/payload, duplicate lock, loading, Laravel inline errors, retry, confirmed success/Profile navigation and aligned visibility toggle.');
})().catch(error => { console.error(error); process.exitCode = 1; });
