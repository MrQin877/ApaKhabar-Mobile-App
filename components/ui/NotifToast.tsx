import { IconSymbol } from "@/components/ui/icon-symbol";
import { getTheme } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useEffect, useRef } from "react";
import {
    Animated,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface NotifToastProps {
  message: string | null;
  onDismiss: () => void;
}

export function NotifToast({ message, onDismiss }: NotifToastProps) {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const theme = getTheme(colorScheme);
  const translateY = useRef(new Animated.Value(-100)).current;

  useEffect(() => {
    if (!message) return;

    Animated.spring(translateY, {
      toValue: 0,
      useNativeDriver: true,
      tension: 80,
      friction: 10,
    }).start();

    const timer = setTimeout(() => {
      Animated.timing(translateY, {
        toValue: -150,
        duration: 300,
        useNativeDriver: true,
      }).start(() => onDismiss());
    }, 4000);

    return () => clearTimeout(timer);
  }, [message]);

  if (!message) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          top: insets.top + 8,
          backgroundColor: theme.warning,
          borderColor: theme.border,
          transform: [{ translateY }],
        },
      ]}
    >
      <TouchableOpacity
        style={styles.inner}
        onPress={onDismiss}
        activeOpacity={0.9}
      >
        <View style={[styles.iconWrap, { backgroundColor: theme.error }]}>
          <IconSymbol
            name="exclamationmark.triangle.fill"
            size={16}
            color="#fff"
          />
        </View>
        <View style={styles.content}>
          <Text style={[styles.title, { color: theme.error }]}>Darurat</Text>
          <Text
            numberOfLines={2}
            style={[styles.message, { color: theme.text }]}
          >
            {message}
          </Text>
        </View>
        <IconSymbol name="xmark" size={14} color={theme.secondary} />
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    left: 16,
    right: 16,
    borderRadius: 14,
    borderWidth: 0.5,
    zIndex: 999,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
  },
  inner: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    gap: 10,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  content: { flex: 1 },
  title: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.4,
    marginBottom: 2,
  },
  message: {
    fontSize: 12,
    lineHeight: 17,
  },
});
