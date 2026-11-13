const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
function load(file, mocks) {
  const exports = {};
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText;
  vm.runInNewContext(code, { exports, Date, console: { log() {}, warn() {} }, require: name => { if (name === '../utils/formValidation') return load('utils/formValidation.ts', {}); if (name === '../utils/authNavigation') return load('utils/authNavigation.ts', {}); if (name === './sessionEvents') return { sessionChanged() {} }; assert.ok(name in mocks, name); return mocks[name]; } });
  return exports;
}
function setup(returnTo, platform = 'android') {
  let cursor = 0, args, resolve, reject, calls = 0, route;
  const slots = [];
  const react = {
    useState(initial) { const index = cursor++; if (!(index in slots)) slots[index] = initial; return [slots[index], value => { slots[index] = typeof value === 'function' ? value(slots[index]) : value; }]; },
    useRef(initial) { const index = cursor++; return slots[index] ||= { current: initial }; },
  };
  const module = load('hooks/useRegistration.ts', {
    react, 'react-native': { Platform: { OS: platform } }, 'expo-router': { router: { replace: value => { route = value; }, dismissTo: value => { route = value; } } },
    '@/constants/authData': { VALIDATION_RULES: { email: { pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ }, password: { minLength: 8, message: 'Minimum 8' } } },
    '@/services/authService': { register: (...values) => { calls++; args = values; return new Promise((a, b) => { resolve = a; reject = b; }); } },
  });
  return { ...module, render: () => { cursor = 0; return module.useRegistration(returnTo); }, args: () => args, calls: () => calls, route: () => route, resolve: value => resolve(value), reject: value => reject(value) };
}
function personal(s) {
  const form = s.render();
  for (const [key, value] of Object.entries({ name: ' Test User ', date_of_birth: '2000-10-01', citizenship: 'wni' })) form.update(key, value);
}
async function main() {
  const s = setup(); s.render().next(); assert.equal(s.render().step, 1); assert.ok(s.render().errors.date_of_birth);
  assert.equal(s.validBirthDate('2027-01-01', new Date(2026, 10, 12)), false);
  assert.equal(s.validBirthDate('1906-11-11', new Date(2026, 10, 12)), false);
  assert.equal(s.validBirthDate('1906-11-12', new Date(2026, 10, 12)), true);
  assert.equal(s.validBirthDate('2000-02-30'), false);
  personal(s); s.render().next(); assert.equal(s.render().step, 2);
  s.render().update('email', 'reader@example.test'); s.render().update('phone', '+60123456789');
  s.render().setMethod('phone'); s.render().setStep(1); assert.equal(s.render().fields.email, 'reader@example.test');
  s.render().next(); s.render().setMethod('email'); assert.equal(s.render().fields.phone, '+60123456789');
  await s.render().submit(); assert.ok(s.render().errors.password_confirmation); assert.equal(s.calls(), 0);
  s.render().update('password', 'Password1'); s.render().update('password_confirmation', 'Password1');
  const form = s.render(); const first = form.submit(); await form.submit(); assert.equal(s.calls(), 1);
  assert.equal(s.args()[0], 'Test User'); assert.equal(s.args()[1], 'reader@example.test'); assert.equal(s.args()[4], undefined);
  assert.deepEqual(JSON.parse(JSON.stringify(s.args()[5])), { date_of_birth: '2000-10-01', citizenship: 'wni' });
  s.reject({ response: { status: 422, data: { message: 'Validation failed', errors: { email: ['Already registered'] } } } }); await first;
  assert.equal(s.render().errors.email, 'Already registered'); assert.equal(s.render().loading, false); assert.equal(s.render().step, 2);
  s.render().update('email', 'new@example.test'); const retry = s.render().submit(); s.resolve({ user: {} }); await retry;
  assert.equal(s.route(), '/verify-email'); await s.render().submit(); assert.equal(s.calls(), 2, 'Stay locked until navigation');
  const phone = setup(); personal(phone); phone.render().next(); phone.render().setMethod('phone');
  for (const [key, value] of Object.entries({ phone: '+628123456789', email: 'preserved@example.test', password: 'Password1', password_confirmation: 'Password1', gender: 'undisclosed', ethnicity: '  Example ethnicity ' })) phone.render().update(key, value);
  const registering = phone.render().submit(); assert.equal(phone.args()[1], undefined); assert.equal(phone.args()[4], '+628123456789');
  assert.equal(phone.args()[5].gender, 'undisclosed'); assert.equal(phone.args()[5].ethnicity, 'Example ethnicity');
  phone.resolve({ user: { phone: '+628123456789', phone_verified_at: null } }); await registering; assert.equal(phone.route(), '/verify-phone');
  const demographicError = setup(); personal(demographicError); demographicError.render().next();
  for (const [key, value] of Object.entries({ email: 'test@example.test', password: 'Password1', password_confirmation: 'Password1' })) demographicError.render().update(key, value);
  const failed = demographicError.render().submit(); demographicError.reject({ response: { status: 422, data: { errors: { citizenship: ['Invalid citizenship'] } } } }); await failed;
  assert.equal(demographicError.render().step, 1); assert.equal(demographicError.render().fields.email, 'test@example.test');
  for (const destination of ['/(tabs)/profile', '/(tabs)/notification']) {
    for (const platform of ['android', 'web']) {
      const directed = setup(destination, platform); personal(directed); directed.render().next();
      for (const [key, value] of Object.entries({ email: 'reader@example.test', password: 'Password1', password_confirmation: 'Password1' })) directed.render().update(key, value);
      const task = directed.render().submit(); directed.resolve({ user: {} }); await task;
      if (platform === 'android') { assert.equal(directed.route().pathname, '/verify-email'); assert.equal(directed.route().params.returnTo, destination); }
      else assert.equal(directed.route(), destination);
    }
  }
  const stored = {}, payloads = [];
  const auth = load('services/authService.ts', {
    'expo-secure-store': { setItemAsync: async (key, value) => { stored[key] = value; } },
    'react-native': { Platform: { OS: 'android' } }, './pushToken': { registerPushToken: async () => {} },
    './api': { post: async (path, payload) => { assert.equal(path, '/register'); payloads.push(payload); return { data: { token: 'test-session', user: { email: payload.email, phone: payload.phone } } }; } },
  });
  await auth.register('Test', 'new@example.test', 'Password1', 'Password1', undefined, { date_of_birth: '2000-10-01', citizenship: 'dual', gender: 'female' });
  assert.equal(payloads[0].date_of_birth, '2000-10-01'); assert.equal(payloads[0].citizenship, 'dual'); assert.equal(payloads[0].gender, 'female');
  assert.equal(payloads[0].password_confirmation, 'Password1'); assert.ok(!('ethnicity' in payloads[0])); assert.ok(!('phone' in payloads[0]));
  assert.equal(stored.auth_token, 'test-session'); assert.equal(stored.pending_email_registration, 'new@example.test');
  assert.equal(JSON.parse(stored.user).email, 'new@example.test');
  const phones = load('utils/phoneNumber.ts', {});
  assert.equal(phones.formatPhoneNumber('0123456789', 'MY'), '+60123456789');
  assert.equal(phones.formatPhoneNumber('08123456789', 'ID'), '+628123456789');
  console.log('Passed: step validation, birth bounds, preserved steps/tabs, contact payloads, optional omissions, duplicate lock, Laravel 422 retry, verification routes, secure session and international phone formatting.');
}
main().catch(error => { console.error(error); process.exitCode = 1; });
