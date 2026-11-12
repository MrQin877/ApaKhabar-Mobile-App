import React, { createContext, useCallback, useContext, useState } from "react";

interface NotificationContextType {
  unreadCount: number;
  setUnreadCount: (count: number) => void;
  toastMessage: string | null;
  showToast: (message: string) => void;
  dismissToast: () => void;
}

const NotificationContext = createContext<NotificationContextType>({
  unreadCount: 0,
  setUnreadCount: () => {},
  toastMessage: null,
  showToast: () => {},
  dismissToast: () => {},
});

export function NotificationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [unreadCount, setUnreadCount] = useState(0);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = useCallback((message: string) => setToastMessage(message), []);
  const dismissToast = useCallback(() => setToastMessage(null), []);

  return (
    <NotificationContext.Provider
      value={{
        unreadCount,
        setUnreadCount,
        toastMessage,
        showToast,
        dismissToast,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotificationCount() {
  return useContext(NotificationContext);
}
