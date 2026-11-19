/* global __dirname */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');
const ts = require('typescript');

// Exercise the actual app modules with controlled network and native services.
function load(relative, dependencies) {
  const exports = {};
  const source = fs.readFileSync(path.join(__dirname, '..', relative), 'utf8');
  const code = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
  }).outputText;
  vm.runInNewContext(code, {
    exports, process: { env: {} }, console: { log() {}, warn() {}, error() {} },
    require(name) {
      if (name === '../utils/authNavigation') return load('utils/authNavigation.ts', {});
      if (name === './sessionEvents') return { sessionChanged() {} };
      if (!(name in dependencies)) throw Error('Unexpected dependency: ' + name);
      return dependencies[name];
    },
  });
  return exports;
}

function deferred() {
  let resolve, reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}

function hookRenderer() {
  const slots = [];
  const effects = [];
  let index = 0;
  return {
    react: {
      useState(initial) {
        const slot = index++;
        if (!(slot in slots)) slots[slot] = initial;
        return [slots[slot], value => { slots[slot] = typeof value === 'function' ? value(slots[slot]) : value; }];
      },
      useRef(initial) {
        const slot = index++;
        return slots[slot] ??= { current: initial };
      },
      useEffect(effect) {
        const slot = index++;
        if (!(slot in slots)) { slots[slot] = true; effects.push(effect); }
      },
    },
    render(component) { index = 0; return component(); },
    runEffects() { effects.splice(0).forEach(effect => effect()); },
  };
}

for (const action of ['login', 'register']) {
  test(action + ' submits once even before a rerender and stays locked during navigation', async () => {
    const renderer = hookRenderer();
    const request = deferred();
    let calls = 0;
    const navigations = [];
    const { useAuth } = load('hooks/useAuth.ts', {
      react: renderer.react,
      'react-native': { Platform: { OS: 'web' } },
      'expo-router': { router: { replace: route => navigations.push(route) } },
      '../constants/authData': { VALIDATION_RULES: { email: { pattern: /@/ }, password: { minLength: 8 } } },
      '../services/authService': {
        login: () => { calls++; return request.promise; },
        register: () => { calls++; return request.promise; },
      },
    });
    let form = renderer.render(useAuth);
    form.setName('Test User');
    form.setEmail('test@example.com');
    form.setPassword('Password123!');
    form.setConfirmPassword('Password123!');
    form = renderer.render(useAuth);
    const first = form[action]();
    await form[action]();
    assert.equal(calls, 1);
    request.resolve({});
    await first;
    await renderer.render(useAuth)[action]();
    assert.equal(calls, 1);
    assert.deepEqual(navigations, ['/(tabs)/news_content']);
    assert.equal(renderer.render(useAuth).loading, true);
  });
}

test('failed login stays on the form and allows a corrected submission', async () => {
  const renderer = hookRenderer();
  let calls = 0;
  const routes = [];
  const { useAuth } = load('hooks/useAuth.ts', {
    react: renderer.react,
    'react-native': { Platform: { OS: 'web' } },
    'expo-router': { router: { replace: route => routes.push(route) } },
    '../constants/authData': { VALIDATION_RULES: { email: { pattern: /@/ }, password: { minLength: 8 } } },
    '../services/authService': { login: async () => {
      if (++calls === 1) throw { response: { data: { message: 'Invalid credentials' } } };
    } },
  });
  let form = renderer.render(useAuth);
  form.setEmail('test@example.com');
  form.setPassword('Password123!');
  await renderer.render(useAuth).login();
  form = renderer.render(useAuth);
  assert.equal(form.errors.general, 'Invalid credentials');
  assert.equal(form.loading, false);
  assert.equal(routes.length, 0);
  await form.login();
  assert.equal(calls, 2);
  assert.deepEqual(routes, ['/(tabs)/news_content']);
});

