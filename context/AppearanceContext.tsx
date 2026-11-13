import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { useColorScheme as useDeviceColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Uniwind } from 'uniwind';

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
  const systemScheme = useDeviceColorScheme();
  const deviceScheme: ColorScheme = systemScheme === 'dark' ? 'dark' : 'light';
  const [appearance, setAppearanceState] = useState<AppearanceMode>('system');
  const changed = useRef(false);
  const pendingSave = useRef(Promise.resolve());

  useEffect(() => {
    Uniwind.setTheme(appearance);
  }, [appearance]);

  // Load saved preference on mount
  useEffect(() => {
    let active = true;
    AsyncStorage.getItem(STORAGE_KEY).then((saved) => {
      if (active && !changed.current && (saved === 'light' || saved === 'dark' || saved === 'system')) {
        setAppearanceState(saved);
      }
    }).catch(() => { /* The system theme remains available without storage. */ });
    return () => { active = false; };
  }, []);

  // Resolve: if system â†’ use device, otherwise use user choice
  const colorScheme: ColorScheme =
    appearance === 'system' ? deviceScheme :
    appearance === 'dark'   ? 'dark'       : 'light';

  const setAppearance = (mode: AppearanceMode) => {
    changed.current = true;
    setAppearanceState(mode);
    // Serialize rapid selections so an older write cannot replace the latest choice.
    pendingSave.current = pendingSave.current.then(() => AsyncStorage.setItem(STORAGE_KEY, mode))
      .catch(() => { /* Keep the session choice if storage is unavailable. */ });
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
