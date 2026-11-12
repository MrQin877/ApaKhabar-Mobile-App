const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
function load(file, mocks) {
  const exports = {};
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText;
  vm.runInNewContext(code, { exports, console, require: name => { assert.ok(name in mocks, name); return mocks[name]; } });
  return exports;
}
const elements = new Proxy({}, { get: (_, key) => key });
const { tags } = load('node_modules/react-native-svg/src/xmlTags.ts', { './elements': elements });
const jsx = (type, props) => ({ type, props });
const xmlModule = load('node_modules/react-native-svg/src/xml.tsx', {
  react: require('react'), 'react/jsx-runtime': { jsx, jsxs: jsx }, './xmlTags': { tags }, './utils/fetchData': {},
});
const source = fs.readFileSync('assets/images/ApaKhabar IP Mascot(1).svg', 'utf8');
const parsed = xmlModule.parse(source);
assert.ok(parsed); assert.equal(parsed.props.viewBox, '0 0 940.5 940.499971');
function nodes(tree) {
  if (Array.isArray(tree)) return tree.flatMap(nodes);
  if (!tree || typeof tree !== 'object') return [];
  return [tree, ...nodes(tree.children || tree.props?.children)];
}
const all = nodes(parsed);
assert.equal(all.filter(n => n.type === 'Filter').length, 2);
assert.equal(all.filter(n => n.type === 'FeColorMatrix').length, 2);
assert.equal(all.filter(n => n.type === 'Mask').length, 2);
const images = all.filter(n => n.type === 'Image');
assert.equal(images.length, 3);
assert.ok(images.every(n => n.props.xlinkHref.startsWith('data:image/png;base64,')), 'Keep all original embedded artwork');
for (const scheme of ['light', 'dark']) for (const [width, height] of [[320, 568], [390, 844], [844, 390]]) {
  for (const assets of [[{ localUri: 'file:///mascot.svg', uri: 'https://metro/mascot.svg' }], [{ uri: 'https://metro/mascot.svg' }]]) {
    const Welcome = load('app/(auth)/welcome.tsx', {
      react: require('react'), 'react/jsx-runtime': { jsx, jsxs: jsx },
      'react-native': { ScrollView: 'Scroll', StatusBar: 'StatusBar', View: 'View', useWindowDimensions: () => ({ width, height }) },
      'expo-asset': { useAssets: () => [assets] }, 'react-native-svg': { SvgUri: 'SvgUri' },
      'react-native-safe-area-context': { useSafeAreaInsets: () => ({ top: 24, bottom: 12 }) },
      '../../components/auth/WelcomeActions': { WelcomeActions: 'Actions' }, '../../components/auth/WelcomeHeader': { WelcomeHeader: 'Header' },
      '../../constants/theme': { getTheme: () => ({ background: scheme === 'dark' ? '#151718' : '#ffffff' }) },
      '../../hooks/use-color-scheme': { useColorScheme: () => scheme }, '../../hooks/useWelcomeAnimations': { useWelcomeAnimations: () => ({}) },
      '../../styles/welcome': { welcomeStyles: {} }, '../../assets/images/ApaKhabar IP Mascot(1).svg': 1,
    }).default;
    const tree = Welcome(); const svg = nodes(tree).find(n => n.type === 'SvgUri');
    assert.equal(svg.props.uri, assets[0].localUri || assets[0].uri);
    assert.ok(svg.props.width > 0 && svg.props.width <= width - 40);
    assert.equal(svg.props.width, svg.props.height); assert.equal(svg.props.preserveAspectRatio, 'xMidYMid meet');
    assert.equal(svg.props.fill, undefined, 'Theme must not recolor original artwork');
    assert.ok(nodes(tree).some(n => n.type === 'Actions'));
  }
}
console.log('Passed: actual SVG parser retains all images/masks/filter effects; light/dark welcome dimensions, original colors, local/development asset resolution and existing actions.');
