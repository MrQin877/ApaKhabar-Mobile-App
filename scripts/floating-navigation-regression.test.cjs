const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const jsx = (type, props) => ({ type, props });
const nodes = tree => Array.isArray(tree) ? tree.flatMap(nodes) : tree && typeof tree === 'object' ? [tree, ...nodes(tree.props?.children)] : [];
const exportsFor = (file, mocks) => {
  const exports = {};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX } }).outputText, { exports, require: name => { assert.ok(name in mocks, name); return mocks[name]; } });
  return exports;
};
const themes = exportsFor('constants/theme.ts', { 'react-native': { Platform: { select: v => v.default } } });
let scheme = 'light', bottom = 0;
const native = { View: 'View', Text: 'Text', StyleSheet: { create: x => x, flatten: x => x, hairlineWidth: 1, absoluteFill: {} } };
const { FloatingTabBar, floatingTabBarSpace } = exportsFor('components/navigation/FloatingTabBar.tsx', {
  'react/jsx-runtime': { jsx, jsxs: jsx }, 'react-native': native, 'expo-blur': { BlurView: 'Blur' },
  '@expo/vector-icons': { Ionicons: 'Ionicon' }, 'heroui-native/pressable-feedback': { PressableFeedback: 'Tab' },
  'react-native-safe-area-context': { useSafeAreaInsets: () => ({ bottom, left: 0, right: 0 }) },
  '@/components/ui/icon-symbol': { IconSymbol: 'Icon' }, '@/hooks/useAppTheme': { useAppTheme: () => themes.Colors[scheme] },
  '@/hooks/use-color-scheme': { useColorScheme: () => scheme }, '@/constants/theme': themes,
});
const routes = ['news_content', 'video', 'notification', 'profile', 'index'].map(name => ({ name, key: name }));
const titles = ['Berita', 'Video', 'Notifikasi', 'Profil'];
for (scheme of ['light', 'dark']) for (bottom of [0, 24, 34]) for (let index = 0; index < 4; index++) {
  let prevented = false, event, target;
  const props = {
    blurTarget: { current: {} },
    state: { routes, index },
    descriptors: Object.fromEntries(routes.map((r, i) => [r.key, { options: { title: titles[i], tabBarBadge: i === 2 ? 5 : undefined } }])),
    emitter: { emit: value => { event = value; return { defaultPrevented: prevented }; } },
    navigateToTab: key => { target = key; },
  };
  const tree = FloatingTabBar(props), all = nodes(tree), tabs = all.filter(n => n.type === 'Tab');
  assert.equal(tabs.length, 4);
  assert.equal(tabs.filter(t => t.props.accessibilityState.selected).length, 1);
  assert.equal(tabs[index].props.accessibilityState.selected, true);
  const dark = scheme === 'dark' || index === 1;
  assert.equal(all.find(n => n.type === 'Blur').props.tint, dark ? 'dark' : 'light');
  assert.equal(all.find(n => n.type === 'Blur').props.blurTarget, props.blurTarget);
  assert.equal(all.find(n => n.type === 'Blur').props.blurMethod, 'dimezisBlurViewSdk31Plus');
  assert.ok(tree.props.style[1].height >= 92);
  assert.equal(tree.props.style[1].paddingBottom, Math.max(bottom, 12));
  assert.equal(Boolean(tree.props.style[2]), index === 1);
  assert.ok(tabs.every(t => t.props.style.minHeight >= 48));
  assert.ok(tabs[2].props.accessibilityLabel.includes('5 belum dibaca'));
  tabs[index].props.onPress(); assert.equal(target, undefined);
  const next = (index + 1) % 4;
  tabs[next].props.onPress(); assert.equal(target, routes[next].key); assert.equal(event.type, 'tabPress');
  target = undefined; prevented = true; tabs[next].props.onPress(); assert.equal(target, undefined);
  tabs[next].props.onLongPress(); assert.equal(event.type, 'tabLongPress');
  props.descriptors[routes[index].key].options.tabBarStyle = { display: 'none' };
  assert.equal(FloatingTabBar(props), null);
  assert.equal(floatingTabBarSpace(bottom), 72 + Math.max(bottom, 12) + 8);
}
const video = fs.readFileSync('app/(tabs)/video.tsx', 'utf8');
assert.ok(video.includes('bottom: navigationSpace + 16'));
assert.ok(video.includes('bottom: navigationSpace + 132'));
console.log('Passed: four tabs × light/dark × safe areas, active state, dark video surface, badge, accessible targets, tab events, hidden detail navigation and video clearance.');
