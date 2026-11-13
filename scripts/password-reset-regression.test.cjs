const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const { test } = require('node:test');
function load(file, mocks = {}, globals = {}) {
  const exports = {};
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022 } }).outputText;
  vm.runInNewContext(code, { exports, URL, ...globals, console: { log() {}, warn() {} }, require: name => { assert.ok(name in mocks, name); return mocks[name]; } });
  return exports;
}
const links = load('utils/passwordReset.ts');
const nativeIntent = load('app/+native-intent.tsx', { '@/utils/passwordReset': links });

test('cold and warm Expo Go and installed-app links preserve token and plus-addressed email exactly once', () => {
  const query = 'token=test-token&email=person%2Bmobile%40example.com';
  for (const initial of [true, false]) for (const prefix of [
    'exp://current-laptop.test:8082/--/', 'exps://current-laptop.test:8082/--/',
    'apakhabarmobileapp://', 'apakhabarmobileapp:///', '/', '/(auth)/',
  ]) {
    const path = nativeIntent.redirectSystemPath({ path: `${prefix}reset-password?${query}`, initial });
    assert.equal(path, `/reset-password?${query}`);
    const params = Object.fromEntries(new URL(path, 'https://app.invalid').searchParams);
    const parsed = links.resetParameters(params);
    assert.equal(parsed.token, 'test-token'); assert.equal(parsed.email, 'person+mobile@example.com'); assert.equal(parsed.valid, true);
  }
  assert.equal(links.resetLinkPath('apakhabarmobileapp:///verify-email?status=verified'), 'apakhabarmobileapp:///verify-email?status=verified');
  assert.match(links.resetLinkPath('/reset-password?token=a&token=b&email=a%40b.test'), /link_error=invalid/);
  for (const params of [{}, { token: ['a', 'b'], email: 'a@b.test' }, { token: 'a', email: ['a@b.test'] }, { token: 'a', email: 'invalid' }]) assert.equal(links.resetParameters(params).valid, false);
  assert.equal(links.resetParameters({ token: 'otp-token', challenge: 'otp-challenge', phone: '+60123456789' }).valid, true);
});

test('connection errors are distinct from expired tokens and field validation', () => {
  assert.match(links.passwordResetError(Error('Network Error')), /menghubungi pelayan/);
  assert.match(links.passwordResetError({ response: { status: 422, data: { code: 'invalid_or_expired_reset_token' } } }), /pautan baharu/);
  assert.match(links.passwordResetError({ response: { status: 429 } }), /Tunggu/);
  assert.match(links.passwordResetError({ response: { status: 500 } }), /Pelayan/);
  assert.equal(links.passwordResetError({ response: { status: 422, data: { errors: { password: ['Password rule from Laravel'] } } } }), 'Password rule from Laravel');
});

test('reset email request sends the active Expo URL and reset submits credentials only to the configured API', async () => {
  const requests = [];
  let currentReturnUrl = 'exp://first-laptop.test:8081/--/reset-password';
  const service = load('services/authService.ts', {
    './sessionEvents': {}, 'expo-secure-store': {}, 'react-native': { Platform: { OS: 'android' } }, './pushToken': {},
    'expo-linking': { createURL: (path, options) => { assert.equal(path, 'reset-password'); assert.equal(options.isTripleSlashed, true); return currentReturnUrl; } },
    './api': { post: async (path, body, config) => { requests.push({ path, body, config }); return { data: { message: 'Success' } }; } },
  });
  await service.forgotPassword(' person+mobile@example.com ');
  assert.equal(requests[0].body.return_url, currentReturnUrl); assert.equal(requests[0].body.email, 'person+mobile@example.com');
  currentReturnUrl = 'exp://second-laptop.test:8082/--/reset-password';
  await service.forgotPassword('person+mobile@example.com'); assert.equal(requests[1].body.return_url, currentReturnUrl);
  currentReturnUrl = 'apakhabarmobileapp:///reset-password';
  await service.forgotPassword('person+mobile@example.com'); assert.equal(requests[2].body.return_url, currentReturnUrl);
  currentReturnUrl = 'apakhabarmobileapp://dev-server.test:8081/reset-password';
  await service.forgotPassword('person+mobile@example.com'); assert.equal(requests[3].body.return_url, 'apakhabarmobileapp:///reset-password');
  await service.resetPassword('test-token', 'person+mobile@example.com', 'NewPassword123!', 'NewPassword123!');
  assert.equal(requests[4].path, '/reset-password'); assert.equal(requests[4].body.token, 'test-token'); assert.equal(requests[4].config.timeout, 20000);
});

