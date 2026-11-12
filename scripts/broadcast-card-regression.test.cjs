const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const calls = [];
const exportsObject = {};
const jsx = (type, props) => ({ type, props });
const mocks = {
  'react/jsx-runtime': { jsx, jsxs: jsx },
  'heroui-native/button': { Button: 'Button' },
  '@expo/vector-icons': { Ionicons: 'Icon' },
  'expo-router': { router: { push: value => calls.push(value) } },
  'react-native': { Text: 'Text', View: 'View', StyleSheet: { create: value => value, hairlineWidth: 0.5 } },
  '@/constants/theme': { Design: { radius: { card: 16 } } },
};
const code = ts.transpileModule(fs.readFileSync('components/news/AlertCard.tsx', 'utf8'), { compilerOptions: {
  module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX,
} }).outputText;
vm.runInNewContext(code, { exports: exportsObject, require: name => {
  assert.ok(name in mocks, name); return mocks[name];
} });
function nodes(tree) {
  if (Array.isArray(tree)) return tree.flatMap(nodes);
  if (!tree || typeof tree !== 'object') return [];
  return [tree, ...nodes(tree.props?.children)];
}
for (const dark of [false, true]) {
  const theme = { error: dark ? '#FF9999' : '#BC3232', emergencyBg: dark ? '#3D2020' : '#FEE8E8', primary: dark ? '#74D68A' : '#216E35', text: dark ? '#ECEDEE' : '#11181C' };
  for (const long of [false, true]) {
    const broadcast = { id: 'broadcast-7', title: long ? 'Pengumuman sistem '.repeat(30) : 'Amaran', message: long ? 'Maklumat penting untuk penduduk. '.repeat(50) : 'Jalan ditutup.' };
    const tree = exportsObject.AlertCard({ broadcast, theme });
    assert.equal(tree.props.style[1].backgroundColor, theme.emergencyBg);
    const texts = nodes(tree).filter(node => node.type === 'Text');
    assert.equal(texts[0].props.children, broadcast.title);
    assert.equal(texts[1].props.children, broadcast.message);
    assert.equal(texts[1].props.numberOfLines, 2);
    assert.equal(texts[1].props.ellipsizeMode, 'tail');
    const action = nodes(tree).find(node => node.type === 'Button');
    action.props.onPress();
    const route = calls.at(-1);
    assert.equal(route.pathname, '/(tabs)/notification/[id]');
    assert.equal(route.params.id, 'broadcast-7');
    assert.equal(route.params.message, broadcast.message, 'Details must receive the complete untruncated message');
    assert.equal(route.params.source, 'broadcast');
  }
}
console.log('Passed: short/long broadcast copy, two-line tail ellipsis, light/dark colors, and Lihat details navigation with full content.');
