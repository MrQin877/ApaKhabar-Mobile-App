import { useAppearance } from '../context/AppearanceContext';

// Drop-in replacement for react-native's useColorScheme.
// All existing screens using useColorScheme() will now respect
// the user's chosen appearance (system / light / dark) automatically.
export function useColorScheme() {
  const { colorScheme } = useAppearance();
  return colorScheme;
}