import { Slot } from 'expo-router';
import { AppearanceProvider } from '../context/AppearanceContext';

export default function RootLayout() {
  return (
    <AppearanceProvider>
      <Slot />
    </AppearanceProvider>
  );
}