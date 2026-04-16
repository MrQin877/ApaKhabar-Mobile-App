import { getTheme } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { View, type ViewProps } from "react-native";

export type ThemedViewProps = ViewProps & {
  variant?: "background" | "card" | "accent";
};

export function ThemedView({
  style,
  variant = "background",
  ...otherProps
}: ThemedViewProps) {
  const colorScheme = useColorScheme();
  const theme = getTheme(colorScheme);

  const backgroundColorMap = {
    background: theme.background,
    card: theme.card,
    accent: theme.accent,
  };

  return (
    <View
      style={[{ backgroundColor: backgroundColorMap[variant] }, style]}
      {...otherProps}
    />
  );
}