function renderer() {
  let index = 0; const slots = [];
  return { react: {
    useState(initial) { const i = index++; if (!(i in slots)) slots[i] = initial; return [slots[i], next => { slots[i] = typeof next === 'function' ? next(slots[i]) : next; }]; },
    useRef(initial) { const i = index++; return slots[i] ||= { current: initial }; },
  }, render(fn) { index = 0; return fn(); } };
}
const jsx = (type, props) => ({ type, props });
const nodes = tree => Array.isArray(tree) ? tree.flatMap(nodes) : tree && typeof tree === 'object' ? [tree, ...nodes(tree.props?.children)] : [];

test('reset screen validates, submits once, retains fields on network failure, and navigates to login after success', async () => {
  const r = renderer(); let route, calls = 0, rejectReset, resolveReset;
  let params = { token: 'test-token', email: 'person+mobile@example.com', api_base_url: 'https://untrusted.example/api' };
  const validators = load('utils/formValidation.ts');
  const screen = load('app/(auth)/reset-password.tsx', {
    'heroui-native/button': { Button: 'Button' },
    react: r.react, 'react/jsx-runtime': { jsx, jsxs: jsx },
    '@/utils/formValidation': validators, '@/components/ui/FormError': { FormError: 'Error' }, '@/utils/passwordReset': links,
    '../../services/phonePasswordReset': {}, '../../components/KeyboardForm': { KeyboardForm: 'Form' },
    '@expo/vector-icons': { Ionicons: 'Icon' }, 'expo-router': { useLocalSearchParams: () => params, router: { replace: value => { route = value; }, back() {} } },
    'react-native': { StatusBar: 'Status', Text: 'Text', TouchableOpacity: 'Button', View: 'View', StyleSheet: { create: value => value } },
    'react-native-safe-area-context': { useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }) },
    '../../components/auth/AuthButton': { AuthButton: 'Submit' }, '../../components/auth/PasswordInput': { PasswordInput: 'Input' },
    '../../constants/theme': { Design: { contentWidth: 680 }, getTheme: () => ({ primary: '#216E35' }) }, '../../hooks/use-color-scheme': { useColorScheme: () => 'light' },
    '../../services/authService': { resetPassword: (...args) => { calls++; assert.equal(args.length, 4); assert.equal(args[0], 'test-token'); assert.equal(args[1], 'person+mobile@example.com'); return new Promise((resolve, reject) => { resolveReset = resolve; rejectReset = reject; }); } },
  });
  const render = () => r.render(() => screen.default());
  let tree = render();
  assert.equal(nodes(tree).find(node => node.type === 'Submit').props.variant, 'solid');
  const inputs = nodes(tree).filter(node => node.type === 'Input');
  inputs[0].props.onChangeText('NewPassword123!'); inputs[1].props.onChangeText('different'); tree = render();
  await nodes(tree).find(node => node.type === 'Submit').props.onPress(); assert.equal(calls, 0);
  nodes(tree).filter(node => node.type === 'Input')[1].props.onChangeText('NewPassword123!'); tree = render();
  const press = nodes(tree).find(node => node.type === 'Submit').props.onPress;
  const first = press(); await press(); assert.equal(calls, 1);
  rejectReset(Error('Offline')); await first; tree = render();
  assert.match(nodes(tree).find(node => node.type === 'Error').props.message, /menghubungi pelayan/);
  assert.equal(nodes(tree).filter(node => node.type === 'Input')[0].props.value, 'NewPassword123!');
  const retry = nodes(tree).find(node => node.type === 'Submit').props.onPress(); resolveReset({}); await retry;
  assert.equal(route.pathname, '/(auth)/login'); assert.match(route.params.successMessage, /berjaya/);
  params = { email: 'person+mobile@example.com' }; tree = render();
  assert.equal(nodes(tree).find(node => node.type === 'Submit').props.disabled, true);
  assert.match(nodes(tree).find(node => node.type === 'Error').props.message, /pautan baharu/);
});


