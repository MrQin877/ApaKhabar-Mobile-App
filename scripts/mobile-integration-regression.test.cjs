const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
function load(file, dependencies, env = {}, dev = true) {
  const exports = {};
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, esModuleInterop: true, target: ts.ScriptTarget.ES2022 } }).outputText;
  vm.runInNewContext(code, { exports, URL, process: { env }, __DEV__: dev, require: name => {
    if (!(name in dependencies)) throw Error('Unexpected dependency: ' + name);
    return dependencies[name];
  } });
  return exports;
}
const config = (platform, hostUri, env = {}, dev = true) => load('services/apiConfig.ts', { 'expo-constants': { expoConfig: { hostUri } }, 'expo-linking': { createURL: () => undefined }, 'react-native': { Platform: { OS: platform }, NativeModules: {} } }, env, dev);
assert.equal(config('web').API_BASE_URL, 'http://localhost:8088/api');
assert.equal(config('android', '192.168.1.50:8081').API_BASE_URL, 'http://192.168.1.50:8088/api');
assert.equal(config('ios', '192.168.1.50:8081').API_BASE_URL, 'http://192.168.1.50:8088/api');
assert.equal(config('android', 'localhost:8081').API_BASE_URL, 'http://10.0.2.2:8088/api');
assert.equal(config('android', 'example.exp.direct').API_BASE_URL, 'http://10.0.2.2:8088/api');
assert.equal(config('ios', 'ignored:8081', { EXPO_PUBLIC_API_BASE_URL: 'https://api.example.test/api/' }).API_BASE_URL, 'https://api.example.test/api');
assert.equal(config('ios', undefined, { EXPO_PUBLIC_API_URL: 'https://legacy.example.test/api' }).API_BASE_URL, 'https://legacy.example.test/api');
const { resolveNewsImage } = load('utils/newsImage.ts', { '@/services/apiConfig': { BACKEND_BASE_URL: 'http://192.168.1.50:8000' } });
assert.equal(resolveNewsImage('news-images/a.jpg'), 'http://192.168.1.50:8000/storage/news-images/a.jpg');
assert.equal(resolveNewsImage('/storage/news-images/a.jpg'), 'http://192.168.1.50:8000/storage/news-images/a.jpg');
assert.equal(resolveNewsImage('storage/avatars/a.png'), 'http://192.168.1.50:8000/storage/avatars/a.png');
assert.equal(resolveNewsImage('http://localhost:8000/storage/news-images/a.jpg?q=1'), 'http://192.168.1.50:8000/storage/news-images/a.jpg?q=1');
assert.equal(resolveNewsImage('http://192.168.9.10:8000/storage/a.jpg'), 'http://192.168.1.50:8000/storage/a.jpg');
assert.equal(resolveNewsImage('https://cdn.example.test/a.jpg'), 'https://cdn.example.test/a.jpg');
assert.equal(resolveNewsImage(''), '');
const { readLatestBroadcast } = load('utils/broadcasts.ts', {});
assert.equal(readLatestBroadcast({ message: null }), null);
assert.equal(readLatestBroadcast({ message: 'Amaran banjir: Jalan ditutup.' }).title, 'Amaran banjir');
assert.equal(readLatestBroadcast({ message: 'Amaran banjir: Jalan ditutup.' }).message, 'Jalan ditutup.');
assert.equal(readLatestBroadcast({ message: 'Message only' }).message, 'Message only');
const routes = fs.readFileSync('../ApaKhabar-Intelligence-Information-News-Management-System/routes/api.php', 'utf8');
for (const route of ["Route::get('/news'", "Route::get('/news/{id}'", "Route::get('/categories'", "Route::get('/broadcasts/darurat'", "Route::post('/news/{id}/like'", "Route::post('/news/{id}/comment'", "Route::post('/comments/{id}/replies'", "Route::post('/comments/{id}/report'", "Route::get('/notifications'", "Route::get('/profile'"]) assert.ok(routes.includes(route), route);
console.log('Passed: local/emulator/LAN URLs, environment overrides, storage image host rewriting, real broadcast response shape, and mobile endpoint presence in Laravel routes.');
