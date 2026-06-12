import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { supabase, isSupabaseConfigured } from './supabaseClient';
import * as db from '../database/db';

const isWeb = Platform.OS === 'web';

// Configure default notification presentation style
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/**
 * Request user permission and obtain Expo Push Token.
 */
export async function registerForPushNotificationsAsync(): Promise<string | null> {
  if (isWeb) return null;

  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('Permission for push notifications was denied.');
      return null;
    }

    // On Android, set up notification channels
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('manga-updates', {
        name: 'Manga Updates',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF6B35',
      });
    }

    // Get the Expo Push Token using EAS project ID
    const isExpoGo = Constants.appOwnership === 'expo' || Constants.executionEnvironment === 'storeClient';
    if (isExpoGo && Platform.OS === 'android') {
      console.warn(
        '⚠️ Android Push notifications (remote) are not supported in Expo Go. ' +
        'Local notifications and Developer Simulator will still work perfectly.'
      );
      return null;
    }

    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ??
      Constants.easConfig?.projectId;

    if (!projectId) {
      console.warn('⚠️ Expo Project ID (EAS) not found in app.json. Remote push notifications are disabled. Local notifications and Developer Simulator will still work perfectly.');
      return null;
    }

    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId,
    });

    return tokenData.data;
  } catch (error) {
    console.warn('Failed to get Expo push token:', error);
    return null;
  }
}

/**
 * Upload the device push token to Supabase.
 */
export async function savePushTokenToSupabase(userId: number, pushToken: string): Promise<void> {
  if (!isSupabaseConfigured || !supabase) {
    console.log('Supabase not configured. Skipping push token upload.');
    return;
  }

  try {
    const { error } = await supabase
      .from('user_push_tokens')
      .upsert(
        { user_id: userId, push_token: pushToken },
        { onConflict: 'push_token' }
      );

    if (error) {
      console.error('Failed to save push token to Supabase:', error.message);
    } else {
      console.log('Successfully saved device push token to Supabase.');
    }
  } catch (err) {
    console.error('Error uploading push token:', err);
  }
}

/**
 * Show a local notification immediately.
 */
export async function showLocalNotification(
  title: string,
  body: string,
  data?: { manga_id?: string; chapter_id?: string }
): Promise<string | undefined> {
  if (isWeb) {
    // Browser Notifications API fallback for Web
    if ('Notification' in window) {
      if (Notification.permission === 'granted') {
        new Notification(title, { body });
      } else if (Notification.permission !== 'denied') {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          new Notification(title, { body });
        }
      }
    }
    return 'web-notification';
  }

  try {
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: data || {},
        sound: true,
        android: {
          channelId: 'manga-updates',
        },
      },
      trigger: null, // show immediately
    });
    return notificationId;
  } catch (error) {
    console.error('Error scheduling local notification:', error);
    return undefined;
  }
}

/**
 * Set up real-time listener on Supabase to receive updates.
 * When a row is inserted in 'manga_updates', trigger a notification.
 */
export function subscribeToMangaUpdates(
  userId: number,
  onNotificationReceived: (notification: any) => void
): (() => void) | null {
  if (!isSupabaseConfigured || !supabase) {
    console.log('Supabase is not configured. Real-time subscription skipped.');
    return null;
  }

  try {
    const channel = supabase
      .channel('public:manga_updates')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'manga_updates',
        },
        async (payload) => {
          console.log('Realtime manga update received:', payload);
          const newRow = payload.new;
          if (!newRow) return;

          const title = newRow.title || 'Update Komik!';
          const body = newRow.body || 'Ada komik baru yang diperbarui!';
          const mangaId = newRow.manga_id || undefined;
          const chapterId = newRow.chapter_id || undefined;

          // Save the notification log in the SQLite/AsyncStorage database locally
          const savedNotification = await db.createNotification(
            userId,
            title,
            body,
            mangaId,
            chapterId
          );

          // Trigger local push notification on the device
          await showLocalNotification(title, body, {
            manga_id: mangaId,
            chapter_id: chapterId,
          });

          // Callback to update local UI state in real-time
          if (savedNotification) {
            onNotificationReceived(savedNotification);
          }
        }
      )
      .subscribe();

    // Return unsubscribe function
    return () => {
      console.log('Unsubscribing from manga updates realtime channel');
      supabase.removeChannel(channel);
    };
  } catch (error) {
    console.error('Failed to subscribe to realtime manga updates:', error);
    return null;
  }
}
