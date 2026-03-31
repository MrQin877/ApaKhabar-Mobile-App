import React, { createContext, useContext, useEffect, useState } from 'react';
import { useColorScheme as useDeviceColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

type AppearanceMode = 'system' | 'light' | 'dark';
type ColorScheme = 'light' | 'dark';

interface AppearanceContextValue {
  appearance: AppearanceMode;      // what the user picked: system | light | dark
  colorScheme: ColorScheme;        // resolved value used by the UI: light | dark
  setAppearance: (mode: AppearanceMode) => void;
}

const STORAGE_KEY = 'user_appearance';

const AppearanceContext = createContext<AppearanceContextValue>({
  appearance: 'system',
  colorScheme: 'light',
  setAppearance: () => {},
});

export function AppearanceProvider({ children }: { children: React.ReactNode }) {
  const deviceScheme = useDeviceColorScheme() ?? 'light';
  const [appearance, setAppearanceState] = useState<AppearanceMode>('system');

  // Load saved preference on mount
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((saved) => {
      if (saved === 'light' || saved === 'dark' || saved === 'system') {
        setAppearanceState(saved);
      }
    });
  }, []);

  // Resolve: if system → use device, otherwise use user choice
  const colorScheme: ColorScheme =
    appearance === 'system' ? deviceScheme :
    appearance === 'dark'   ? 'dark'       : 'light';

  const setAppearance = async (mode: AppearanceMode) => {
    setAppearanceState(mode);
    await AsyncStorage.setItem(STORAGE_KEY, mode);
  };

  return (
    <AppearanceContext.Provider value={{ appearance, colorScheme, setAppearance }}>
      {children}
    </AppearanceContext.Provider>
  );
}

export function useAppearance() {
  return useContext(AppearanceContext);
}