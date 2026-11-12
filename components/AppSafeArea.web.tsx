import type { PropsWithChildren } from "react";
import { useAppearance } from "@/context/AppearanceContext";
import { Colors } from "@/constants/theme";

// Router 58 uses CSS safe areas on web instead of native inset measurements.
export default function AppSafeArea({ children }: PropsWithChildren) {
  const { colorScheme } = useAppearance();
  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      flex: 1,
      minHeight: 0,
      backgroundColor: Colors[colorScheme].background,
      paddingTop: "env(safe-area-inset-top, 0px)",
      paddingRight: "env(safe-area-inset-right, 0px)",
      paddingBottom: "env(safe-area-inset-bottom, 0px)",
      paddingLeft: "env(safe-area-inset-left, 0px)",
    }}>
      {children}
    </div>
  );
}
