const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const jsx = (type, props) => ({ type, props });
const nodes = value => Array.isArray(value) ? value.flatMap(nodes) : value && typeof value === 'object' ? [value, ...nodes(value.props?.children)] : [];
const flush = async () => { for (let i = 0; i < 30; i++) await Promise.resolve(); };
function load(file, mocks = {}) {
  const exports = {};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText,
    { exports, Date, console, setInterval: () => 0, clearInterval() {}, require: name => { assert.ok(name in mocks, name); return mocks[name]; } });
  return exports;
}
function renderer() {
  let cursor = 0; const slots = [], effects = [];
  return { react: {
    forwardRef: fn => fn,
    useState(initial) { const i = cursor++; if (!(i in slots)) slots[i] = typeof initial === 'function' ? initial() : initial; return [slots[i], value => { slots[i] = typeof value === 'function' ? value(slots[i]) : value; }]; },
    useRef(initial) { const i = cursor++; return slots[i] ||= { current: initial }; },
    useMemo(fn, deps) { const i = cursor++; if (!slots[i] || deps.some((d, j) => d !== slots[i].deps[j])) slots[i] = { deps, value: fn() }; return slots[i].value; },
    useCallback(fn, deps) { const i = cursor++; if (!slots[i] || deps.some((d, j) => d !== slots[i].deps[j])) slots[i] = { deps, value: fn }; return slots[i].value; },
    useEffect(fn, deps) { const i = cursor++; if (!slots[i] || deps.some((d, j) => d !== slots[i].deps[j])) { slots[i] = { deps }; effects.push(fn); } },
  }, render(fn) { cursor = 0; const value = fn(); effects.splice(0).forEach(fn => fn()); return value; } };
}
const runtime = { jsx, jsxs: jsx, Fragment: 'Fragment' };
const native = { ActivityIndicator: 'Loading', Keyboard: { dismiss() {}, addListener: () => ({ remove() {} }) }, StyleSheet: { create: value => value }, Text: 'Text', View: 'View', RefreshControl: 'Refresh', useWindowDimensions: () => ({ height: 800 }) };
(async () => {
  for (const short of [false, true]) {
    const r = renderer(), writes = [];
    let fail = true;
    const comment = { id: '12', author: 'Warga lain', content: 'Komentar untuk ditinjau' };
    const initial = { comments: [comment], total: 1 };
    const write = async (...args) => { writes.push(args); if (fail) throw Error('offline'); return {}; };
    const news = { getNewsDetail: async () => ({ comments_list: [comment], comments_count: 1 }), reportNewsComment: write };
    const sheet = load('components/news/CommentsSheet.tsx', {
      react: r.react, 'react/jsx-runtime': runtime, 'react-native': native,
      '@/components/ui/FormError': { FormError: 'Error' }, 'heroui-native/input': { Input: 'Input' },
      'heroui-native/bottom-sheet': { BottomSheet: Object.assign('Sheet', { Portal: 'Portal', Overlay: 'Overlay', Content: 'Content', Title: 'Title' }) },
      'heroui-native/hooks': { useBottomSheetAwareHandlers: () => ({}) }, '@gorhom/bottom-sheet': { BottomSheetFlatList: 'List' },
      'heroui-native/button': { Button: 'Button' }, '@expo/vector-icons': { Ionicons: 'Icon' },
      'expo-router': { useRouter: () => ({ push() {} }) }, 'react-native-safe-area-context': { useSafeAreaInsets: () => ({ top: 0, bottom: 0 }) },
      '@/constants/theme': { Design: { contentWidth: 680 } }, '@/services/authService': { getToken: async () => 'villager-token', getUser: async () => ({ role: 'villager' }) },
      '@/services/sessionEvents': { subscribeSession: () => () => {} }, '@/services/newsService': news,
      '@/utils/newsComments': load('utils/newsComments.ts'), './CommentRow': { CommentRow: 'Row' },
      './CommentReportForm': { CommentReportForm: 'ReportForm' }, './GuestCommentLimitDialog': { GuestCommentLimitDialog: 'Dialog' },
    });
    const props = { newsId: '7', visible: true, initialSnapshot: initial, theme: {}, onClose() {}, onChange() {},
      ...(short ? { adapter: { load: async () => initial, report: write } } : {}) };
    const render = () => r.render(() => sheet.CommentsSheet(props));
    render(); await flush(); let tree = render();
    const row = nodes(tree).find(n => n.type === 'List').props.renderItem({ item: { comment, depth: 0 } });
    assert.equal(row.props.canReport, true, `${short ? 'Shorts' : 'News'} reports must be available to villagers`);
    row.props.onReport(comment); tree = render();
    let form = nodes(tree).find(n => n.type === 'ReportForm');
    assert.equal(form.props.content, comment.content);
    form.props.onCategory('Spam'); form.props.input.props.onChangeText('Pesan promosi.'); tree = render();
    form = nodes(tree).find(n => n.type === 'ReportForm'); form.props.onSubmit(); form.props.onSubmit(); await flush(); tree = render();
    assert.equal(writes.length, 1, 'Double taps submit once');
    assert.equal(writes[0][0], '12'); assert.equal(writes[0][1], 'Pesan promosi.');
    assert.equal(writes[0].at(-1), 'Spam'); if (short) assert.equal(writes[0][2], '7');
    form = nodes(tree).find(n => n.type === 'ReportForm');
    assert.equal(form.props.category, 'Spam'); assert.equal(form.props.input.props.value, 'Pesan promosi.'); assert.ok(form.props.error);
    fail = false; form.props.onSubmit(); await flush(); tree = render();
    assert.ok(!nodes(tree).some(n => n.type === 'ReportForm'));
    assert.equal(nodes(tree).find(n => n.type === 'List').props.data[0].comment.reported_by_user, true);
  }
  const r = renderer(); let category = '', submitted = 0;
  const form = load('components/news/CommentReportForm.tsx', { react: r.react, 'react/jsx-runtime': runtime,
    'react-native': native, '@gorhom/bottom-sheet': { BottomSheetScrollView: 'Scroll' }, 'heroui-native/button': { Button: 'Button' },
    '@expo/vector-icons': { Ionicons: 'Icon' }, '../ui/FormError': { FormError: 'Error' } });
  const render = () => r.render(() => form.CommentReportForm({ content: 'Komentar', author: 'Warga', category, onCategory: value => { category = value; }, input: null, error: '', busy: false, theme: {}, onSubmit: () => { submitted++; }, onCancel() {} }));
  let tree = render(); assert.equal(nodes(tree).find(n => n.props?.accessibilityLabel === 'Kirim laporan').props.isDisabled, true);
  nodes(tree).find(n => n.props?.accessibilityLabel === 'Pilih kategori laporan').props.onPress(); tree = render();
  assert.equal(nodes(tree).filter(n => n.props?.accessibilityRole === 'radio').length, 7);
  nodes(tree).find(n => n.props?.accessibilityLabel === 'Spam').props.onPress(); tree = render();
  const send = nodes(tree).find(n => n.props?.accessibilityLabel === 'Kirim laporan'); assert.equal(send.props.isDisabled, false); send.props.onPress(); assert.equal(submitted, 1);
  console.log('Passed: News/Shorts villager report availability, category and optional explanation, preview, duplicate protection, failure retention and reported status.');
})().catch(error => { console.error(error); process.exitCode = 1; });
