const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const source = ts.transpileModule(fs.readFileSync('context/AppearanceContext.tsx', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true } }).outputText;
let saved = 'dark';
function mount({ delayed = false } = {}) {
  let cursor = 0, device = 'light', resolveRead;
  const values = [], effects = [], dependencies = [], themes = [];
  const react = {
    createContext: () => ({ Provider: 'Provider' }), useContext() {},
    useState: initial => { const i = cursor++; if (!(i in values)) values[i] = initial; return [values[i], next => { values[i] = next; }]; },
    useRef: initial => { const i = cursor++; return values[i] ||= { current: initial }; },
    useEffect: (fn, deps) => { const i = cursor++; if (!dependencies[i] || deps.some((v, j) => v !== dependencies[i][j])) { dependencies[i] = deps; effects.push(fn); } },
  };
  const exports = {};
  const mocks = {
    react, 'react/jsx-runtime': { jsx: (type, props) => ({ type, props }) },
    'react-native': { useColorScheme: () => device },
    '@react-native-async-storage/async-storage': { getItem: async () => delayed ? new Promise(resolve => { resolveRead = resolve; }) : saved, setItem: async (key, value) => { assert.equal(key, 'user_appearance'); saved = value; } },
    uniwind: { Uniwind: { setTheme: value => themes.push(value) } },
  };
  vm.runInNewContext(source, { exports, require: name => { assert.ok(name in mocks, name); return mocks[name]; } });
  return { render() { cursor = 0; const tree = exports.AppearanceProvider({ children: null }); effects.splice(0).forEach(fn => fn()); return tree.props.value; }, device(value) { device = value; }, resolve(value) { resolveRead(value); }, themes };
}
const flush = async () => { for (let i = 0; i < 15; i++) await Promise.resolve(); };
(async () => {
  let app = mount(); app.render(); await flush(); let state = app.render();
  assert.equal(state.appearance, 'dark'); assert.equal(state.colorScheme, 'dark');
  for (const mode of ['system', 'light', 'dark']) {
    state.setAppearance(mode); state = app.render();
    for (const device of ['dark', 'light']) { app.device(device); state = app.render(); assert.equal(state.colorScheme, mode === 'system' ? device : mode); }
    assert.equal(app.themes.at(-1), mode);
    await flush(); assert.equal(saved, mode);
    const reopened = mount(); reopened.render(); await flush(); assert.equal(reopened.render().appearance, mode);
  }
  state.setAppearance('light'); state.setAppearance('dark'); state.setAppearance('system'); await flush(); assert.equal(saved, 'system');
  app = mount({ delayed: true }); state = app.render(); state.setAppearance('light'); app.resolve('dark'); await flush(); assert.equal(app.render().appearance, 'light');
  console.log('Passed: immediate theme selection, live device changes, forced modes, Uniwind sync, restart restoration, ordered saves and startup selection race.');
})().catch(error => { console.error(error); process.exitCode = 1; });
