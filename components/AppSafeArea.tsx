import type { PropsWithChildren } from "react";

// Native screens already apply their own safe-area insets.
export default function AppSafeArea({ children }: PropsWithChildren) {
  return children;
}
