const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
function load(file, mocks, globals = {}) {
  const exports = {};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true } }).outputText,
    { exports, console, __DEV__: false, require: name => { assert.ok(name in mocks, name); return mocks[name]; }, ...globals });
  return exports;
}
const jsx = (type, props) => ({ type, props });
const runtime = { jsx, jsxs: jsx, Fragment: 'Fragment' };
const nodes = tree => Array.isArray(tree) ? tree.flatMap(nodes) : tree && typeof tree === 'object' ? [tree, ...nodes(tree.props?.children)] : [];
const texts = tree => nodes(tree).filter(n => n.type === 'Text' || n.type === 'FormError').map(n => n.props.message || n.props.children);
const get = (tree, type) => nodes(tree).find(n => n.type === type);
const button = (tree, title) => nodes(tree).find(n => n.props?.title === title || n.type === 'Button' && texts(n).includes(title));
const flush = async () => { for (let i = 0; i < 20; i++) await Promise.resolve(); };
const deferred = () => { let resolve, reject; const promise = new Promise((yes, no) => { resolve = yes; reject = no; }); return { promise, resolve, reject }; };
function hooks() {
  let cursor = 0; const values = [], effects = [], deps = [];
  return { react: {
    useState(initial) { const i = cursor++; if (!(i in values)) values[i] = typeof initial === 'function' ? initial() : initial; return [values[i], next => { values[i] = typeof next === 'function' ? next(values[i]) : next; }]; },
    useRef(initial) { const i = cursor++; return values[i] ||= { current: initial }; },
    useCallback: fn => fn,
    useEffect(fn, next) { const i = cursor++; if (!deps[i] || next.some((v, j) => v !== deps[i][j])) { deps[i] = next; effects.push(fn); } },
  }, render(fn) { cursor = 0; const tree = fn(); effects.splice(0).forEach(fn => fn()); return tree; } };
}
const native = { ActivityIndicator: 'Loading', StatusBar: 'StatusBar', ScrollView: 'Scroll', Text: 'Text', TextInput: 'Input', View: 'View', StyleSheet: { create: value => value, hairlineWidth: 1 }, Platform: { OS: 'android' }, AppState: { addEventListener: () => ({ remove() {} }) }, Alert: { alert() {} } };
const theme = { primary: '#216E35', background: '#fff', text: '#11181C', secondary: '#68716C', border: '#E3E8E5', communityBg: '#E8F8EC', emergencyBg: '#FEE8E8', accent: '#F0F3F1', error: '#BC3232' };
const shared = { '@/components/ui/FormError': { FormError: 'FormError' }, 'react/jsx-runtime': runtime, 'react-native': native, '@expo/vector-icons': { Ionicons: 'Icon' }, 'heroui-native/button': { Button: 'Button' }, 'react-native-safe-area-context': { useSafeAreaInsets: () => ({ top: 24, bottom: 12, left: 0, right: 0 }) }, '../components/KeyboardForm': { KeyboardForm: 'Form' }, '../components/auth/AuthButton': { AuthButton: 'AuthButton' }, '../constants/theme': { Design: { contentWidth: 680 }, getTheme: () => theme }, '../hooks/use-color-scheme': { useColorScheme: () => 'light' } };
const status = { phone: '+6012344589', phone_verified_at: null, otp_pending: true, retry_after: 60, daily_limit_reached: false, daily_reset_after: 300 };
function phoneSetup({ initial = status, params = {}, post } = {}) {
  const h = hooks(), calls = [], routes = []; let focus, timer, now = 1000000, profileCalls = 0, getCalls = 0;
  const service = load('services/phoneVerification.ts', { axios: { isAxiosError: e => !!e.response }, './api': { get: async (url, config) => { calls.push({ url, config }); getCalls++; return { data: initial }; }, post: async (url, payload) => { calls.push({ url, payload }); return { data: await post(url, payload) }; } } });
  const resetService = load('services/phonePasswordReset.ts', { './api': { get: async url => { calls.push({ url }); return { data: initial }; }, post: async (url, payload) => { calls.push({ url, payload }); return { data: await post(url, payload) }; } } });
  class Clock extends Date { static now() { return now; } }
  const module = load('app/verify-phone.tsx', { ...shared, react: h.react,
    '../utils/authNavigation': { authDestination: value => value || '/(tabs)/news_content' },
    '../services/phoneVerification': service, '../services/phonePasswordReset': resetService,
    '../services/authService': { getProfile: async () => { profileCalls++; } },
    '../components/auth/OtpCodeInput': { OtpCodeInput: 'OTP' },
    'expo-router': { useLocalSearchParams: () => params, useFocusEffect: fn => { focus = fn; }, router: { replace: value => routes.push(value), push: value => routes.push(value), canGoBack: () => true, back: () => routes.push('back') } },
  }, { Date: Clock, setInterval: fn => { timer = fn; return 1; }, clearInterval() {} });
  return { ...module, render: () => h.render(() => module.default()), start: async () => { focus(); await flush(); }, calls, routes, tick(seconds) { now += seconds * 1000; timer(); }, profileCalls: () => profileCalls, getCalls: () => getCalls };
}
async function main() {
  const task = deferred();
  const p = phoneSetup({ post: () => task.promise }); p.render(); await p.start();
  let page = p.render(); assert.equal(p.maskPhoneNumber(status.phone), '+60 12 •••• 4589');
  assert.ok(!texts(page).includes(status.phone)); assert.ok(!button(page, 'Teruskan ke Berita'));
  assert.equal(button(page, 'Hantar semula kod (60s)').props.isDisabled, true);
  get(page, 'OTP').props.onChange('12345'.split('')); page = p.render(); assert.equal(button(page, 'Sahkan nombor telefon').props.disabled, true);
  button(page, 'Sahkan nombor telefon').props.onPress(); assert.equal(p.calls.filter(c => c.payload).length, 0);
  get(page, 'OTP').props.onChange('123456'.split('')); page = p.render();
  button(page, 'Sahkan nombor telefon').props.onPress(); button(page, 'Sahkan nombor telefon').props.onPress();
  assert.equal(p.calls.filter(c => c.url === '/phone/verify').length, 1);
  const request = p.calls.find(c => c.url === '/phone/verify'); assert.equal(request.payload.phone, status.phone); assert.equal(request.payload.otp, '123456');
  assert.ok(!button(p.render(), 'Teruskan ke Berita'));
  task.resolve({ ...status, status: 'phone-verified', phone_verified_at: '2026-11-13T10:00:00Z' }); await flush();
  page = p.render(); assert.ok(texts(page).includes('Nombor telefon anda berjaya disahkan.')); assert.equal(p.profileCalls(), 1); assert.equal(p.routes.length, 0);
  button(page, 'Teruskan ke Berita').props.onPress(); assert.equal(p.routes.at(-1), '/(tabs)/news_content');
  for (const message of ['Kod OTP tidak sah.', 'Kod OTP tiada atau telah tamat tempoh. Sila minta semula.']) {
    const failed = phoneSetup({ post: async () => { throw { response: { status: 422, data: { message } } }; } }); failed.render(); await failed.start();
    get(failed.render(), 'OTP').props.onChange('654321'.split('')); button(failed.render(), 'Sahkan nombor telefon').props.onPress(); await flush();
    page = failed.render(); assert.ok(texts(page).includes(message)); assert.ok(!button(page, 'Teruskan ke Berita')); assert.equal(button(page, 'Sahkan nombor telefon').props.loading, false);
  }
  const unconfirmed = phoneSetup({ post: async () => ({ ...status }) }); unconfirmed.render(); await unconfirmed.start(); get(unconfirmed.render(), 'OTP').props.onChange('123456'.split(''));
  button(unconfirmed.render(), 'Sahkan nombor telefon').props.onPress(); await flush(); assert.ok(!button(unconfirmed.render(), 'Teruskan ke Berita'));
  const resend = phoneSetup({ post: async () => ({ ...status, status: 'otp-sent' }) }); resend.render(); await resend.start(); resend.tick(60);
  page = resend.render(); assert.equal(button(page, 'Hantar semula kod').props.isDisabled, false); button(page, 'Hantar semula kod').props.onPress(); await flush();
  assert.equal(resend.calls.filter(c => c.url === '/phone/verification-notification').length, 1); assert.ok(button(resend.render(), 'Hantar semula kod (60s)'));
  button(resend.render(), 'Ubah nombor telefon').props.onPress(); assert.equal(resend.routes.at(-1), '/(tabs)/profile/change-phone');
  button(resend.render(), 'Log masuk dengan e-mel').props.onPress(); assert.equal(resend.routes.at(-1).pathname, '/(auth)/login'); assert.equal(resend.routes.at(-1).params.method, 'email');
  const limited = phoneSetup({ initial: { ...status, retry_after: 0, daily_limit_reached: true } }); limited.render(); await limited.start();
  button(limited.render(), 'Hantar semula kod').props.onPress(); assert.equal(limited.calls.filter(c => c.payload).length, 0);
  const throttled = phoneSetup({ initial: { ...status, retry_after: 0 }, post: async () => { throw { response: { status: 429, data: { ...status, daily_limit_reached: true, message: 'Had dicapai' } } }; } });
  throttled.render(); await throttled.start(); button(throttled.render(), 'Hantar semula kod').props.onPress(); await flush();
  page = throttled.render(); assert.equal(button(page, 'Hantar semula kod (60s)').props.isDisabled, true);
  const changed = phoneSetup({ params: { challenge: 'existing-challenge' }, post: async () => ({ ...status, status: 'phone-verified', phone_verified_at: 'confirmed' }) });
  changed.render(); await changed.start(); get(changed.render(), 'OTP').props.onChange('123456'.split('')); button(changed.render(), 'Sahkan nombor telefon').props.onPress(); await flush();
  assert.equal(changed.calls.find(c => c.payload).url, '/phone/change-verification/verify'); assert.equal(changed.calls.find(c => c.payload).payload.challenge, 'existing-challenge');
  const reset = phoneSetup({ params: { purpose: 'password-reset', challenge: 'reset-challenge' }, post: async () => ({ ...status, reset_token: 'server-reset-token' }) });
  reset.render(); await reset.start(); get(reset.render(), 'OTP').props.onChange('123456'.split('')); button(reset.render(), 'Sahkan OTP').props.onPress(); await flush();
  assert.equal(reset.routes.at(-1).pathname, '/(auth)/reset-password'); assert.equal(reset.routes.at(-1).params.token, 'server-reset-token');

  // Real OTP input: paste/autofill, green focus, red error, numeric filtering.
  const h = hooks(); let digits = Array(6).fill('');
  const input = load('components/auth/OtpCodeInput.tsx', { react: h.react, 'react/jsx-runtime': runtime, 'react-native': native, '../../constants/theme': { getTheme: () => theme }, '../../hooks/use-color-scheme': { useColorScheme: () => 'light' } }).OtpCodeInput;
  const renderInput = extra => h.render(() => input({ value: digits, onChange: value => { digits = value; }, ...extra }));
  let fields = nodes(renderInput()).filter(n => n.type === 'Input'); assert.equal(fields.length, 6); assert.equal(fields[0].props.autoComplete, 'sms-otp'); assert.equal(fields[0].props.textContentType, 'oneTimeCode');
  fields[0].props.onFocus(); fields = nodes(renderInput()).filter(n => n.type === 'Input'); assert.equal(fields[0].props.style[1].borderColor, theme.primary);
  fields[0].props.onChangeText('12x3456'); assert.equal(digits.join(''), '123456');
  fields = nodes(renderInput({ hasError: true })).filter(n => n.type === 'Input'); assert.equal(fields[0].props.style[1].borderColor, theme.error);

  const loginHooks = hooks();
  const validators = load('utils/formValidation.ts', {});
  const LoginForm = load('components/auth/LoginForm.tsx', {
    react: loginHooks.react, 'react/jsx-runtime': runtime, 'react-native': native,
    'expo-router': { router: {} }, 'heroui-native/button': { Button: 'Button' }, '@expo/vector-icons': { Ionicons: 'Icon' },
    'react-native-safe-area-context': shared['react-native-safe-area-context'],
    '../../constants/theme': shared['../constants/theme'], '../../hooks/use-color-scheme': shared['../hooks/use-color-scheme'],
    '../../hooks/useAuth': { useAuth: () => ({ email: '', password: '', errors: {}, loading: false }) },
    '../KeyboardForm': { KeyboardForm: 'Form' }, './PasswordInput': { PasswordInput: 'Password' },
    '../ui/FormInput': { FormInput: 'FormInput' }, '../ui/FormError': { FormError: 'FormError' }, '../../utils/formValidation': validators,
  }).LoginForm;
  const emailLogin = loginHooks.render(() => LoginForm({ identifierType: 'email' }));
  const emailField = get(emailLogin, 'FormInput'); assert.equal(emailField.props.keyboardType, 'email-address'); assert.equal(emailField.props.autoFocus, true); assert.equal(emailField.props.accessibilityLabel, 'E-mel');

  // Existing email-link screen: no OTP, resend endpoint, duplicate lock, status refresh and original routing.
  const emailHooks = hooks(), emailTask = deferred(); let resendCalls = 0, refreshCalls = 0, emailRoute;
  const profile = { user: { email: 'reader@example.test', email_verified_at: null }, confirmed: true, loading: false, error: '', refresh: async () => { refreshCalls++; return profile.user; } };
  const emailService = load('services/emailVerification.ts', { axios: { isAxiosError: e => !!e.response }, './api': { post: async (url, payload) => { assert.equal(url, '/email/verification-notification'); assert.equal(Object.keys(payload).length, 0); resendCalls++; return { data: await emailTask.promise }; } } });
  const Email = load('app/verify-email.tsx', { ...shared, react: emailHooks.react,
    '../utils/authNavigation': { authDestination: value => value || '/(tabs)/news_content' }, '../components/profile/ApprovedBadge': { ApprovedBadge: 'Approved' },
    '../hooks/useVerifiedProfile': { useVerifiedProfile: () => profile }, '../services/emailVerification': emailService,
    '../services/authService': { hasPendingEmailRegistration: async () => true, completeEmailRegistration: async user => !!user.email_verified_at },
    'expo-router': { useLocalSearchParams: () => ({ returnTo: '/(tabs)/profile' }), router: { dismissTo: path => { emailRoute = path; } } },
  }).default;
  const renderEmail = () => emailHooks.render(Email); page = renderEmail(); await flush(); page = renderEmail();
  assert.ok(!get(page, 'OTP')); assert.equal(button(page, 'Kirim ulang email konfirmasi').props.variant, 'solid');
  button(page, 'Kirim ulang email konfirmasi').props.onPress(); button(page, 'Kirim ulang email konfirmasi').props.onPress(); assert.equal(resendCalls, 1);
  emailTask.resolve({ status: 'verification-link-sent', email: profile.user.email }); await flush(); assert.equal(refreshCalls, 1); assert.equal(emailRoute, undefined);
  button(renderEmail(), 'I have verified my email').props.onPress(); await flush(); assert.equal(emailRoute, undefined);
  profile.user = { ...profile.user, email_verified_at: 'confirmed-by-laravel' }; renderEmail(); await flush(); assert.equal(emailRoute, '/(tabs)/profile');
  console.log('Passed: phone masking, six digits, OTP submit/duplicate lock, incorrect/expired/unconfirmed responses, success/News action, resend/countdown/429/daily limits, phone change/reset contracts, email alternative, autofill/focus, and unchanged email-link resend/status/navigation.');
}
main().catch(error => { console.error(error); process.exitCode = 1; });
