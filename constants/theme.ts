import { Platform } from "react-native";

const tintColorLight = "#0a7ea4";
const tintColorDark = "#fff";

export const Colors = {
  light: {
    text: "#11181C",
    background: "#fff",
    tint: tintColorLight,
    icon: "#687076",
    tabIconDefault: "#687076",
    tabIconSelected: tintColorLight,
    // App-specific colors
    primary: "#3FCC54",
    secondary: "#AABFBA",
    accent: "#F7FAF9",
    card: "#fff",
    border: "#bdcbc6",
    error: "#E05252",
    warning: "#FEE8E8",
  },
  dark: {
    text: "#ECEDEE",
    background: "#151718",
    tint: tintColorDark,
    icon: "#9BA1A6",
    tabIconDefault: "#9BA1A6",
    tabIconSelected: tintColorDark,
    // App-specific colors
    primary: "#3FCC54",
    secondary: "#6B8880",
    accent: "#1A1A1A",
    card: "#2A2A2A",
    border: "#3A3A3A",
    error: "#E05252",
    warning: "#3D2020",
  },
};

export const Fonts = Platform.select({
  ios: {
    sans: "system-ui",
    serif: "ui-serif",
    rounded: "ui-rounded",
    mono: "ui-monospace",
  },
  default: {
    sans: "normal",
    serif: "serif",
    rounded: "normal",
    mono: "monospace",
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded:
      "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});

// Theme type — import this in all components instead of typing manually
export type Theme = typeof Colors.light;

// Helper function to get theme based on color scheme
export function getTheme(
  colorScheme: "light" | "dark" | null | undefined,
): Theme {
  return Colors[colorScheme ?? "light"];
}
