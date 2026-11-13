const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

function load(file, mocks) {
  const exports = {};
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: {
    module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX,
  } }).outputText;
  vm.runInNewContext(code, { exports, Date, Intl, Set, require: name => {
    if (!(name in mocks)) throw Error(`Missing mock: ${name}`);
    return mocks[name];
  } });
  return exports;
}
const jsx = (type, props) => ({ type, props });
const runtime = { jsx, jsxs: jsx, Fragment: 'Fragment' };
const filters = load('utils/newsFilters.ts', { '@/constants/news': { NEWS_TIME_ZONE: 'Asia/Kuala_Lumpur' } });
function hooks() {
  const values = [];
  let cursor = 0;
  return { reset: () => { cursor = 0; }, react: {
    useState(initial) { const index = cursor++; if (!(index in values)) values[index] = typeof initial === 'function' ? initial() : initial;
      return [values[index], value => { values[index] = typeof value === 'function' ? value(values[index]) : value; }]; },
    useRef: value => ({ current: value }), useCallback: fn => fn,
  } };
}
function nodes(tree) {
  if (Array.isArray(tree)) return tree.flatMap(nodes);
  if (!tree || typeof tree !== 'object') return [];
  return [tree, ...nodes(tree.props?.children)];
}
const theme = new Proxy({}, { get: () => '#008000' });
const h = hooks();
const { NewsDateCalendar } = load('components/news/NewsDateCalendar.tsx', {
  '@/constants/theme': load('constants/theme.ts', { 'react-native': { Platform: { select: value => value.default } } }),
  react: h.react, 'react/jsx-runtime': runtime,
  'react-native': { Text: 'Text', View: 'View', StyleSheet: { create: value => value } },
  '@gorhom/bottom-sheet': { BottomSheetScrollView: 'BottomSheetScrollView' },
  'heroui-native/button': { Button: 'Button' }, '@expo/vector-icons': { Ionicons: 'Icon' },
  '@/utils/newsFilters': filters,
});
let confirmed, cancelled = false;
const render = () => { h.reset(); return NewsDateCalendar({ date: 'custom:2026-10-01:2026-10-15', theme,
  onCancel: () => { cancelled = true; }, onConfirm: value => { confirmed = value; } }); };
const button = (tree, label) => nodes(tree).find(node => node.type === 'Button' &&
  (node.props.accessibilityLabel === label || nodes(node.props.children).some(child => child.type === 'Text' && child.props.children === label)));
let tree = render();
button(tree, 'Satu tarikh').props.onPress(); tree = render();
assert.equal(button(tree, 'Sahkan').props.isDisabled, true);
button(tree, '2026-10-05').props.onPress(); tree = render();
button(tree, 'Sahkan').props.onPress();
assert.equal(confirmed, 'custom:2026-10-05:2026-10-05');
button(tree, 'Julat tarikh').props.onPress(); tree = render();
button(tree, '2026-10-15').props.onPress(); tree = render();
button(tree, '2026-10-01').props.onPress(); tree = render();
assert.equal(button(tree, 'Sahkan').props.isDisabled, true, 'Earlier second date starts a new range');
button(tree, '2026-10-15').props.onPress(); tree = render();
button(tree, 'Sahkan').props.onPress();
assert.equal(confirmed, 'custom:2026-10-01:2026-10-15');
button(tree, 'Batal').props.onPress();
assert.equal(cancelled, true);

// Render homepage handlers without mounting native views or making network requests.
const homeHooks = hooks();
let category = 'Pendidikan';
const sharedMocks = {
  react: homeHooks.react, 'react/jsx-runtime': runtime,
  'react-native': { Platform: { OS: 'ios' }, StyleSheet: { create: v => v } },
  'expo-router': { router: { push: () => {} }, useFocusEffect: () => {} },
  'react-native-safe-area-context': { useSafeAreaInsets: () => ({ top: 0 }) },
  '@/hooks/useAppTheme': { useAppTheme: () => theme }, '@/services/api': {},
  '../../../constants/theme': { Design: {} }, '../../../hooks/use-color-scheme': { useColorScheme: () => 'light' },
  '../../../hooks/useNews': { useNews: () => ({ categories: ['Semua', 'Pendidikan'], activeCategory: category,
    setActiveCategory: value => { category = value; }, search: '', listNews: [], handleRefresh: () => {} }) },
  '@/utils/broadcasts': {}, '@/utils/newsFilters': filters,
};
for (const name of ['AlertCard', 'CategoryPills', 'FeaturedCard', 'NewsList', 'SearchBar']) sharedMocks[`../../../components/news/${name}`] = { [name]: name };
sharedMocks['@/components/news/NewsFilterSheet'] = { NewsFilterSheet: 'NewsFilterSheet' };
const Home = load('app/(tabs)/news_content/index.tsx', sharedMocks).default;
const home = () => { homeHooks.reset(); return Home(); };
const component = (tree, type) => nodes(tree).find(node => node.type === type).props;
let page = home();
component(page, 'SearchBar').onCalendarPress(); page = home();
component(page, 'NewsFilterSheet').onDate('custom:2026-10-01:2026-10-15'); page = home();
component(page, 'NewsFilterSheet').onApply(); page = home();
assert.equal(component(page, 'NewsFilterSheet').visible, false);
assert.equal(component(page, 'CategoryPills').dateFilter, 'custom:2026-10-01:2026-10-15');
// A retained stack screen rerenders on return without resetting its hook state.
page = home();
assert.equal(component(page, 'CategoryPills').dateFilter, 'custom:2026-10-01:2026-10-15');
component(page, 'CategoryPills').onClearDate(); page = home();
assert.equal(component(page, 'CategoryPills').dateFilter, 'all');
assert.equal(component(page, 'CategoryPills').activeCategory, 'Pendidikan');
console.log('Passed: calendar single/range selection, incomplete range prevention, cancel, homepage apply/close, retained screen state, and date-only clearing.');
