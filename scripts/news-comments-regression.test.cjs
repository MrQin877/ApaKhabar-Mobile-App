const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
function load(file, mocks = {}) {
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const exports = {};
  vm.runInNewContext(code, { exports, require: name => {
    if (name === './newsLikes') return { observeNewsLikes() {}, newsLikesVersion: () => ({ generation: 0, revision: 0 }) };
    if (name === './sessionEvents') return { subscribeSession() {} };
    if (!(name in mocks)) throw new Error(`Unmocked module: ${name}`);
    return mocks[name];
  } });
  return exports;
}
const helpers = load('utils/newsComments.ts');
const comments = [
  { id: '1', author: 'Nur Aina', content: 'Published', status: 'published', parent_id: null },
  { id: '2', author: 'Hafiz', content: 'Reply', parent_id: '1' },
  { id: '3', author: 'Guest12345', content: 'Nested reply', parent_id: '2' },
  { id: '4', content: 'Pending parent', status: 'pending_review' },
  { id: '5', content: 'Reply to moderated parent', parent_id: '4' },
  { id: '6', content: 'Another root', parent_id: null },
  { id: '1', content: 'Duplicate' },
  { id: '7', content: 'Cycle', parent_id: '8' }, { id: '8', content: 'Cycle', parent_id: '7' },
];
const snapshot = helpers.readNewsComments({ data: { comments_list: comments, comments: 6 } });
assert.equal(snapshot.total, 6, 'Use the count returned by the server');
assert.ok(!snapshot.comments.some(comment => comment.id === '4'), 'Never show pending text');
assert.equal(snapshot.comments.filter(comment => comment.id === '1').length, 1);
const rows = helpers.threadNewsComments(snapshot.comments);
assert.deepEqual(Array.from(rows, row => `${row.comment.id}:${row.depth}`), ['1:0', '2:1', '3:2', '6:0']);
assert.equal(helpers.commenterName({ user: 'Guest12345' }), 'Guest12345');
assert.equal(helpers.commenterName({ author: { name: 'Nur Aina' } }), 'Nur Aina');
assert.equal(helpers.commentInitials('  Nur   Aina  '), 'N');
assert.match(helpers.commentSubmissionMessage({ status: 'pending_review' }), /menunggu semakan/);
assert.match(helpers.commentSubmissionMessage({ status: 'published' }), /diterbitkan/);
assert.match(helpers.commentSubmissionMessage({ status: 'rejected' }), /tidak diterbitkan/);
assert.equal(helpers.commentSubmissionMessage({ status: 'pending_review', message: 'Server moderation notice' }), 'Server moderation notice');
assert.equal(helpers.commentErrorMessage({ response: { status: 422, data: { message: 'Validation failed', errors: { content: ['Duplicate comment'] } } } }), 'Duplicate comment');
assert.equal(helpers.commentErrorMessage({ response: { status: 422, data: { errors: { quota: ['Guest quota exhausted'] } } } }), 'Guest quota exhausted');
assert.match(helpers.commentErrorMessage({ response: { status: 429 } }), /Tunggu/);
assert.equal(helpers.readNewsComments({ comments: 0, comments_list: [] }).total, 0);
async function checkApi() {
  const requests = [];
  let invalidations = 0;
  const api = { post: async (path, body) => {
    requests.push({ path, body });
    return { data: { status: 'pending_review', remaining_quota: null } };
  } };
  const service = load('services/newsService.ts', {
    './api': api, './newsFeedStore': { invalidateNewsFeed: () => invalidations++ }, './apiConfig': { API_BASE_URL: 'test' },
    './guestCommentService': { submitPublicComment: async (path, kind, id, content) => (await api.post(path, { content })).data },
  });
  const result = await service.postComment('42', 'Root comment');
  assert.equal(result.status, 'pending_review');
  await service.postCommentReply('7', 'Reply text', '42');
  await service.reportNewsComment('7', 'Reason for reporting');
  assert.deepEqual(JSON.parse(JSON.stringify(requests)), [
    { path: '/news/42/comment', body: { content: 'Root comment' } },
    { path: '/comments/7/replies', body: { content: 'Reply text' } },
    { path: '/comments/7/report', body: { reason: 'Reason for reporting' } },
  ]);
  assert.equal(invalidations, 2, 'Only successful content submissions invalidate the news feed');
  api.post = async () => { throw { response: { status: 422, data: { errors: { content: ['Rejected'] } } } }; };
  await assert.rejects(service.postComment('42', 'Keep my draft'));
  assert.equal(invalidations, 2, 'A failed submission must not count as a success');
}
checkApi().then(() => console.log('Passed: published-only comments, reply threading, moderated parents, duplicate removal, guest identity/quota errors, moderation notices, and existing submission/reply/report API contracts.')).catch(error => { console.error(error); process.exitCode = 1; });
