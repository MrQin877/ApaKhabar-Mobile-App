// Fallback for using MaterialIcons on Android and web.

import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { SymbolViewProps, SymbolWeight } from "expo-symbols";
import { ComponentProps } from "react";
import { type StyleProp, type TextStyle } from "react-native";

type IconSymbolNameValue = Extract<SymbolViewProps["name"], string>;
type IconMapping = Partial<Record<IconSymbolNameValue, ComponentProps<typeof MaterialIcons>["name"]>>;

export type IconSymbolName = IconSymbolNameValue;

/**
 * SF Symbols → Material Icons mapping.
 * Browse SF Symbols: https://developer.apple.com/sf-symbols/
 * Browse Material Icons: https://icons.expo.fyi
 */
const MAPPING: IconMapping = {
  // ── Navigation & UI ──────────────────────────────
  "house.fill": "home",
  "paperplane.fill": "send",
  "chevron.left.forwardslash.chevron.right": "code",
  "chevron.right": "chevron-right",
  "chevron.left": "chevron-left",
  xmark: "close",
  "line.horizontal.3": "menu",

  // ── Tab bar ──────────────────────────────────────
  "newspaper.fill": "newspaper",
  newspaper: "newspaper",
  "bell.fill": "notifications",
  bell: "notifications-none",
  "person.fill": "person",
  person: "person-outline",

  // ── News / Search ─────────────────────────────────
  magnifyingglass: "search",
  "slider.horizontal.3": "tune",
  "eye.fill": "visibility",
  eye: "visibility",

  // ── Interactions ──────────────────────────────────
  "heart.fill": "favorite",
  heart: "favorite-border",
  "bubble.left.fill": "chat",
  "bubble.left": "chat-bubble-outline",
  "square.and.arrow.up": "share",
  "bookmark.fill": "bookmark",
  bookmark: "bookmark-border",

  // ── Alerts & Status ───────────────────────────────
  "exclamationmark.triangle.fill": "warning",
  "exclamationmark.triangle": "warning",
  "info.circle": "info",
  "checkmark.circle.fill": "check-circle",
  "megaphone.fill": "campaign",

  // ── Auth & Profile ────────────────────────────────
  "lock.fill": "lock",
  "envelope.fill": "email",
  "phone.fill": "phone",
  "camera.fill": "camera-alt",
  gear: "settings",
  "arrow.right.square": "logout",
};

export function IconSymbol({
  name,
  size = 24,
  color,
  style,
}: {
  name: IconSymbolName;
  size?: number;
  color: ComponentProps<typeof MaterialIcons>["color"];
  style?: StyleProp<TextStyle>;
  weight?: SymbolWeight;
}) {
  return (
    <MaterialIcons
      color={color}
      size={size}
      name={MAPPING[name] ?? "help-outline"}
      style={style}
    />
  );
}