test('forgot-password uses solid actions in both themes and preserves failure/success/resend countdowns and phone OTP navigation', async () => {
  const validators = load('utils/formValidation.ts');
  const colors = load('constants/theme.ts', { 'react-native': { Platform: { select: value => value.default } } }).Colors;
  function setup(scheme) {
    const r = renderer(), timers = new Map(); let timerId = 0, calls = 0, route;
    const emailRequests = [];
    const Screen = load('app/(auth)/forgot-password.tsx', {
      react: r.react, 'react/jsx-runtime': { jsx, jsxs: jsx }, 'heroui-native/button': { Button: 'Button' },
      '@/utils/formValidation': validators, '@/components/ui/FormInput': { FormInput: 'Input' }, '@/components/ui/FormError': { FormError: 'Error' }, '@/utils/passwordReset': links,
      '../../components/phone-number-input': { PhoneNumberInput: 'Phone' }, '../../components/ui/tabs': { Tabs: 'Tabs', TabsList: 'TabsList', TabsTrigger: 'Tab' },
      '../../components/KeyboardForm': { KeyboardForm: 'Form' }, '../../components/auth/AuthButton': { AuthButton: 'Submit' },
      '../../services/phonePasswordReset': { requestPhonePasswordReset: async value => { assert.equal(value, '+60123456789'); return { challenge: 'server-challenge' }; } },
      '../../services/phoneVerification': { phoneVerificationError: () => 'Phone error' },
      '../../services/authService': { forgotPassword: async value => { emailRequests.push(value); if (++calls === 1 || calls === 3) throw Error('Offline'); } },
      '@expo/vector-icons': { Ionicons: 'Icon' }, 'expo-router': { router: { push: value => { route = value; }, replace: value => { route = value; }, back() {} } },
      'react-native': { View: 'View', Text: 'Text', StatusBar: 'Status', StyleSheet: { create: value => value } },
      'react-native-safe-area-context': { useSafeAreaInsets: () => ({ top: 24, bottom: 16, left: 0, right: 0 }) },
      '../../constants/theme': { Design: { contentWidth: 680 }, getTheme: () => colors[scheme] }, '../../hooks/use-color-scheme': { useColorScheme: () => scheme },
    }, { setInterval: fn => { timers.set(++timerId, fn); return timerId; }, clearInterval: id => timers.delete(id) });
    return { render: () => r.render(Screen.default), tick() { for (let i = 0; i < 30; i++) [...timers.values()].forEach(fn => fn()); }, calls: () => calls, emailRequests, route: () => route };
  }
  for (const scheme of ['light', 'dark']) {
    const app = setup(scheme); let tree = app.render();
    const submit = () => nodes(app.render()).find(n => n.type === 'Submit');
    assert.equal(submit().props.variant, 'solid');
    assert.equal(tree.props.style[1].backgroundColor, colors[scheme].background);
    assert.equal(tree.props.contentContainerStyle[1].paddingBottom, 40);
    await submit().props.onPress(); assert.equal(app.calls(), 0); assert.ok(nodes(app.render()).find(n => n.type === 'Input').props.error);
    nodes(tree).find(n => n.type === 'Input').props.onChangeText('person+mobile@example.com');
    nodes(app.render()).find(n => n.type === 'Input').props.onFocus();
    assert.equal(nodes(app.render()).find(n => n.type === 'Input').props.style[1].borderColor, colors[scheme].primary);
    await submit().props.onPress(); tree = app.render(); assert.equal(app.calls(), 1);
    assert.equal(submit().props.disabled, true); assert.match(submit().props.title, /30s/);
    assert.match(nodes(tree).find(n => n.type === 'Error').props.message, /menghubungi pelayan/);
    app.tick(); assert.equal(submit().props.disabled, false);
    await submit().props.onPress(); tree = app.render(); assert.equal(app.calls(), 2);
    assert.ok(!nodes(tree).some(n => n.type === 'Input')); assert.equal(submit().props.variant, 'solid'); assert.match(submit().props.title, /30s/);
    await submit().props.onPress(); assert.equal(app.calls(), 2);
    app.tick(); await submit().props.onPress(); assert.equal(app.calls(), 3); assert.match(submit().props.title, /30s/);
    assert.match(nodes(app.render()).find(n => n.type === 'Error').props.message, /menghubungi pelayan/);
    assert.ok(app.emailRequests.every(value => value === 'person+mobile@example.com'));
    nodes(app.render()).find(n => n.type === 'Button').props.onPress(); assert.equal(app.route(), '/(auth)/login');
    const phone = setup(scheme); tree = phone.render(); nodes(tree).find(n => n.type === 'Tabs').props.onValueChange('phone');
    nodes(phone.render()).find(n => n.type === 'Phone').props.onChangeText('+60123456789');
    await nodes(phone.render()).find(n => n.type === 'Submit').props.onPress();
    assert.equal(phone.route().pathname, '/verify-phone'); assert.equal(phone.route().params.purpose, 'password-reset'); assert.equal(phone.route().params.challenge, 'server-challenge'); assert.equal(phone.calls(), 0);
  }
});
