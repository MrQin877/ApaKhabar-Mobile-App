const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
function load(file, mocks) {
  const exports = {};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true } }).outputText,
    { exports, console: { log() {}, warn() {} }, require: name => { if (name === '../utils/authNavigation') return load('utils/authNavigation.ts', {}); if (name === './sessionEvents') return { sessionChanged() {} }; assert.ok(name in mocks, name); return mocks[name]; } });
  return exports;
}
const jsx = (type, props) => ({ type, props });
function nodes(tree) { return Array.isArray(tree) ? tree.flatMap(nodes) : tree && typeof tree === 'object' ? [tree, ...nodes(tree.props?.children)] : []; }
const texts = tree => nodes(tree).filter(n => n.type === 'Text').map(n => n.props.children);
const button = (tree, title) => nodes(tree).find(n => n.type === 'Button' && texts(n).includes(title));
async function main() {
  const values = []; let cursor = 0, route, logoutCalls = 0, refreshing = 0, scheme = 'light', appearance = 'system', settings = 0, finishLogout, unreadCleared = 0, toastDismissed = 0;
  const profile = { user: { name: 'API User', email: 'api@example.test', phone: '12345', email_verified_at: '2026-01-01', phone_verified_at: null }, loading: false, confirmed: true, error: '', refresh: async () => { refreshing++; } };
  const theme = { background: '#fff', accent: '#F0F3F1', card: '#fff', text: '#11181C', primary: '#216E35', secondary: '#68716C', communityBg: '#E8F8EC' };
  const BottomSheet = Object.assign('Sheet', {});
  const Screen = load('app/(tabs)/profile/index.tsx', {
    '@/components/ui/FormError': { FormError: 'FormError' },
    '@/components/profile/ProfileAvatar': { ProfileAvatar: 'ProfileAvatar' },
    '@/components/profile/LogoutConfirmation': { LogoutConfirmation: 'LogoutConfirmation' },
    '@/components/profile/ProfileAvatar': { ProfileAvatar: 'ProfileAvatar' },
    react: { useState: initial => { const index = cursor++; if (!(index in values)) values[index] = initial; return [values[index], value => { values[index] = value; }]; }, useRef: initial => { const index = cursor++; return values[index] ||= { current: initial }; } },
    'react/jsx-runtime': { jsx, jsxs: jsx, Fragment: 'Fragment' },
    'react-native': { ActivityIndicator: 'Loading', ScrollView: 'Scroll', Text: 'Text', View: 'View', StatusBar: 'StatusBar', RefreshControl: 'Refresh', StyleSheet: { create: value => value }, Linking: { openSettings: async () => { settings++; } } },
    '@expo/vector-icons': { Ionicons: 'Icon' }, 'heroui-native/button': { Button: 'Button' },
    'heroui-native/bottom-sheet': { BottomSheet }, '@gorhom/bottom-sheet': { BottomSheetScrollView: 'SheetScroll' },
    'react-native-safe-area-context': { useSafeAreaInsets: () => ({ top: 20, bottom: 10 }) },
    'expo-router': { router: { push: path => { route = path; }, replace: path => { route = path; } } },
    '@/constants/theme': { Design: { contentWidth: 680 }, getTheme: () => theme },
    '@/hooks/use-color-scheme': { useColorScheme: () => scheme }, '@/hooks/useVerifiedProfile': { useVerifiedProfile: () => profile },
    '@/hooks/useNotificationPermission': { allowsPush: value => value.granted, useNotificationPermission: () => ({ supported: true, permission: { granted: true }, check() {}, open() {} }) },
    '@/context/AppearanceContext': { useAppearance: () => ({ appearance, setAppearance: value => { appearance = value; } }) },
    '@/context/NotificationContext': { useNotificationCount: () => ({ setUnreadCount: value => { assert.equal(value, 0); unreadCleared++; }, dismissToast: () => { toastDismissed++; } }) },
    '@/services/authService': { logout: async () => { logoutCalls++; await new Promise(resolve => { finishLogout = resolve; }); } },
  }).default;
  const render = () => { cursor = 0; return Screen(); };
  let page = render(); assert.ok(texts(page).includes('API User')); assert.ok(texts(page).includes('api@example.test'));
  assert.ok(texts(page).includes('Sahkan nombor telefon untuk melindungi akaun'));
  button(page, 'E-mel').props.onPress(); assert.equal(route, '/(tabs)/profile/change-email');
  button(page, 'Nombor telefon').props.onPress(); assert.equal(route, '/(tabs)/profile/change-phone');
  button(page, 'Kata laluan').props.onPress(); assert.equal(route, '/(tabs)/profile/change-password');
  button(page, 'Dasar privasi').props.onPress(); assert.equal(route, '/(tabs)/profile/data-privacy');
  button(page, 'Edit Foto Profil').props.onPress(); assert.equal(route, '/(tabs)/profile/edit-photo');
  profile.user.phone_verified_at = '2026-01-01'; page = render(); assert.ok(!texts(page).includes('Sahkan nombor telefon untuk melindungi akaun'));
  button(page, 'Penampilan').props.onPress(); assert.equal(route, '/(tabs)/profile/appearance');
  scheme = 'dark'; theme.background = '#151718'; theme.card = '#1C2420'; theme.text = '#ECEDEE'; page = render();
  assert.equal(page.props.style[1].backgroundColor, '#151718');
  assert.equal(nodes(page).find(n => n.type === 'StatusBar').props.barStyle, 'light-content');
  button(page, 'Notifikasi').props.onPress(); page = render(); await button(page, 'Buka tetapan').props.onPress(); assert.equal(settings, 1);
  await nodes(page).find(n => n.type === 'Scroll').props.refreshControl.props.onRefresh(); assert.equal(refreshing, 1);
  profile.loading = true; profile.user = null; assert.ok(nodes(render()).some(n => n.type === 'Loading'));
  profile.loading = false; profile.error = 'API unavailable'; page = render(); assert.ok(texts(page).includes('API unavailable'));
  await button(page, 'Cuba lagi').props.onPress(); assert.equal(refreshing, 2);
  button(page, 'Log keluar').props.onPress(); page = render();
  let confirmation = nodes(page).find(n => n.type === 'LogoutConfirmation');
  assert.equal(confirmation.props.visible, true); assert.equal(logoutCalls, 0);
  confirmation.props.onCancel(); page = render();
  assert.equal(nodes(page).find(n => n.type === 'LogoutConfirmation').props.visible, false); assert.equal(logoutCalls, 0);
  button(page, 'Log keluar').props.onPress(); page = render();
  confirmation = nodes(page).find(n => n.type === 'LogoutConfirmation');
  const pending = confirmation.props.onConfirm(); await confirmation.props.onConfirm();
  assert.equal(logoutCalls, 1, 'Repeated confirmation must not duplicate logout');
  confirmation = nodes(render()).find(n => n.type === 'LogoutConfirmation');
  assert.equal(confirmation.props.loading, true);
  confirmation.props.onCancel(); assert.equal(nodes(render()).find(n => n.type === 'LogoutConfirmation').props.visible, true);
  finishLogout(); await pending;
  assert.equal(route, '/(tabs)/profile'); assert.equal(unreadCleared, 1); assert.equal(toastDismissed, 1);
  assert.equal(nodes(render()).find(n => n.type === 'LogoutConfirmation').props.visible, false);
  for (const fail of [false, true]) {
    const deleted = [];
    const auth = load('services/authService.ts', {
      'expo-secure-store': { deleteItemAsync: async key => { deleted.push(key); } }, 'react-native': { Platform: { OS: 'android' } },
      './api': { post: async path => { assert.equal(path, '/logout'); if (fail) throw Error('offline'); } }, './pushToken': {},
    });
    await auth.logout(); assert.deepEqual(deleted, ['auth_token', 'user']);
  }
  console.log('Passed: profile navigation/settings, logout confirmation/cancellation, duplicate protection, loading state, notification cleanup, original logout routing and secure session deletion online/offline.');
}
main().catch(error => { console.error(error); process.exitCode = 1; });
