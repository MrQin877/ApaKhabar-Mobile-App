const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
function load(file, extra = '') {
  const source = fs.readFileSync(file, 'utf8');
  const code = ts.transpileModule(source + extra, { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022 } }).outputText;
  const exports = {};
  const jsx = (type, props) => ({ type, props });
  const mocks = { '@/constants/theme': { Design: { contentWidth: 680, radius: { image: 10 } } }, 'react/jsx-runtime': { jsx, jsxs: jsx }, react: { Fragment: 'Fragment' }, 'react-native': { Text: 'Text', View: 'View', StyleSheet: { create: x => x } } };
  vm.runInNewContext(code, { exports, require: name => mocks[name] || {} });
  return exports;
}
const { latestPosts } = load('app/(tabs)/news_content/[id].tsx', '\nexports.latestPosts = latestPosts;');
const posts = [
  { id: 'current', date: '2026-11-12' }, { id: 'old', date: '2026-10-01' },
  { id: 'new', published_at: '2026-11-11T10:00:00Z' }, { id: 'middle', created_at: '2026-11-10T10:00:00Z' },
  { id: 'new', date: '2026-11-11' }, { id: 'fourth', date: '2026-11-09' },
];
assert.deepEqual(Array.from(latestPosts(posts, 'current'), p => p.id), ['new', 'middle', 'fourth']);
assert.equal(latestPosts([{ id: 1 }, { id: 2 }], '1').length, 1);
assert.equal(latestPosts([], '1').length, 0);
const article = load('components/news/ArticleBody.tsx');
assert.equal(article.plainArticle('A &amp; B &#x2014; &#65;'), 'A & B \u2014 A');
const tree = article.ArticleBody({ content: '<p>First <strong>bold</strong> &amp; <em>italic</em>.</p><p>Second<br>line.</p><ol><li>One</li><li>Two</li></ol><script>bad()</script>', theme: { text: '#111' } });
function flatten(node) {
  if (Array.isArray(node)) return node.map(flatten).join('');
  if (!node || typeof node !== 'object') return node || '';
  return flatten(node.props?.children);
}
const text = flatten(tree);
assert.match(text, /First bold & italic/);
assert.match(text, /Second\nline/);
assert.match(text, /1\. One[\s\S]*2\. Two/);
assert.ok(!text.includes('bad()'));
console.log('Passed: latest-post exclusion, ordering, deduplication, limits, entities, paragraphs, line breaks, lists, and script removal.');

function moduleWithMocks(file, mocks) {
  const exports = {};
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  vm.runInNewContext(code, { exports, Date, Intl, require: name => { assert.ok(name in mocks, name); return mocks[name]; } });
  return exports;
}
const filters = moduleWithMocks('utils/newsFilters.ts', { '@/constants/news': { NEWS_TIME_ZONE: 'Asia/Kuala_Lumpur' } });
const { publicationDateTime } = moduleWithMocks('utils/newsPublication.ts', { '@/constants/news': { NEWS_TIME_ZONE: 'Asia/Kuala_Lumpur' }, './newsFilters': filters });
assert.equal(publicationDateTime({ published_at: '2026-10-20T06:30:00Z', date: 'old display', time: '2 days' }), '20 October 2026 \u00b7 2:30 PM');
assert.equal(publicationDateTime({ published_at: '2020-12-31T18:30:00Z' }), '1 January 2021 \u00b7 2:30 AM');
assert.equal(publicationDateTime({ published_at: '2026-10-20T14:30:00+08:00' }), '20 October 2026 \u00b7 2:30 PM');
assert.equal(publicationDateTime({ created_at: '2019-02-03T00:05:00Z' }), '3 February 2019 \u00b7 8:05 AM');
assert.equal(publicationDateTime({ published_at: '2026-10-20 14:30:00' }), '20 October 2026 \u00b7 2:30 PM');
assert.equal(publicationDateTime({ date: '20 October 2026' }), '20 October 2026');
assert.equal(publicationDateTime({ date: '2020-02-29' }), '29 February 2020');
assert.equal(publicationDateTime({ date: 'bad' }), 'Tarikh penerbitan tidak tersedia');
assert.equal(publicationDateTime({ published_at: '2026-02-30 25:00:00', date: 'bad' }), 'Tarikh penerbitan tidak tersedia');
assert.equal(publicationDateTime({ published_at: '2026-10-20T06:30:00Z' }, 'America/New_York'), '20 October 2026 \u00b7 2:30 AM');
const detailSource = fs.readFileSync('app/(tabs)/news_content/[id].tsx', 'utf8');
assert.ok(!detailSource.includes('bookmark')); assert.ok(!detailSource.includes('styles.avatar'));
assert.equal((detailSource.match(/accessibilityLabel="Kongsi berita"/g) || []).length, 1);
assert.ok(detailSource.includes('accessibilityLabel="Suka berita"')); assert.ok(detailSource.includes('accessibilityLabel="Buka komen"'));
console.log('Passed: publication timestamp priority, timezone/offset conversion, old/SQL dates, date-only fallback, simplified header and retained engagement actions.');
