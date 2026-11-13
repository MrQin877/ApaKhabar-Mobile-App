/* global __dirname */
const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");
const jsx = (type, props) => ({ type, props });
function load(file, mocks, globals = {}) {
  const exports = {};
  const code = ts.transpileModule(fs.readFileSync(path.join(__dirname, "..", file), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
  }).outputText;
  vm.runInNewContext(code, { exports, Blob, ...globals, require(name) {
    assert.ok(name in mocks, "Unmocked " + name); return mocks[name];
  } });
  return exports;
}
function state() {
  let cursor = 0; const slots = [];
  return { react: {
    useState(initial) { const i = cursor++; if (!slots[i]) { const entry = { value: initial }; entry.set = next => { entry.value = typeof next === "function" ? next(entry.value) : next; }; slots[i] = entry; } return [slots[i].value, slots[i].set]; },
    useRef(initial) { const i = cursor++; return slots[i] ||= { current: initial }; },
  }, render(fn) { cursor = 0; return fn(); } };
}
const nodes = tree => Array.isArray(tree) ? tree.flatMap(nodes) : tree && typeof tree === "object" ? [tree, ...nodes(tree.props?.children)] : [];
const text = tree => nodes(tree).filter(n => n.type === "Text").map(n => n.props.children);
const button = (tree, title) => nodes(tree).find(n => n.props?.title === title || n.type === "Button" && text(n).includes(title));
const asset = { uri: "file:///selected.jpg", width: 200, height: 200, mimeType: "image/jpeg", fileSize: 1024 };
test("native and web uploads use multipart, removal is authenticated, stale accounts are not cached", async () => {
  for (const platform of ["android", "web"]) {
    const calls = []; let token = "test"; let reads = 0;
    class Form { constructor() { this.fields = []; } append(...args) { this.fields.push(args); } }
    const service = load("services/profilePhoto.ts", {
      "react-native": { Platform: { OS: platform } },
      "./api": { post: async (...args) => calls.push(args), delete: async (...args) => calls.push(args) },
      "./authService": { getToken: async () => token, getProfile: async () => { reads++; return { avatar: "new.jpg" }; } },
    }, { FormData: Form });
    const chosen = { ...asset, file: new Blob(["test"], { type: "image/jpeg" }) };
    assert.equal((await service.saveProfilePhoto(chosen)).avatar, "new.jpg");
    assert.equal(calls[0][0], "/profile/photo");
    assert.equal(calls[0][1].fields[0][0], "photo");
    assert.equal(calls[0][2].headers["Content-Type"], "multipart/form-data");
    assert.equal(platform === "web" ? calls[0][1].fields[0][1] === chosen.file : calls[0][1].fields[0][1].uri === asset.uri, true);
    await service.saveProfilePhoto(null); assert.equal(calls[1][0], "/profile/photo");
    assert.equal(reads, 2);
    assert.ok(service.profilePhotoError({ ...asset, fileSize: 6 * 1024 * 1024 }));
    assert.ok(service.profilePhotoError({ ...asset, mimeType: "image/svg+xml" }));
    assert.ok(service.profilePhotoError({ ...asset, width: 4097 }));
    token = null;
    await assert.rejects(service.saveProfilePhoto(chosen));
    assert.equal(calls.length, 2);
  }
});
test("photo editor saves confirmed crops and removals, preserves failures and cancellations, and prevents overlapping saves", async () => {
  const h = state(); const saved = []; let selection = { canceled: false, assets: [asset] }; let reject = false;
  let finish; let defer = false; let backs = 0; let pickerOptions;
  const user = { id: "1", name: "Kuan Pratama", avatar: "old.jpg" };
  const theme = { primary: "#216E35", error: "#BC3232", background: "#fff" };
  const Screen = load("app/(tabs)/profile/edit-photo.tsx", {
    react: h.react, "react/jsx-runtime": { jsx, jsxs: jsx },
    "react-native": { ActivityIndicator: "Loading", StatusBar: "StatusBar", Text: "Text", View: "View", StyleSheet: { create: v => v }, useWindowDimensions: () => ({ width: 320 }) },
    "expo-image-picker": { launchImageLibraryAsync: async options => { pickerOptions = options; return selection; } },
    "expo-router": { router: { canGoBack: () => true, back() { backs++; }, replace() {} } },
    "heroui-native/button": { Button: "Button" }, "@expo/vector-icons": { Ionicons: "Icon" },
    "react-native-safe-area-context": { useSafeAreaInsets: () => ({ top: 20, bottom: 10, left: 0, right: 0 }) },
    "@/components/KeyboardForm": { KeyboardForm: "Form" },
    "@/components/ui/FormError": { FormError: "Error" }, "@/components/profile/ProfileAvatar": { ProfileAvatar: "Avatar" },
    "@/hooks/useAppTheme": { useAppTheme: () => theme }, "@/hooks/use-color-scheme": { useColorScheme: () => "dark" },
    "@/hooks/useVerifiedProfile": { useVerifiedProfile: () => ({ user, loading: false }) },
    "@/constants/theme": { Design: { contentWidth: 680, spacing: { lg: 24, md: 16, sm: 8 }, primaryButton: {}, primaryButtonText: {} } },
    "@/services/profilePhoto": { profilePhotoError: chosen => chosen.fileSize > 5 * 1024 * 1024 ? "Too large" : "", photoSubmissionError: () => "Upload failed",
      saveProfilePhoto: async chosen => {
        saved.push(chosen);
        if (defer) await new Promise(resolve => { finish = resolve; });
        if (reject) throw Error("test");
        return { ...user, avatar: chosen ? "new.jpg" : null, profile_photo_url: null };
      } },
  }).default;
  const render = () => h.render(Screen);
  const settle = async () => { for (let i = 0; i < 20; i++) await Promise.resolve(); };
  const press = async title => { button(render(), title).props.onPress(); await settle(); };
  const preview = () => nodes(render()).find(n => n.type === "Avatar").props;
  assert.equal(preview().name, "Kuan Pratama");
  assert.equal(nodes(render()).filter(n => n.type === "Button" && n.props.accessibilityLabel !== "Kembali").length, 2);
  assert.equal(button(render(), "Simpan foto"), undefined);
  selection = { canceled: true, assets: null };
  await press("Tukar foto"); assert.equal(preview().uri, "old.jpg"); assert.equal(saved.length, 0);
  selection = { canceled: false, assets: [{ ...asset, fileSize: 6 * 1024 * 1024 }] };
  await press("Tukar foto"); assert.equal(preview().uri, "old.jpg"); assert.equal(saved.length, 0);
  selection = { canceled: false, assets: [asset] }; reject = true;
  await press("Tukar foto"); assert.equal(preview().uri, "old.jpg");
  assert.equal(nodes(render()).find(n => n.type === "Error").props.message, "Upload failed");
  reject = false; defer = true;
  await press("Tukar foto"); assert.equal(preview().uri, "old.jpg");
  assert.ok(nodes(render()).some(n => n.type === "Loading"));
  const count = saved.length;
  await press("Tukar foto"); await press("Buang foto"); assert.equal(saved.length, count);
  finish(); await settle(); assert.equal(preview().uri, "new.jpg");
  assert.equal(pickerOptions.allowsEditing, true); assert.deepEqual(Array.from(pickerOptions.aspect), [1, 1]);
  defer = false; reject = true;
  await press("Buang foto"); assert.equal(preview().uri, "new.jpg");
  reject = false; await press("Buang foto"); assert.equal(saved.at(-1), null); assert.equal(preview().uri, null);
  assert.equal(button(render(), "Buang foto"), undefined); assert.ok(button(render(), "Pilih dari galeri"));
  await press("Batal"); assert.equal(backs, 1);
  await press("Pilih dari galeri"); assert.equal(preview().uri, "new.jpg");
  theme.background = "#151718";
  assert.equal(render().props.style.backgroundColor, "#151718");
  assert.equal(nodes(render()).find(n => n.type === "StatusBar").props.barStyle, "light-content");
});

