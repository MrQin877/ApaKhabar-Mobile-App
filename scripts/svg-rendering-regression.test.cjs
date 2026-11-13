const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const crypto = require('node:crypto');
function load(file, mocks) {
  const exports = {};
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText;
  vm.runInNewContext(code, { exports, console, require: name => { assert.ok(name in mocks, name); return mocks[name]; } });
  return exports;
}
const source = fs.readFileSync('assets/images/ApaKhabar IP Mascot(1).svg');
const png = fs.readFileSync('assets/images/apakhabar-mascot.png');
const hash = value => crypto.createHash('sha256').update(value).digest('hex');
// These fingerprints tie the lossless fallback to the inspected original.
assert.equal(hash(source), '842e13c9f754d7fe7d30779e5f5e3b95c036d116227ef9682f40e60e679e1385');
assert.equal(hash(png), '81220901e55b08c4370d8d888ff54cdbaa2dc7ce196e36d6471e9615d2482876');
assert.equal(png.subarray(0, 8).toString('hex'), '89504e470d0a1a0a');
assert.equal(png.readUInt32BE(16), 1254); assert.equal(png.readUInt32BE(20), 1254);
assert.equal(png[25], 6, 'Use an RGBA PNG, not an opaque image');
const elements = new Proxy({}, { get: (_, key) => key });
const { tags } = load('node_modules/react-native-svg/src/xmlTags.ts', { './elements': elements });
const jsx = (type, props) => ({ type, props });
const xmlModule = load('node_modules/react-native-svg/src/xml.tsx', {
  react: require('react'), 'react/jsx-runtime': { jsx, jsxs: jsx }, './xmlTags': { tags }, './utils/fetchData': {},
});
const parsed = xmlModule.parse(source.toString());
function nodes(tree) {
  if (Array.isArray(tree)) return tree.flatMap(nodes);
  if (!tree || typeof tree !== 'object') return [];
  return [tree, ...nodes(tree.children || tree.props?.children)];
}
assert.equal(parsed.props.viewBox, '0 0 940.5 940.499971');
const all = nodes(parsed);
assert.equal(all.filter(n => n.type === 'Filter').length, 2);
assert.equal(all.filter(n => n.type === 'FeColorMatrix').length, 2);
assert.equal(all.filter(n => n.type === 'Mask').length, 1);
assert.equal(all.filter(n => n.type === 'Image').length, 2);
for (const scheme of ['light', 'dark']) for (const [width, height] of [[320, 568], [390, 844], [844, 390]]) {
  const Welcome = load('app/(auth)/welcome.tsx', {
    react: require('react'), 'react/jsx-runtime': { jsx, jsxs: jsx },
    'react-native': { Image: 'Image', ScrollView: 'Scroll', StatusBar: 'StatusBar', View: 'View', useWindowDimensions: () => ({ width, height }) },
    'react-native-safe-area-context': { useSafeAreaInsets: () => ({ top: 24, bottom: 12 }) },
    '../../components/auth/WelcomeActions': { WelcomeActions: 'Actions' }, '../../components/auth/WelcomeHeader': { WelcomeHeader: 'Header' },
    '../../constants/theme': { getTheme: () => ({ background: scheme === 'dark' ? '#151718' : '#ffffff' }) },
    '../../hooks/use-color-scheme': { useColorScheme: () => scheme }, '../../hooks/useWelcomeAnimations': { useWelcomeAnimations: () => ({}) },
    '../../styles/welcome': { welcomeStyles: {} }, '../../assets/images/apakhabar-mascot.png': 1,
  }).default;
  const tree = Welcome(), image = nodes(tree).find(n => n.type === 'Image');
  assert.equal(image.props.source, 1); assert.equal(image.props.resizeMode, 'contain');
  assert.ok(image.props.style.width >= 200 && image.props.style.width <= width - 40);
  assert.equal(image.props.style.width, image.props.style.height);
  assert.equal(image.props.style.tintColor, undefined, 'Keep original artwork colors in both themes');
  const container = nodes(tree).find(n => n.props?.pointerEvents === 'none');
  assert.equal(container.props.children.length, 2, 'Keep both diagonal stripes behind the content');
  assert.ok(nodes(tree).some(n => n.type === 'Actions')); assert.ok(nodes(tree).some(n => n.type === 'Header'));
}
console.log('Passed: original asset provenance, RGBA fallback dimensions, actual SVG structure, light/dark responsive sizing, contain mode, unchanged colors, stripes/header/actions.');
