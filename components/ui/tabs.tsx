import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { getTheme } from "../../constants/theme";
import { useColorScheme } from "../../hooks/use-color-scheme";

interface TabsProps {
  value: string;
  onValueChange: (value: string) => void;
  children: React.ReactNode;
}

interface TabsListProps {
  children: React.ReactNode;
  tabs: string[];
}

interface TabsTriggerProps {
  value: string;
  children: React.ReactNode;
}

interface TabsContentProps {
  value: string;
  activeTab: string;
  children: React.ReactNode;
}

export function Tabs({ value, onValueChange, children }: TabsProps) {
  return (
    <View>
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child, {
            activeTab: value,
            onValueChange,
          } as any);
        }
        return child;
      })}
    </View>
  );
}

export function TabsList({
  children,
  tabs,
  activeTab,
  onValueChange,
}: TabsListProps & {
  activeTab?: string;
  onValueChange?: (value: string) => void;
}) {
  const colorScheme = useColorScheme();
  const theme = getTheme(colorScheme);

  const triggerChildren = React.Children.toArray(children).filter(
    (child) => React.isValidElement(child) && child.type === TabsTrigger,
  );

  return (
    <View
      style={[
        styles.tabsList,
        {
          backgroundColor: theme.secondary + "25",
        },
      ]}
    >
      {triggerChildren.map((child, index) => (
        <View key={index} style={styles.triggerContainer}>
          {React.isValidElement(child) &&
            React.cloneElement(child, {
              activeTab,
              onValueChange,
            } as any)}
        </View>
      ))}
    </View>
  );
}

interface TabsTriggerWithContextProps extends TabsTriggerProps {
  activeTab?: string;
  onValueChange?: (value: string) => void;
}

export function TabsTrigger({
  value,
  children,
  activeTab,
  onValueChange,
}: TabsTriggerWithContextProps) {
  const colorScheme = useColorScheme();
  const theme = getTheme(colorScheme);
  const isActive = value === activeTab;

  return (
    <TouchableOpacity
      onPress={() => onValueChange?.(value)}
      activeOpacity={0.8}
      style={[
        styles.trigger,
        {
          backgroundColor: isActive ? theme.background : "transparent",
          shadowColor: isActive ? "#000" : "transparent",
          shadowOffset: isActive
            ? { width: 0, height: 2 }
            : { width: 0, height: 0 },
          shadowOpacity: isActive ? 0.1 : 0,
          shadowRadius: isActive ? 4 : 0,
          elevation: isActive ? 3 : 0,
        },
      ]}
    >
      <Text
        style={[
          styles.triggerText,
          {
            color: isActive ? theme.text : theme.secondary,
            fontWeight: isActive ? "700" : "600",
          },
        ]}
      >
        {children}
      </Text>
    </TouchableOpacity>
  );
}

interface TabsContentWithContextProps extends TabsContentProps {
  onValueChange?: (value: string) => void;
}

export function TabsContent({
  value,
  activeTab,
  children,
}: TabsContentWithContextProps) {
  if (value !== activeTab) return null;

  return <View style={styles.content}>{children}</View>;
}

const styles = StyleSheet.create({
  tabsList: {
    flexDirection: "row",
    paddingVertical: 4,
    paddingHorizontal: 4,
    marginBottom: 24,
    borderRadius: 12,
    gap: 4,
  },
  triggerContainer: {
    flex: 1,
  },
  trigger: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
  },
  triggerText: {
    fontSize: 14,
    textAlign: "center",
  },
  content: {
    gap: 16,
  },
});
