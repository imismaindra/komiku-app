import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './auth-context';
import {
  registerForPushNotificationsAsync,
  subscribeToMangaUpdates,
  showLocalNotification,
  savePushTokenToSupabase,
} from '@/services/notificationService';
import { checkForApiUpdates } from '@/services/apiUpdatePoller';
import * as db from '@/database/db';
import type { AppNotification } from '@/types';

interface NotificationContextValue {
  notifications: AppNotification[];
  unreadCount: number;
  permissionGranted: boolean;
  isLoading: boolean;
  fetchNotifications: () => Promise<void>;
  markAsRead: (id: number) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: number) => Promise<void>;
  simulateNotification: (title: string, body: string, mangaId?: string, chapterId?: string) => Promise<void>;
}

const NotificationContext = createContext<NotificationContextValue | null>(null);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { state: authState } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const userId = authState.user?.id;

  // Fetch notifications from database
  const fetchNotifications = useCallback(async () => {
    if (!userId) return;
    setIsLoading(true);
    try {
      const list = await db.getNotifications(userId);
      setNotifications(list as AppNotification[]);
      
      const unread = await db.getUnreadNotificationsCount(userId);
      setUnreadCount(unread);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  // Request permissions and load initial data
  useEffect(() => {
    const initNotifications = async () => {
      if (!userId) {
        setNotifications([]);
        setUnreadCount(0);
        return;
      }

      // Request permission and get token
      const pushToken = await registerForPushNotificationsAsync();
      setPermissionGranted(!!pushToken);

      if (pushToken) {
        await savePushTokenToSupabase(userId, pushToken);
      }

      // Fetch notification history
      await fetchNotifications();
    };

    initNotifications();
  }, [userId, fetchNotifications]);

  // Subscribe to real-time updates when logged in
  useEffect(() => {
    if (!userId) return;

    // Listen to real-time changes
    const unsubscribe = subscribeToMangaUpdates(userId, (savedNotification) => {
      // Refresh list and count when a new notification is inserted
      setNotifications((prev) => [savedNotification as AppNotification, ...prev]);
      setUnreadCount((prev) => prev + 1);
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [userId]);

  // Poll the API for updates periodically when logged in
  useEffect(() => {
    if (!userId) return;

    const handleNewNotification = (savedNotification: any) => {
      setNotifications((prev) => [savedNotification as AppNotification, ...prev]);
      setUnreadCount((prev) => prev + 1);
    };

    // Run once immediately on app load/user login
    checkForApiUpdates(userId, handleNewNotification);

    // Set up recurring check every 60 seconds
    const intervalId = setInterval(() => {
      checkForApiUpdates(userId, handleNewNotification);
    }, 60000);

    return () => {
      clearInterval(intervalId);
    };
  }, [userId]);

  // Mark notification as read
  const markAsRead = async (id: number) => {
    if (!userId) return;
    try {
      await db.markNotificationAsRead(userId, id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: 1 } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    if (!userId) return;
    try {
      await db.markAllNotificationsAsRead(userId);
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: 1 })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  };

  // Delete notification
  const deleteNotification = async (id: number) => {
    if (!userId) return;
    try {
      const target = notifications.find((n) => n.id === id);
      const wasUnread = target ? target.is_read === 0 : false;
      
      await db.deleteNotification(userId, id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      if (wasUnread) {
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  };

  // Simulation function (extremely useful for manual testing and grading)
  const simulateNotification = async (
    title: string,
    body: string,
    mangaId?: string,
    chapterId?: string
  ) => {
    if (!userId) return;
    try {
      // Save locally
      const saved = await db.createNotification(userId, title, body, mangaId, chapterId);
      if (saved) {
        setNotifications((prev) => [saved as AppNotification, ...prev]);
        setUnreadCount((prev) => prev + 1);
      }
      // Show notification on device
      await showLocalNotification(title, body, { manga_id: mangaId, chapter_id: chapterId });
    } catch (error) {
      console.error('Failed to simulate notification:', error);
    }
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        permissionGranted,
        isLoading,
        fetchNotifications,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        simulateNotification,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}
