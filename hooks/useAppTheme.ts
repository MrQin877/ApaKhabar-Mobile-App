import { useMemo } from "react";
import { useThemeColor } from "heroui-native/hooks";
import { useCSSVariable } from "uniwind";
import { Colors, type Theme } from "@/constants/theme";
import { useColorScheme } from "./use-color-scheme";

// CSS variables are unavailable during Expo's web server rendering pass.
const resolvedColor = (value: string, fallback: string) => value && value !== "invalid" ? value : fallback;

/** HeroUI tokens for custom editorial layouts and the Router tab navigator. */
export function useAppTheme(): Theme {
  const scheme = useColorScheme() ?? "light";
  const [background, text, card, secondary, primary, accent, border, error, overlay] = useThemeColor([
    "background", "foreground", "surface", "muted", "accent", "default", "border", "danger", "backdrop",
  ]);
  const [warningColor, communityColor] = useCSSVariable(["--news-warning", "--news-community"]);
  const warning = typeof warningColor === "string" ? warningColor : Colors[scheme].warning;
  const communityBg = typeof communityColor === "string" ? communityColor : Colors[scheme].communityBg;
  return useMemo(() => {
    const fallback = Colors[scheme];
    const resolvedPrimary = resolvedColor(primary, fallback.primary);
    const resolvedSecondary = resolvedColor(secondary, fallback.secondary);
    return {
      ...fallback,
      background: resolvedColor(background, fallback.background), text: resolvedColor(text, fallback.text),
      card: resolvedColor(card, fallback.card), secondary: resolvedSecondary, primary: resolvedPrimary,
      accent: resolvedColor(accent, fallback.accent), border: resolvedColor(border, fallback.border),
      error: resolvedColor(error, fallback.error), overlay: resolvedColor(overlay, fallback.overlay),
      warning, emergencyBg: warning, communityBg, tint: resolvedPrimary,
      tabIconSelected: resolvedPrimary, tabIconDefault: resolvedSecondary,
    };
  }, [scheme, background, text, card, secondary, primary, accent, border, error, overlay, warning, communityBg]);
}
