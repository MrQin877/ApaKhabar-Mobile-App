const assert = require('node:assert/strict');
const fs = require('node:fs'); const vm = require('node:vm'); const ts = require('typescript');
function load(file, mocks = {}) { const exports = {}; vm.runInNewContext(ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true } }).outputText, { exports, console, require: name => { assert.ok(name in mocks, name); return mocks[name]; } }); return exports; }
const flush = async () => { for (let i = 0; i < 12; i++) await Promise.resolve(); };
const deferred = () => { let resolve, reject; const promise = new Promise((a,b) => { resolve = a; reject = b; }); return { promise, resolve, reject }; };
const jsx = (type, props) => ({ type, props });
const nodes = tree => Array.isArray(tree) ? tree.flatMap(nodes) : tree && typeof tree === 'object' ? [tree, ...nodes(tree.props?.children)] : [];
(async () => {
 const events = load('services/sessionEvents.ts'); let token = 'user-a', request = deferred(), posts = 0, notifications = 0;
 const likes = load('services/newsLikes.ts', { './api': { post: path => { assert.equal(path, '/news/42/like'); posts++; return request.promise; } }, './authService': { getToken: async () => token }, './sessionEvents': events });
 likes.subscribeNewsLikes(() => notifications++);
 likes.observeNewsLikes([{ id: '42', liked_by_user: true, likes: 5 }]); assert.equal(likes.newsLikeState('42').liked, true);
 const stale = likes.newsLikesVersion();
 const first = likes.toggleNewsLike({ id: '42' }); await flush();
 assert.equal(posts, 1); assert.equal(likes.newsLikeState('42').liked, false); assert.equal(likes.newsLikeState('42').count, 4); assert.equal(likes.newsLikeState('42').pending, true);
 likes.observeNewsLikes([{ id: '42', liked_by_user: true, likes: 5 }], stale); assert.equal(likes.newsLikeState('42').count, 4);
 request.resolve({ data: { liked: false, likes_count: 8 } }); await first; await flush(); assert.equal(likes.newsLikeState('42').count, 8);
 likes.observeNewsLikes([{ id: '42', liked_by_user: true, likes: 5 }], stale); assert.equal(likes.newsLikeState('42').liked, false);
 request = deferred(); const fail = likes.toggleNewsLike({ id: '42' }); await flush(); assert.equal(likes.newsLikeState('42').liked, true); request.reject(Error('offline')); await assert.rejects(fail); await flush();
 assert.equal(likes.newsLikeState('42').liked, false); assert.equal(likes.newsLikeState('42').count, 8); assert.ok(likes.newsLikeState('42').error);
 request = deferred(); const success = likes.toggleNewsLike({ id: '42' }); await flush(); request.resolve({ data: { liked: true, likes_count: 9 } }); await success; await flush();
 assert.equal(likes.newsLikeState('42').liked, true); likes.observeNewsLikes([{ id: '42', liked_by_user: true, likes: 9 }]); assert.equal(likes.newsLikeState('42').count, 9);
 request = deferred(); const oldRequest = likes.toggleNewsLike({ id: '42' }); await flush(); const oldVersion = likes.newsLikesVersion(); token = null; events.sessionChanged();
 assert.equal(likes.newsLikeState('42').liked, false); request.resolve({ data: { liked: true, likes_count: 999 } }); await oldRequest; await flush(); assert.notEqual(likes.newsLikeState('42').count, 999);
 likes.observeNewsLikes([{ id: '42', liked_by_user: true, likes: 999 }], oldVersion); assert.equal(likes.newsLikeState('42').liked, false);
 const before = posts; assert.equal(await likes.toggleNewsLike({ id: '42' }), null); assert.equal(posts, before); assert.ok(notifications > 5);
 // A real hook instance consumes the same store for all surfaces.
 const hook = load('hooks/useNewsLike.ts', { react: { useSyncExternalStore: (_, snapshot) => snapshot() }, '@/services/newsLikes': likes }).useNewsLike;
 // A slow like accepts an immediate cancel and serializes the unlike request.
 const queue = [], paths = [];
 const responsive = load('services/newsLikes.ts', {
   './api': { post: (path, body, options) => { assert.equal(options.timeout, 15000); paths.push(path); const task = deferred(); queue.push(task); return task.promise; } },
   './authService': { getToken: async () => 'signed-in' }, './sessionEvents': load('services/sessionEvents.ts'),
 });
 responsive.observeNewsLikes([{ id: '42', liked_by_user: false, likes: 4 }]);
 const slow = responsive.toggleNewsLike({ id: '42' }); await flush();
 assert.equal(responsive.newsLikeState('42').liked, true); assert.equal(paths.length, 1);
 assert.equal(responsive.toggleNewsLike({ id: '42' }), slow);
 assert.equal(responsive.newsLikeState('42').liked, false); assert.equal(responsive.newsLikeState('42').count, 4);
 assert.equal(paths.length, 1); // Never overlap requests for one post.
 queue[0].resolve({ data: { liked: true, likes_count: 5 } }); await flush();
 assert.equal(paths.length, 2); assert.equal(responsive.newsLikeState('42').liked, false);
 queue[1].resolve({ data: { liked: false, likes_count: 4 } }); await slow;
 assert.equal(responsive.newsLikeState('42').pending, false); assert.equal(responsive.newsLikeState('42').count, 4);
 // Three quick taps coalesce to one final like, rather than three server toggles.
 const coalesced = responsive.toggleNewsLike({ id: '42' }); await flush();
 responsive.toggleNewsLike({ id: '42' }); responsive.toggleNewsLike({ id: '42' });
 queue[2].resolve({ data: { liked: true, likes_count: 5 } }); await coalesced; await flush();
 assert.equal(paths.length, 3); assert.equal(responsive.newsLikeState('42').liked, true);
 // A failed queued cancel restores the last server-confirmed state and unlocks.
 const failure = responsive.toggleNewsLike({ id: '42' }); await flush();
 responsive.toggleNewsLike({ id: '42' });
 queue[3].resolve({ data: { liked: false, likes_count: 4 } }); await flush();
 queue[4].reject(Error('timeout')); await assert.rejects(failure); await flush();
 assert.equal(responsive.newsLikeState('42').liked, false); assert.equal(responsive.newsLikeState('42').pending, false);
 assert.ok(responsive.newsLikeState('42').error);
 // Short videos use the same responsive behavior with a separate key and API.
 const short = responsive.toggleNewsLike({ id: '42', kind: 'short', likes_count: 10 }); await flush();
 assert.equal(paths.at(-1), '/shorts/42/like');
 assert.equal(responsive.newsLikeState('42', 'short').liked, true);
 assert.equal(responsive.newsLikeState('42').liked, false);
 queue[5].resolve({ data: { liked: true, likes_count: 11 } }); await short;
 // Two taps before secure storage resolves cancel without a network mutation.
 const postsBefore = paths.length;
 const cancelled = responsive.toggleNewsLike({ id: '42' });
 responsive.toggleNewsLike({ id: '42' });
 await cancelled;
 assert.equal(paths.length, postsBefore); assert.equal(responsive.newsLikeState('42').pending, false);
 token = 'user-b'; events.sessionChanged(); likes.observeNewsLikes([{ id: '42', liked_by_user: true, likes: 3 }]); assert.equal(hook({ id: '42', likes: 100 }).count, 3);
 let route, toggles = 0, state = { liked: true, count: 3, pending: false, error: '', toggle: async () => { toggles++; return null; } };
 const theme = { primary: '#216E35', secondary: '#68716C', error: '#BC3232' };
 const common = { react: { memo: fn => fn }, 'react/jsx-runtime': { jsx, jsxs: jsx }, 'heroui-native/card': { Card: 'Card' }, 'heroui-native/pressable-feedback': { PressableFeedback: 'Pressable' }, 'heroui-native/button': { Button: 'Button' }, '@expo/vector-icons': { Ionicons: 'Icon' }, 'expo-router': { router: { push: value => { route = value; } } }, 'react-native': { Image: 'Image', Share: {}, StyleSheet: { create: value => value }, Text: 'Text', View: 'View' }, '@/hooks/useNewsLike': { useNewsLike: () => state }, '@/hooks/useAppTheme': { useAppTheme: () => theme }, '@/constants/theme': { Design: { radius: { image: 10 } } }, '@/services/apiConfig': {}, '@/utils/newsImage': {} };
 const Featured = load('components/news/FeaturedCard.tsx', common);
 let tree = Featured.NewsActions({ item: { id: '42', likes: 0 } }); let heart = nodes(tree).find(n => n.type === 'Icon' && n.props.name === 'heart'); assert.equal(heart.props.color, theme.primary);
 let action = nodes(tree).find(n => n.type === 'Button'); assert.equal(action.props.accessibilityState.selected, true); action.props.onPress(); await flush(); assert.equal(route.params.id, '42');
 const Compact = load('components/news/CompactNewsCard.tsx', { ...common, '@/utils/newsFilters': { newsPostingTime: () => '' }, './FeaturedCard': {} }).CompactNewsCard;
 tree = Compact({ item: { id: '42', title: 'News' }, theme, now: 0 }); action = nodes(tree).find(n => n.type === 'Button'); let stopped = 0; action.props.onPress({ stopPropagation: () => stopped++ }); await flush(); assert.equal(stopped, 1); assert.equal(toggles, 2);
 state = { ...state, liked: false, pending: true }; tree = Featured.NewsActions({ item: { id: '42' } }); assert.equal(nodes(tree).find(n => n.type === 'Button').props.isDisabled, undefined); assert.equal(nodes(tree).find(n => n.type === 'Button').props.accessibilityState.busy, true); assert.ok(nodes(tree).some(n => n.type === 'Icon' && n.props.name === 'heart-outline'));
 // Related articles replace only the detail route; the mounted home object survives.
 const home = { name: 'home', category: 'Sukan', search: 'bola', date: 'today', scroll: 650 };
 let stack = [home], navigation;
 const navigationRouter = {
   push: value => { navigation = value; stack.push(value); },
   replace: value => { navigation = value; stack[stack.length - 1] = value; },
   dismissTo: value => { const index = stack.indexOf(home); stack = index >= 0 ? stack.slice(0, index + 1) : [value]; },
 };
 const navigationMocks = { ...common, 'expo-router': { router: navigationRouter } };
 const actions = load('components/news/FeaturedCard.tsx', navigationMocks).NewsActions;
 const Card = load('components/news/NewsCard.tsx', { ...navigationMocks, './FeaturedCard': { NewsActions: actions, NewsMeta: 'Meta' } }).NewsCard;
 const pressArticle = (id, replaceRoute) => nodes(Card({ id, title: `News ${id}`, theme, replaceRoute })).find(n => n.type === 'Pressable').props.onPress();
 pressArticle('1', false); pressArticle('2', true); pressArticle('3', true);
 assert.equal(stack.length, 2); assert.equal(stack[1].params.id, '3'); assert.equal(stack[0], home);
 tree = Card({ id: '4', title: 'News 4', theme, replaceRoute: true });
 assert.equal(nodes(tree).find(n => n.type === actions).props.replaceRoute, true);
 tree = actions({ item: { id: '4', comments: 2 }, replaceRoute: true });
 nodes(tree).find(n => n.props?.accessibilityLabel === '2 komen, buka komen').props.onPress();
 assert.equal(stack.length, 2); assert.equal(navigation.params.comments, 'open');
 const detailSource = fs.readFileSync('app/(tabs)/news_content/[id].tsx', 'utf8');
 assert.ok(detailSource.includes('theme={theme} replaceRoute/>'));
 assert.ok(detailSource.includes('>Kembali ke Berita</Text>'));
 const backSource = detailSource.match(/const back = \(\) => ([^;]+);/)[1];
 const back = () => vm.runInNewContext(backSource, { router: navigationRouter });
 back(); assert.equal(stack.length, 1); assert.equal(stack[0], home); assert.equal(home.scroll, 650);
 stack = [{ params: { id: '99' } }]; back(); assert.equal(stack[0], '/(tabs)/news_content');
 console.log('Passed: immediate like/cancel, serialized requests, tap coalescing, rollback, timeouts, isolated news/short states, guest/session restrictions and preserved navigation.');
})().catch(error => { console.error(error); process.exitCode = 1; });