test("profile avatar falls back on missing/broken images and uses a changed photo URL", () => {
  const h = state();
  const { ProfileAvatar } = load("components/profile/ProfileAvatar.tsx", {
    react: h.react, "react/jsx-runtime": { jsx, jsxs: jsx },
    "@expo/vector-icons": { Ionicons: "Icon" }, "react-native": { Image: "Image", View: "View", Text: "Text" },
    "@/utils/newsComments": load("utils/newsComments.ts", {}),
    "@/hooks/useAppTheme": { useAppTheme: () => ({}) },
    "@/utils/newsImage": { resolveNewsImage: uri => "resolved/" + uri },
  });
  assert.equal(h.render(() => ProfileAvatar({})).type, "View");
  assert.ok(text(h.render(() => ProfileAvatar({ name: " Kuan Pratama " }))).includes("K"));
  assert.ok(text(h.render(() => ProfileAvatar({ name: "Nur Aina" }))).includes("N"));
  const image = h.render(() => ProfileAvatar({ uri: "one.jpg" }));
  assert.equal(image.props.source.uri, "resolved/one.jpg");
  image.props.onError();
  assert.equal(h.render(() => ProfileAvatar({ uri: "one.jpg" })).type, "View");
  assert.equal(h.render(() => ProfileAvatar({ uri: "two.jpg" })).type, "Image");
});

test("existing comment and reply rows render author photos with a safe fallback", () => {
  for (const depth of [0, 1]) {
    const h = state();
    const { CommentRow } = load("components/news/CommentRow.tsx", {
      react: { ...h.react, memo: fn => fn }, "react/jsx-runtime": { jsx, jsxs: jsx },
      "react-native": { Image: "Image", View: "View", Text: "Text", StyleSheet: { create: value => value } },
      "heroui-native/button": { Button: "Button" }, "@expo/vector-icons": { Ionicons: "Icon" },
      "@/utils/newsComments": { commenterName: item => item.author, commentInitials: load("utils/newsComments.ts", {}).commentInitials },
      "@/utils/newsFilters": { newsPostingTime: () => "" }, "./FeaturedCard": { newsImage: uri => uri },
    });
    const props = { comment: { id: "1", author: "Test User", avatar: "http://localhost:8088/storage/profile-photos/test.jpg", content: "Existing comment" },
      depth, theme: {}, now: Date.now(), canReport: false, disabled: false, onReply() {}, onReport() {} };
    const render = () => h.render(() => CommentRow(props));
    const image = nodes(render()).find(n => n.type === "Image");
    assert.equal(image.props.source.uri, props.comment.avatar);
    image.props.onError();
    assert.equal(nodes(render()).some(n => n.type === "Image"), false);
    assert.ok(text(render()).includes("T"));
    props.comment.avatar = "http://localhost:8088/storage/profile-photos/new.jpg";
    assert.equal(nodes(render()).find(n => n.type === "Image").props.source.uri, props.comment.avatar);
  }
});
