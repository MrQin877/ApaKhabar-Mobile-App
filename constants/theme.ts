import { Platform } from "react-native";

const tintColorLight = "#216E35";
const tintColorDark = "#74D68A";

export const Colors = {
  light: {
    text: "#11181C",
    background: "#fff",
    tint: tintColorLight,
    icon: "#687076",
    tabIconDefault: "#687076",
    tabIconSelected: tintColorLight,
    // App-specific colors
    primary: "#216E35",
    secondary: "#68716C",
    accent: "#F0F3F1",
    card: "#fff",
    border: "#E3E8E5",
    error: "#BC3232",
    warning: "#FEE8E8",
    overlay: "rgba(0,0,0,0.45)",
    emergencyBg: "#FEE8E8",
    communityBg: "#E8F8EC",
  },
  dark: {
    text: "#ECEDEE",
    background: "#151718",
    tint: tintColorDark,
    icon: "#9BA1A6",
    tabIconDefault: "#9BA1A6",
    tabIconSelected: tintColorDark,
    // App-specific colors
    primary: "#74D68A",
    secondary: "#A8B5AD",
    accent: "#242E28",
    card: "#1C2420",
    border: "#344039",
    error: "#FF9999",
    warning: "#3D2020",
    overlay: "rgba(0,0,0,0.65)",
    emergencyBg: "#3D2020",
    communityBg: "#1A2E1C",
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

// Theme type â€” import this in all components instead of typing manually
export type Theme = typeof Colors.light;

// Helper function to get theme based on color scheme
export function getTheme(
  colorScheme: "light" | "dark" | null | undefined,
): Theme {
  return Colors[colorScheme ?? "light"];
}

// Shared layout values for mobile surfaces.
export const Design = {
  spacing: { xs: 4, sm: 8, md: 16, lg: 24 },
  radius: { image: 10, card: 16, pill: 24 },
  contentWidth: 680,
  primaryButton: { minHeight: 52, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, alignItems: 'center' as const, justifyContent: 'center' as const },
  primaryButtonText: { fontSize: 14, lineHeight: 20, fontWeight: '700' as const },
};
