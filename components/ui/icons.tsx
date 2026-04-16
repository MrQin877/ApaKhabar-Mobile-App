import { Platform } from "react-native";
import { IconSymbol } from "./icon-symbol";
import { IconSymbol as IconSymbolIOS } from "./icon-symbol.ios";

// Unified Icon component that uses the appropriate version based on platform
export function Icon({
  name,
  size = 24,
  color,
  style,
}: {
  name: keyof typeof MAPPING;
  size?: number;
  color: string;
  style?: any;
}) {
  const IconComponent = Platform.OS === "ios" ? IconSymbolIOS : IconSymbol;
  return (
    <IconComponent name={name as any} size={size} color={color} style={style} />
  );
}

// Reusable icon components
export const MenuIcon = (props: {
  size?: number;
  color: string;
  style?: any;
}) => <Icon name="line.horizontal.3" {...props} />;

export const SearchIcon = (props: {
  size?: number;
  color: string;
  style?: any;
}) => <Icon name="magnifyingglass" {...props} />;

export const WarningIcon = (props: {
  size?: number;
  color: string;
  style?: any;
}) => <Icon name="exclamationmark.triangle" {...props} />;

export const FavoriteIcon = (props: {
  size?: number;
  color: string;
  style?: any;
}) => <Icon name="heart" {...props} />;

export const ChatIcon = (props: {
  size?: number;
  color: string;
  style?: any;
}) => <Icon name="bubble.left" {...props} />;

// Mapping for type safety (same as in icon-symbol.tsx)
const MAPPING = {
  "house.fill": "home",
  "paperplane.fill": "send",
  "chevron.left.forwardslash.chevron.right": "code",
  "chevron.right": "chevron-right",
  "line.horizontal.3": "menu",
  magnifyingglass: "search",
  "exclamationmark.triangle": "warning",
  heart: "favorite",
  "bubble.left": "chat",
};
