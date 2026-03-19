import { createContext, useContext, useState, useCallback } from 'react';
import { apiRoutes } from '../api/client';

const NotificationCountContext = createContext(null);

export function NotificationCountProvider({ children }) {
  const [unreadCount, setUnreadCount] = useState(0);

  const refreshUnreadCount = useCallback(async () => {
    try {
      const res = await apiRoutes.users.getNotifications();
      const count = res.data?.length ?? 0;
      setUnreadCount(count);
      return count;
    } catch {
      return 0;
    }
  }, []);

  return (
    <NotificationCountContext.Provider value={{ unreadCount, setUnreadCount, refreshUnreadCount }}>
      {children}
    </NotificationCountContext.Provider>
  );
}

export function useNotificationCount() {
  const ctx = useContext(NotificationCountContext);
  if (!ctx) {
    return { unreadCount: 0, setUnreadCount: () => {}, refreshUnreadCount: async () => 0 };
  }
  return ctx;
}
