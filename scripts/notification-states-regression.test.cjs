const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
function load(file, mocks) {
  const exports = {};
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX } }).outputText;
  vm.runInNewContext(code, { exports, Date, Intl, console, require: name => { assert.ok(name in mocks, name); return mocks[name]; } });
  return exports;
}
const jsx = (type, props) => ({ type, props });
function nodes(tree) {
  if (Array.isArray(tree)) return tree.flatMap(nodes);
  return tree && typeof tree === 'object' ? [tree, ...nodes(tree.props?.children), ...nodes(tree.props?.ListHeaderComponent)] : [];
}
const component = (tree, type) => nodes(tree).find(node => node.type === type);
const hasState = (tree, kind) => nodes(tree).some(node => node.type === 'State' && node.props.kind === kind);
function hooks() {
  const values = []; let cursor = 0;
  return { reset: () => { cursor = 0; }, react: {
    useState(initial) { const index = cursor++; if (!(index in values)) values[index] = typeof initial === 'function' ? initial() : initial;
      return [values[index], value => { values[index] = typeof value === 'function' ? value(values[index]) : value; }]; },
    useRef(initial) { const index = cursor++; return values[index] ||= { current: initial }; },
    useCallback: fn => fn, useMemo: fn => fn(), useEffect: () => {},
  } };
}
function setup(actions = {}) {
  const h = hooks(); let focus, requests = 0, resolve, reject, readCalls = 0, allCalls = 0;
  const permission = { disabled: false, check: () => {}, open: () => {} };
  const Screen = load('app/(tabs)/notification/index.tsx', {
    react: h.react, 'react/jsx-runtime': { jsx, jsxs: jsx, Fragment: 'Fragment' },
    'react-native': { View: 'View', Text: 'Text', FlatList: 'List', ScrollView: 'Scroll', RefreshControl: 'Refresh', StyleSheet: { create: v => v } },
    'heroui-native/button': { Button: 'Button' },
    '@/components/notification/NotificationState': { NotificationSkeleton: 'Skeleton', NotificationState: 'State' },
    '@/components/notification': { NotifHeader: 'Header', NotifCard: 'Card' },
    '@/utils/notifications': { notificationDateLabel: () => 'Hari Ini', notificationInstructions: () => [] },
    '@/hooks/useNotificationPermission': { useNotificationPermission: () => permission },
    '@/hooks/use-color-scheme': { useColorScheme: () => 'light' },
    '@/constants/theme': { getTheme: () => ({}) },
    '@/context/NotificationContext': { useNotificationCount: () => ({ setUnreadCount: () => {}, showToast: () => {} }) },
    '@/services/notificationService': { getNotifications: () => { requests++; return new Promise((a, b) => { resolve = a; reject = b; }); }, markRead: async id => { readCalls++; await actions.read?.(id); }, markAllRead: async () => { allCalls++; await actions.all?.(); } },
    'expo-router': { useFocusEffect: callback => { focus = callback; } },
    'react-native-safe-area-context': { useSafeAreaInsets: () => ({ top: 0 }) },
  }).default;
  return { permission, render: () => { h.reset(); return Screen(); }, focus: () => focus(), resolve: value => resolve(value), reject: () => reject(Error('offline')), requests: () => requests, readCalls: () => readCalls, allCalls: () => allCalls };
}
const settle = async () => { await Promise.resolve(); await Promise.resolve(); };
async function main() {
  const s = setup(); let page = s.render();
  assert.ok(component(page, 'Header')); assert.ok(component(page, 'Skeleton'));
  s.focus(); s.focus(); assert.equal(s.requests(), 1, 'Deduplicate concurrent fetches');
  s.reject(); await settle(); page = s.render();
  assert.ok(hasState(page, 'error')); assert.ok(!hasState(page, 'empty'));
  nodes(page).find(n => n.type === 'State').props.onAction();
  assert.equal(s.requests(), 2); assert.ok(component(s.render(), 'Skeleton'));
  s.resolve([]); await settle(); page = s.render(); assert.ok(hasState(page, 'empty'));
  s.permission.disabled = true; page = s.render(); assert.ok(hasState(page, 'permission')); assert.ok(!hasState(page, 'error'));
  const refresh = component(page, 'Scroll').props.refreshControl;
  const task = refresh.props.onRefresh(); page = s.render();
  assert.ok(!component(page, 'Skeleton'), 'Pull to refresh an empty feed uses indicator');
  assert.equal(component(page, 'Scroll').props.refreshControl.props.refreshing, true);
  s.resolve([{ id: 'n1', type: 'darurat', title: 'Real API fixture', message: 'Content', is_read: false }]); await task;
  page = s.render(); assert.ok(component(page, 'List')); assert.ok(hasState(page, 'permission'), 'Permission never hides existing feed');
  let list = component(page, 'List'); const item = list.props.data.find(item => item.kind === 'notif');
  const card = list.props.renderItem({ item }); await card.props.onPress('n1'); assert.equal(s.readCalls(), 1);
  page = s.render(); assert.equal(component(page, 'List').props.data.find(item => item.kind === 'notif').data.read, true);
  const updating = component(page, 'List').props.refreshControl.props.onRefresh(); page = s.render();
  assert.ok(component(page, 'List')); assert.ok(!component(page, 'Skeleton'));
  assert.equal(component(page, 'List').props.refreshControl.props.refreshing, true);
  s.reject(); await updating; page = s.render();
  assert.ok(component(page, 'List'), 'Failed refresh retains cached data'); assert.ok(!hasState(page, 'error'));
  assert.equal(component(page, 'List').props.refreshControl.props.refreshing, false);
  assert.ok(nodes(page).some(n => n.props?.accessibilityRole === 'alert'));
  let server = ['a', 'b', 'c'].map(id => ({ id, title: id, is_read: false }));
  let confirmRead;
  const persisted = setup({ read: id => new Promise(resolve => { confirmRead = () => { server = server.map(n => n.id === id ? { ...n, is_read: true } : n); resolve(); }; }),
    all: async () => { server = server.map(n => ({ ...n, is_read: true })); } });
  const texts = tree => nodes(tree).filter(n => n.type === 'Text').map(n => n.props.children);
  persisted.render(); persisted.focus(); persisted.resolve(server); await settle();
  page = persisted.render(); assert.ok(texts(page).includes('3 belum dibaca'));
  assert.equal(persisted.readCalls(), 0, 'Rendering must never mark rows read');
  const first = component(page, 'List').props.data.find(n => n.kind === 'notif');
  const reading = component(page, 'List').props.renderItem({ item: first }).props.onPress('a');
  assert.ok(texts(persisted.render()).includes('3 belum dibaca'), 'Wait for API confirmation');
  confirmRead(); await reading; page = persisted.render(); assert.ok(texts(page).includes('2 belum dibaca'));
  const markAll = nodes(page).find(n => n.type === 'Button' && nodes(n).some(t => t.props?.children === 'Tandakan semua dibaca'));
  await markAll.props.onPress(); page = persisted.render();
  assert.ok(texts(page).includes('Semua sudah dibaca')); assert.ok(texts(page).includes('Selesai'));
  assert.equal(component(page, 'List').props.data.filter(n => n.kind === 'notif').length, 3);
  assert.equal(persisted.allCalls(), 1);
  const reload = component(page, 'List').props.refreshControl.props.onRefresh(); persisted.resolve(server); await reload;
  assert.ok(texts(persisted.render()).includes('Semua sudah dibaca'));
  const reopened = setup(); reopened.render(); reopened.focus(); reopened.resolve(server); await settle();
  assert.ok(texts(reopened.render()).includes('Semua sudah dibaca'), 'Fresh screen uses API-persisted read state');
  reopened.focus(); assert.equal(reopened.requests(), 2, 'Returning to screen revalidates Laravel state');
  reopened.resolve(server); await settle();
  let confirmNavigation, route;
  const cardHooks = hooks();
  const Card = load('components/notification/NotifCard.tsx', {
    react: cardHooks.react, 'react/jsx-runtime': { jsx, jsxs: jsx },
    'react-native': { Text: 'Text', View: 'View', TouchableOpacity: 'Touchable', StyleSheet: { create: v => v } },
    '@/components/ui/icon-symbol': { IconSymbol: 'Icon' }, '@/constants/theme': { getTheme: () => ({ primary: 'green' }) },
    '@/hooks/use-color-scheme': { useColorScheme: () => 'dark' }, 'expo-router': { useRouter: () => ({ push: value => { route = value; } }) },
  }).NotifCard;
  const notification = { id: 'a', type: 'emergency', title: 'Alert', message: 'Message', read: false };
  cardHooks.reset(); const unreadCard = Card({ item: notification, onPress: () => new Promise(resolve => { confirmNavigation = resolve; }) });
  assert.ok(nodes(unreadCard).some(n => n.props?.testID === 'notification-unread-indicator'));
  const opening = unreadCard.props.onPress(); assert.equal(route, undefined);
  confirmNavigation(true); await opening; assert.equal(route.params.read, 'true');
  assert.equal(route.pathname, '/(tabs)/notification/[id]');
  cardHooks.reset(); const readCard = Card({ item: { ...notification, read: true }, onPress: () => { throw Error('Already read'); } });
  assert.ok(!nodes(readCard).some(n => n.props?.testID === 'notification-unread-indicator'));
  await readCard.props.onPress();
  const permHooks = hooks(); let requested = 0, settings = 0, registered = 0;
  let permission = { granted: false, canAskAgain: true };
  const hookModule = load('hooks/useNotificationPermission.ts', {
    react: permHooks.react, 'react-native': { Platform: { OS: 'android' }, AppState: {}, Linking: { openSettings: async () => { settings++; } } },
    'expo-constants': { default: { executionEnvironment: 'standalone' } }, 'expo-device': { isDevice: true },
    'expo-notifications': { IosAuthorizationStatus: { PROVISIONAL: 3, EPHEMERAL: 4 }, getPermissionsAsync: async () => permission,
      requestPermissionsAsync: async () => { requested++; return permission = { granted: true, canAskAgain: true }; } },
    '@/services/pushToken': { registerPushToken: async () => { registered++; } },
  });
  const hook = () => { permHooks.reset(); return hookModule.useNotificationPermission(); };
  await hook().check(); assert.equal(hook().disabled, true);
  await hook().open(); assert.equal(requested, 1); assert.equal(registered, 1); assert.equal(hook().disabled, false);
  permission = { granted: false, canAskAgain: false }; await hook().check(); await hook().open(); assert.equal(settings, 1); assert.equal(requested, 1);
  assert.equal(hookModule.allowsPush({ granted: false, ios: { status: 3 } }), true);
  console.log('Passed: initial skeleton, API error, retry, successful empty result, permission separation, cached list during refresh/failure, read action, permission request/settings and iOS provisional permission.');
}
main().catch(error => { console.error(error); process.exitCode = 1; });
