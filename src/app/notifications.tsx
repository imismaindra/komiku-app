import React, { useState } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useNotifications } from '@/context/notification-context';
import { useTheme } from '@/hooks/use-theme';
import { Spacing } from '@/constants/theme';
import type { AppNotification } from '@/types';

export default function NotificationsScreen() {
  const theme = useTheme();
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    simulateNotification,
  } = useNotifications();

  const [showSimulator, setShowSimulator] = useState(true);

  // Helper to format timestamps nicely
  const formatTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
      }) + ' - ' + date.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
      });
    } catch {
      return isoString;
    }
  };

  // Predefined lists of mock mangas and titles for simulation
  const mockMangas = [
    { id: 'solo-leveling', title: 'Solo Leveling' },
    { id: 'one-piece', title: 'One Piece' },
    { id: 'chainsaw-man', title: 'Chainsaw Man' },
    { id: 'dandadan', title: 'Dandadan' },
    { id: 'kaiju-no-8', title: 'Kaiju No. 8' },
  ];

  const handleSimulateNewComic = async () => {
    const randomManga = mockMangas[Math.floor(Math.random() * mockMangas.length)];
    const title = 'Komik Baru Rilis! 🔥';
    const body = `"${randomManga.title}" kini telah tersedia di Komiku App. Mulai membaca sekarang!`;
    await simulateNotification(title, body, randomManga.id);
  };

  const handleSimulateChapterUpdate = async () => {
    const randomManga = mockMangas[Math.floor(Math.random() * mockMangas.length)];
    const randomChapterNum = Math.floor(Math.random() * 10) + 120;
    const title = 'Update Chapter Baru! ⚡';
    const body = `Chapter ${randomChapterNum} untuk komik "${randomManga.title}" telah rilis. Baca kelanjutannya!`;
    await simulateNotification(title, body, randomManga.id, `ch-${randomChapterNum}`);
  };

  const handleSimulateBroadcast = async () => {
    const title = 'Pengumuman Sistem 🛠️';
    const body = 'Server Komiku App akan mengalami pemeliharaan terjadwal malam ini pukul 23:00 WIB.';
    await simulateNotification(title, body);
  };

  const handleNotificationPress = async (item: AppNotification) => {
    // Mark as read first
    if (item.is_read === 0) {
      await markAsRead(item.id);
    }
    
    // Navigate if there is a manga ID
    if (item.manga_id) {
      router.push(`/manga/${item.manga_id}`);
    }
  };

  const renderNotificationItem = ({ item }: { item: AppNotification }) => {
    const isUnread = item.is_read === 0;

    return (
      <Pressable
        onPress={() => handleNotificationPress(item)}
        style={[
          styles.card,
          {
            backgroundColor: theme.cardBackground,
            borderColor: isUnread ? theme.accent : theme.border,
            borderLeftWidth: isUnread ? 4 : 1,
          },
        ]}
      >
        <View style={styles.cardHeader}>
          <View style={styles.cardTitleRow}>
            {isUnread && (
              <View style={[styles.unreadDot, { backgroundColor: theme.accent }]} />
            )}
            <Text
              style={[
                styles.cardTitle,
                { color: theme.text, fontWeight: isUnread ? '700' : '500' },
              ]}
              numberOfLines={1}
            >
              {item.title}
            </Text>
          </View>
          <Pressable
            onPress={() => deleteNotification(item.id)}
            hitSlop={8}
            style={styles.deleteButton}
          >
            <Ionicons name="trash-outline" size={16} color={theme.accentSecondary} />
          </Pressable>
        </View>

        <Text style={[styles.cardBody, { color: theme.textSecondary }]}>
          {item.body}
        </Text>

        <View style={styles.cardFooter}>
          <Text style={[styles.cardTime, { color: theme.textSecondary }]}>
            {formatTime(item.created_at)}
          </Text>
          {item.manga_id && (
            <View style={[styles.linkBadge, { borderColor: theme.accent }]}>
              <Text style={[styles.linkBadgeText, { color: theme.accent }]}>
                BACA SEKARANG →
              </Text>
            </View>
          )}
        </View>
      </Pressable>
    );
  };

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'left', 'right']}>
        {/* ── HEADER ── */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color={theme.text} />
          </Pressable>
          <View style={styles.headerTitleContainer}>
            <Text style={[styles.headerTitle, { color: theme.text }]}>
              NOTIFIKASI
              {unreadCount > 0 && (
                <Text style={{ color: theme.accent }}> ({unreadCount})</Text>
              )}
            </Text>
          </View>
          {notifications.length > 0 && unreadCount > 0 ? (
            <Pressable onPress={markAllAsRead} style={styles.markAllRead}>
              <Text style={[styles.markAllReadText, { color: theme.accent }]}>
                BACA SEMUA
              </Text>
            </Pressable>
          ) : (
            <View style={{ width: 60 }} />
          )}
        </View>
        <View style={[styles.headerDivider, { backgroundColor: theme.border }]} />

        {/* ── SIMULATOR PANEL (COLLAPSIBLE DEVELOPMENT MODE) ── */}
        <View style={[styles.simulatorWrapper, { borderColor: theme.border }]}>
          <Pressable
            onPress={() => setShowSimulator(!showSimulator)}
            style={[styles.simulatorHeader, { backgroundColor: theme.backgroundElement }]}
          >
            <Ionicons name="terminal-outline" size={16} color={theme.accent} />
            <Text style={[styles.simulatorTitle, { color: theme.text }]}>
              CYBER SYSTEM NOTIFIER SIMULATOR
            </Text>
            <Ionicons
              name={showSimulator ? 'chevron-up' : 'chevron-down'}
              size={16}
              color={theme.textSecondary}
            />
          </Pressable>

          {showSimulator && (
            <View style={[styles.simulatorBody, { backgroundColor: theme.background }]}>
              <Text style={[styles.simulatorLabel, { color: theme.textSecondary }]}>
                Gunakan tombol di bawah ini untuk mensimulasikan notifikasi update komik secara real-time:
              </Text>
              <View style={styles.simulatorButtonsRow}>
                <Pressable
                  onPress={handleSimulateNewComic}
                  style={[styles.simButton, { borderColor: theme.accent }]}
                >
                  <Text style={[styles.simButtonText, { color: theme.accent }]}>
                    + KOMIK BARU
                  </Text>
                </Pressable>
                <Pressable
                  onPress={handleSimulateChapterUpdate}
                  style={[styles.simButton, { borderColor: theme.accent }]}
                >
                  <Text style={[styles.simButtonText, { color: theme.accent }]}>
                    + CHAPTER UPDATE
                  </Text>
                </Pressable>
                <Pressable
                  onPress={handleSimulateBroadcast}
                  style={[styles.simButton, { borderColor: theme.textSecondary }]}
                >
                  <Text style={[styles.simButtonText, { color: theme.textSecondary }]}>
                    + BROADCAST
                  </Text>
                </Pressable>
              </View>
            </View>
          )}
        </View>

        {/* ── NOTIFICATION HISTORY LIST ── */}
        <FlatList
          data={notifications}
          renderItem={renderNotificationItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons
                name="notifications-off-outline"
                size={64}
                color={theme.border}
                style={{ marginBottom: Spacing.three }}
              />
              <Text style={[styles.emptyTitle, { color: theme.text }]}>
                Tidak Ada Notifikasi
              </Text>
              <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
                Notifikasi update komik favoritmu akan muncul di sini secara real-time.
              </Text>
            </View>
          }
        />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.two,
    height: 56,
  },
  backButton: {
    width: 40,
    justifyContent: 'center',
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 1,
  },
  markAllRead: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  markAllReadText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  headerDivider: {
    height: 1,
  },
  simulatorWrapper: {
    margin: Spacing.four,
    borderWidth: 1,
    borderRadius: 8,
    overflow: 'hidden',
  },
  simulatorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.three,
    paddingVertical: 10,
    gap: 8,
  },
  simulatorTitle: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    flex: 1,
  },
  simulatorBody: {
    padding: Spacing.three,
    gap: 12,
  },
  simulatorLabel: {
    fontSize: 11,
    lineHeight: 15,
  },
  simulatorButtonsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  simButton: {
    borderWidth: 1,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 4,
    backgroundColor: 'transparent',
  },
  simButtonText: {
    fontSize: 10,
    fontWeight: '800',
  },
  listContent: {
    paddingHorizontal: Spacing.four,
    paddingBottom: 40,
    gap: Spacing.three,
  },
  card: {
    borderWidth: 1,
    borderRadius: 8,
    padding: Spacing.three,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.one,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 6,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  cardTitle: {
    fontSize: 14,
    flex: 1,
  },
  deleteButton: {
    padding: 2,
  },
  cardBody: {
    fontSize: 12,
    lineHeight: 17,
    marginBottom: Spacing.two,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTime: {
    fontSize: 10,
  },
  linkBadge: {
    borderWidth: 1,
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 4,
  },
  linkBadgeText: {
    fontSize: 9,
    fontWeight: '800',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: Spacing.six,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: Spacing.one,
  },
  emptySubtitle: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
});
