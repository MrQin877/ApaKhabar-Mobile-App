/* global __dirname */
const assert = require("node:assert/strict");
const { test } = require("node:test");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");
function load(file, mocks = {}) {
  const exports = {};
  const code = ts.transpileModule(fs.readFileSync(path.join(__dirname, "..", file), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  vm.runInNewContext(code, { exports, setInterval: () => 0, clearInterval() {}, require(name) {
    if (!(name in mocks)) throw new Error("Unexpected dependency: " + name);
    return mocks[name];
  } });
  return exports;
}
const validators = load("utils/formValidation.ts");
test("email, identifier, phone and password formats and confirmations", () => {
  assert.ok(validators.emailError("kuan.p@"));
  assert.equal(validators.emailError("kuan.p@example.com"), "");
  assert.ok(validators.identifierError("invalid-email"));
  assert.equal(validators.identifierError("+60123456789"), "");
  assert.equal(validators.phoneError("+628123456789"), "");
  assert.ok(validators.phoneError("+601"));
  assert.ok(validators.passwordError("short"));
  assert.equal(validators.passwordError("12345678"), "");
  assert.ok(validators.confirmationError("12345678")("different"));
  assert.equal(validators.confirmationError("12345678")("12345678"), "");
});
test("Laravel field errors preserve server messages and reject malformed payloads", () => {
  const result = validators.serverFieldErrors({ response: { data: { errors: {
    email: ["Already registered"], current_password: "Wrong password", invalid: [42],
  } } } });
  assert.equal(result.email, "Already registered");
  assert.equal(result.current_password, "Wrong password");
  assert.equal(result.invalid, undefined);
  assert.equal(Object.keys(validators.serverFieldErrors(null)).length, 0);
});
const jsx = (type, props) => ({ type, props });
const theme = { error: "#BC3232", warning: "#FEE8E8" };
const commonMocks = {
  "react/jsx-runtime": { jsx, jsxs: jsx },
  "react-native": { Text: "Text", View: "View", TextInput: "TextInput", StyleSheet: { create: x => x } },
  "../../constants/theme": { getTheme: () => theme },
  "../../hooks/use-color-scheme": { useColorScheme: () => "light" },
};
test("invalid fields are red immediately, corrected fields clear, backend errors are inline", () => {
  let touched = false;
  const { FormInput } = load("components/ui/FormInput.tsx", {
    ...commonMocks, react: { useState: () => [touched, value => { touched = value; }] },
    "./FormError": { FormError: "FormError" },
  });
  const invalid = FormInput({ value: "kuan.p@", validate: validators.emailError });
  assert.equal(invalid.props.children[0].props.style[1].borderColor, theme.error);
  assert.ok(invalid.props.children[1].props.message);
  const corrected = FormInput({ value: "kuan.p@example.com", validate: validators.emailError });
  assert.equal(corrected.props.children[0].props.style[1], undefined);
  const backend = FormInput({ value: "kuan.p@example.com", error: "Already registered", validate: validators.emailError });
  assert.equal(backend.props.children[1].props.message, "Already registered");
  FormInput({ value: "", validate: validators.emailError }).props.children[0].props.onBlur({});
  assert.ok(FormInput({ value: "", validate: validators.emailError }).props.children[1].props.message);
});
test("submission errors use an accessible red box; absent messages render nothing", () => {
  const { FormError } = load("components/ui/FormError.tsx", {
    ...commonMocks, "@expo/vector-icons": { Ionicons: "Ionicons" },
  });
  assert.equal(FormError({ message: "" }), null);
  const banner = FormError({ message: "Wrong password" });
  assert.equal(banner.props.accessibilityRole, "alert");
  assert.equal(banner.props.style[1].backgroundColor, theme.warning);
  assert.equal(banner.props.children[1].props.style[1].color, theme.error);
  const inline = FormError({ message: "Invalid email", inline: true });
  assert.equal(inline.type, "Text");
  assert.equal(inline.props.style[1].color, theme.error);
});

function screenHarness(file, services = {}) {
  const slots = [];
  let cursor = 0;
  const react = {
    useState(initial) {
      const i = cursor++;
      if (!slots[i]) {
        const entry = { value: initial };
        entry.set = next => { entry.value = typeof next === "function" ? next(entry.value) : next; };
        slots[i] = entry;
      }
      return [slots[i].value, slots[i].set];
    },
    useRef(initial) { const i = cursor++; return slots[i] ||= { current: initial }; },
  };
  const deps = {
    react,
    "react/jsx-runtime": { jsx, jsxs: jsx },
    "react-native": { ...commonMocks["react-native"], ActivityIndicator: "Loading",
      StatusBar: "StatusBar", TouchableOpacity: "Pressable" },
    "@expo/vector-icons": { Ionicons: "Icon" },
    "heroui-native/button": { Button: "Button" },
    "expo-router": { router: { replace() {}, push() {}, back() {} }, useLocalSearchParams: () => ({}) },
    "react-native-safe-area-context": { useSafeAreaInsets: () => ({ top: 0, bottom: 0 }) },
    "@/components/ui/FormInput": { FormInput: "FormInput" },
    "@/components/ui/FormError": { FormError: "FormError" },
    "@/utils/formValidation": validators,
    "@/utils/passwordReset": { resetParameters: () => ({ valid: true, token: "test", email: "reader@example.test" }),
      passwordResetError: error => error.response?.data?.message || "Reset failed" },
  };
  for (const prefix of ["../../", "../../../"]) {
    deps[prefix + "components/KeyboardForm"] = { KeyboardForm: "KeyboardForm" };
    deps[prefix + "components/auth/AuthButton"] = { AuthButton: "AuthButton" };
    deps[prefix + "components/auth/PasswordInput"] = { PasswordInput: "PasswordInput" };
    deps[prefix + "components/phone-number-input"] = { PhoneNumberInput: "PhoneNumberInput" };
    deps[prefix + "constants/theme"] = { Design: { contentWidth: 680 }, getTheme: () => ({ ...theme, text: "#111", border: "#ddd", background: "#fff" }) };
    deps[prefix + "hooks/use-color-scheme"] = { useColorScheme: () => "light" };
    deps[prefix + "services/authService"] = services;
    deps[prefix + "services/phoneVerification"] = { phoneVerificationError: error => error.response?.data?.message || "Phone failed", ...services };
    deps[prefix + "services/phonePasswordReset"] = services;
  }
  deps["../../components/ui/tabs"] = { Tabs: "Tabs", TabsList: "TabsList", TabsTrigger: "TabsTrigger" };
  deps["../../../components/profile/ApprovedBadge"] = { ApprovedBadge: "ApprovedBadge" };
  deps["../../../hooks/useVerifiedProfile"] = { useVerifiedProfile: () => ({
    user: { name: "Test", email: "old@example.test", email_verified_at: "verified" },
    confirmed: true, loading: false, refresh: async () => {},
  }) };
  deps["../../../services/emailVerification"] = { verificationError: error => error.response?.data?.message || "Update failed" };
  deps["../../../services/api"] = { __esModule: true, default: { post: services.post } };
  const Screen = load(file, deps).default;
  const render = () => { cursor = 0; return Screen(); };
  return { render };
}
function nodes(tree) {
  return Array.isArray(tree) ? tree.flatMap(nodes)
    : tree && typeof tree === "object" ? [tree, ...nodes(tree.props?.children)] : [];
}
const findField = (tree, label) => nodes(tree).find(n => n.props?.accessibilityLabel === label);
const action = tree => nodes(tree).find(n => n.type === "AuthButton");
const messages = tree => nodes(tree).filter(n => n.type === "FormError").map(n => n.props.message).filter(Boolean);
test("edit email blocks invalid submissions, maps Laravel field errors, and clears errors on correction", async () => {
  let calls = 0;
  const h = screenHarness("app/(tabs)/profile/change-email.tsx", {
    updateProfile: async () => { calls++; throw { response: { data: { message: "Update failed", errors: { email: ["Email already used"] } } } }; },
  });
  findField(h.render(), "Alamat e-mail").props.onChangeText("kuan.p@");
  let tree = h.render();
  assert.ok(findField(tree, "Alamat e-mail").props.validate("kuan.p@"));
  await action(tree).props.onPress();
  assert.equal(calls, 0);
  assert.ok(findField(h.render(), "Alamat e-mail").props.error);
  findField(h.render(), "Alamat e-mail").props.onChangeText("new@example.test");
  await action(h.render()).props.onPress();
  tree = h.render();
  assert.equal(calls, 1);
  assert.equal(findField(tree, "Alamat e-mail").props.error, "Email already used");
  assert.ok(messages(tree).includes("Update failed"));
  findField(tree, "Alamat e-mail").props.onChangeText("corrected@example.test");
  assert.equal(findField(h.render(), "Alamat e-mail").props.error, undefined);
  assert.equal(messages(h.render()).length, 0);
});
test("forgot password validates email before sending and keeps backend failure visible", async () => {
  let calls = 0;
  const h = screenHarness("app/(auth)/forgot-password.tsx", {
    forgotPassword: async () => { calls++; throw { response: { data: { message: "Mail unavailable" } } }; },
  });
  let field = nodes(h.render()).find(n => n.type === "FormInput");
  field.props.onChangeText("invalid@");
  await action(h.render()).props.onPress();
  assert.equal(calls, 0);
  field = nodes(h.render()).find(n => n.type === "FormInput");
  assert.ok(field.props.error);
  field.props.onChangeText("reader@example.test");
  // Do not start real countdown timers in this screen-level fixture.
  const originalInterval = global.setInterval;
  global.setInterval = () => 0;
  try { await action(h.render()).props.onPress(); } finally { global.setInterval = originalInterval; }
  assert.equal(calls, 1);
  assert.ok(messages(h.render()).includes("Mail unavailable"));
});
test("phone change blocks invalid numbers and displays OTP request failures", async () => {
  let calls = 0;
  const h = screenHarness("app/(tabs)/profile/change-phone.tsx", {
    requestPhoneChangeOtp: async () => { calls++; throw { response: { data: { message: "SMS unavailable", errors: { phone: ["Phone rejected"] } } } }; },
  });
  await action(h.render()).props.onPress();
  assert.equal(calls, 0);
  assert.ok(nodes(h.render()).find(n => n.type === "PhoneNumberInput").props.error);
  nodes(h.render()).find(n => n.type === "PhoneNumberInput").props.onChangeText("+60123456789");
  await action(h.render()).props.onPress();
  assert.equal(calls, 1);
  assert.ok(messages(h.render()).includes("SMS unavailable"));
  assert.equal(nodes(h.render()).find(n => n.type === "PhoneNumberInput").props.error, "Phone rejected");
});
test("reset password targets length and confirmation errors, then preserves backend errors", async () => {
  let calls = 0;
  const h = screenHarness("app/(auth)/reset-password.tsx", {
    resetPassword: async () => { calls++; throw { response: { data: { message: "Expired token", errors: { password: ["Password rejected"] } } } }; },
  });
  await action(h.render()).props.onPress();
  let fields = nodes(h.render()).filter(n => n.type === "PasswordInput");
  assert.ok(fields[0].props.error); assert.ok(fields[1].props.error); assert.equal(calls, 0);
  fields[0].props.onChangeText("Password123");
  fields = nodes(h.render()).filter(n => n.type === "PasswordInput");
  fields[1].props.onChangeText("different");
  fields = nodes(h.render()).filter(n => n.type === "PasswordInput");
  assert.ok(fields[1].props.validate("different"));
  await action(h.render()).props.onPress(); assert.equal(calls, 0);
  fields[1].props.onChangeText("Password123");
  await action(h.render()).props.onPress();
  assert.equal(calls, 1);
  assert.ok(messages(h.render()).includes("Expired token"));
  assert.equal(nodes(h.render()).find(n => n.type === "PasswordInput").props.error, "Password rejected");
});
test("change password targets the rejected current password without marking every field", async () => {
  let calls = 0;
  const h = screenHarness("app/(tabs)/profile/change-password.tsx", {
    post: async () => { calls++; throw { response: { data: { message: "Wrong password", errors: { current_password: ["Wrong current password"] } } } }; },
  });
  const fill = (index, value) => nodes(h.render()).filter(n => n.type === "PasswordInput")[index].props.onChangeText(value);
  fill(0, "OldPassword"); fill(1, "NewPassword123"); fill(2, "NewPassword123");
  await action(h.render()).props.onPress();
  const fields = nodes(h.render()).filter(n => n.type === "PasswordInput");
  assert.equal(calls, 1);
  assert.equal(fields[0].props.error, "Wrong current password");
  assert.equal(fields[1].props.error, undefined);
  assert.equal(fields[2].props.error, undefined);
  assert.ok(messages(h.render()).includes("Wrong password"));
});