test('login and registration finish without waiting for push permissions', async () => {
  const storage = new Map();
  let pushCalls = 0;
  const services = load('services/authService.ts', {
    'expo-linking': { createURL: () => 'exp://192.168.1.2:8081/--/verify-email' },
    'expo-secure-store': { setItemAsync: async (key, value) => storage.set(key, value) },
    'react-native': { Platform: { OS: 'android' } },
    './api': { post: async () => ({ data: { token: 'session-token', user: { id: '1' } } }) },
    './pushToken': { registerPushToken: () => { pushCalls++; return new Promise(() => {}); } },
  });
  await Promise.race([
    Promise.all([services.login('test@example.com', 'password'), services.register('Test', 'test@example.com', 'password', 'password')]),
    new Promise((_, reject) => { const timer = setTimeout(() => reject(Error('Authentication waited for push setup')), 200); timer.unref(); }),
  ]);
  assert.equal(storage.get('auth_token'), 'session-token');
  assert.equal(pushCalls, 2);
});

test('push setup errors are contained and concurrent setup is deduplicated', async () => {
  let checks = 0;
  const { registerPushToken } = load('services/pushToken.ts', {
    'expo-constants': { executionEnvironment: 'standalone' },
    'expo-device': { isDevice: true },
    'expo-notifications': { setNotificationHandler() {}, getPermissionsAsync: async () => { checks++; throw Error('Unavailable'); } },
    'expo-secure-store': { getItemAsync: async () => 'session-token' },
    'react-native': { Platform: { OS: 'android' } },
    './api': {},
  });
  await Promise.all([registerPushToken(), registerPushToken()]);
  assert.equal(checks, 1);
});

test('Expo Go skips unsupported remote push registration', async () => {
  const { registerPushToken } = load('services/pushToken.ts', {
    'expo-constants': { executionEnvironment: 'storeClient' },
    'expo-device': { isDevice: true },
    'expo-notifications': { setNotificationHandler() {} },
    'expo-secure-store': { getItemAsync: () => { throw Error('Should not access native push setup'); } },
    'react-native': { Platform: { OS: 'android' } },
    './api': {},
  });
  await registerPushToken();
});

test('401 handling preserves credential errors and newer sessions, but expires the rejected current session once', async () => {
  let requestHandler, rejectHandler;
  const routes = [];
  const storage = new Map([['auth_token', 'new-token'], ['user', '{}']]);
  load('services/api.ts', {
    './apiConfig': { API_BASE_URL: 'http://localhost:8000/api' },
    axios: { create: () => ({ interceptors: {
      request: { use: handler => { requestHandler = handler; } },
      response: { use: (_, handler) => { rejectHandler = handler; } },
    } }) },
    'expo-router': { router: { replace: route => routes.push(route) } },
    'expo-secure-store': {
      getItemAsync: async key => storage.get(key),
      deleteItemAsync: async key => storage.delete(key),
    },
    'react-native': { Platform: { OS: 'android', select: options => options.default } },
  });
  const failure = (url, token) => ({ response: { status: 401 }, config: { url, headers: { Authorization: 'Bearer ' + token } } });
  await assert.rejects(rejectHandler(failure('/login', 'new-token')));
  await assert.rejects(rejectHandler(failure('/profile', 'old-token')));
  assert.equal(routes.length, 0);
  assert.equal(storage.get('auth_token'), 'new-token');
  const publicRequest = await requestHandler({ url: '/login', headers: {} });
  assert.equal(publicRequest.headers.Authorization, undefined);
  await Promise.allSettled([rejectHandler(failure('/profile', 'new-token')), rejectHandler(failure('/notifications', 'new-token'))]);
  assert.deepEqual(routes, ['/(auth)/login']);
  assert.equal(storage.has('auth_token'), false);
});

test('startup redirects an existing session only to news, never back to welcome', async () => {
  const renderer = hookRenderer();
  const { default: Index } = load('app/index.tsx', {
    react: renderer.react,
    'react/jsx-runtime': { jsx: (type, props) => ({ type, props }) },
    'expo-router': { Redirect: 'Redirect' },
    'react-native': { ActivityIndicator: 'Spinner', View: 'View' },
    '../services/authService': { getToken: async () => 'session-token' },
    '../constants/theme': { getTheme: () => ({ background: '#fff', primary: '#216E35' }) },
    '../hooks/use-color-scheme': { useColorScheme: () => 'light' },
  });
  assert.equal(renderer.render(Index).type, 'View');
  renderer.runEffects();
  await new Promise(setImmediate);
  const result = renderer.render(Index);
  assert.equal(result.type, 'Redirect');
  assert.equal(result.props.href, '/(tabs)/news_content');
});
