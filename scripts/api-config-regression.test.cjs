/* global __dirname */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const code = ts.transpileModule(fs.readFileSync(path.join(__dirname, '../services/apiConfig.ts'), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, esModuleInterop: true },
}).outputText;
function resolve({ host, legacyHost, configured, legacy, platform = 'android', dev = true, browserHost, bundleUrl, linkingUrl } = {}) {
  const exports = {};
  const logs = [];
  vm.runInNewContext(code, { exports, URL, __DEV__: dev,
    process: { env: { EXPO_PUBLIC_API_BASE_URL: configured, EXPO_PUBLIC_API_URL: legacy } },
    console: { info: (...args) => logs.push(args) },
    ...(browserHost ? { window: { location: { hostname: browserHost } } } : {}),
    require: name => name === 'expo-constants'
      ? { default: { expoConfig: { hostUri: host }, expoGoConfig: { debuggerHost: legacyHost } }, __esModule: true }
      : name === 'expo-linking' ? { createURL: () => linkingUrl }
      : { Platform: { OS: platform }, NativeModules: { SourceCode: { scriptURL: bundleUrl } } },
  });
  return { ...exports, logs };
}
test('current Expo LAN host wins over stale local overrides on native and web', () => {
  for (const platform of ['android', 'ios', 'web']) {
    const result = resolve({ host: '192.168.68.54:8081', configured: 'http://192.168.1.9:8088/api', platform });
    assert.equal(result.API_BASE_URL, 'http://192.168.68.54:8088/api');
    assert.equal(result.BACKEND_BASE_URL, 'http://192.168.68.54:8088');
    assert.equal(result.logs.length, 1);
  }
  assert.equal(resolve({ host: '10.1.2.3:8081', legacy: 'http://localhost:8000/api' }).API_BASE_URL,
    'http://10.1.2.3:8088/api');
});

test('actual bundle and Expo linking origins override stale manifest metadata after Wi-Fi changes', () => {
  assert.equal(resolve({ bundleUrl: 'http://192.168.7.12:8082/index.bundle', host: '192.168.1.9:8081' }).API_BASE_URL,
    'http://192.168.7.12:8088/api');
  assert.equal(resolve({ linkingUrl: 'exp://192.168.7.12:8082/--/', host: '192.168.1.9:8081' }).API_BASE_URL,
    'http://192.168.7.12:8088/api');
});
test('explicit deployed URLs remain supported in development and production', () => {
  assert.equal(resolve({ host: '192.168.1.3:8081', configured: 'https://example.com/api/' }).API_BASE_URL, 'https://example.com/api');
  const result = resolve({ dev: false, configured: 'http://192.168.1.4:8088/api/' });
  assert.equal(result.API_BASE_URL, 'http://192.168.1.4:8088/api');
  assert.equal(result.logs.length, 0);
});
test('metadata, browser, simulator and malformed/tunnel fallbacks', () => {
  assert.equal(resolve({ legacyHost: '192.168.2.5:8081' }).API_BASE_URL, 'http://192.168.2.5:8088/api');
  assert.equal(resolve({ host: 'localhost:8081' }).API_BASE_URL, 'http://10.0.2.2:8088/api');
  assert.equal(resolve({ host: 'https://demo.exp.direct', platform: 'ios' }).API_BASE_URL, 'http://localhost:8088/api');
  assert.equal(resolve({ host: 'http://[bad', configured: 'not a URL' }).API_BASE_URL, 'http://10.0.2.2:8088/api');
  assert.equal(resolve({ platform: 'web', browserHost: '192.168.2.8' }).API_BASE_URL, 'http://192.168.2.8:8088/api');
});
