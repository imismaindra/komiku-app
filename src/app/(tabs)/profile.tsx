import { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router, useFocusEffect } from 'expo-router';

import { useAuth } from '@/context/auth-context';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { getBookmarks, getReadHistoryCount, getReadHistory, type DbBookmark, type DbReadHistory } from '@/database/db';

export default function ProfileScreen() {
  const theme = useTheme();
  const { state, logout } = useAuth();
  const user = state.user;

  const [bookmarks, setBookmarks] = useState<DbBookmark[]>([]);
  const [historyCount, setHistoryCount] = useState(0);
  const [historyList, setHistoryList] = useState<DbReadHistory[]>([]);

  const initials = user?.username
    ? user.username.slice(0, 2).toUpperCase()
    : '??';

  const loadStats = useCallback(async () => {
    if (!user?.id) return;
    try {
      const dbBookmarks = await getBookmarks(user.id);
      const readTitlesCount = await getReadHistoryCount(user.id);
      const fullHistory = await getReadHistory(user.id);
      setBookmarks(dbBookmarks);
      setHistoryCount(readTitlesCount);
      setHistoryList(fullHistory);
    } catch (e) {
      console.warn('Error loading user database stats:', e);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      loadStats();
    }, [loadStats])
  );

  const totalChaptersRead = historyList.length;

  // Rank system
  let rank = 'PEMULA';
  let rankColor = '#4A4A4A';
  if (totalChaptersRead > 10) {
    rank = 'KAISAR';
    rankColor = '#E8FF00';
  } else if (totalChaptersRead > 4) {
    rank = 'VETERAN';
    rankColor = '#F0F0F0';
  } else if (totalChaptersRead > 0) {
    rank = 'AKTIF';
    rankColor = '#FF3B3B';
  }

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'left', 'right']}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

          {/* ── HEADER ── */}
          <View style={[styles.header, { borderBottomColor: theme.border }]}>
            <Text style={styles.headerEyebrow}>AKUN</Text>
            <Text style={[styles.headerTitle, { color: theme.text }]}>
              PROFIL<Text style={{ color: theme.accent }}>.</Text>
            </Text>
          </View>

          {/* ── USER CARD ── */}
          <View style={[styles.userCard, { borderBottomColor: theme.border }]}>
            {/* Square avatar */}
            <View style={[styles.avatar, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
              <Text style={[styles.avatarText, { color: theme.text }]}>{initials}</Text>
            </View>

            <View style={styles.userInfo}>
              {/* Rank badge */}
              <View style={[styles.rankBadge, { borderColor: rankColor }]}>
                <Text style={[styles.rankText, { color: rankColor }]}>{rank}</Text>
              </View>
              <Text style={[styles.username, { color: theme.text }]}>
                {user?.username ?? '—'}
              </Text>
              <Text style={styles.email}>{user?.email ?? '—'}</Text>
            </View>
          </View>

          {/* ── STATS ROW ── */}
          <View style={[styles.statsRow, { borderBottomColor: theme.border }]}>
            {[
              { label: 'KOMIK DIBACA', value: historyCount },
              { label: 'BOOKMARK', value: bookmarks.length },
              { label: 'TOTAL BAB', value: totalChaptersRead },
            ].map((s, i) => (
              <View key={s.label} style={[
                styles.statItem,
                i < 2 && { borderRightWidth: 1, borderRightColor: theme.border },
              ]}>
                <Text style={[styles.statValue, { color: theme.text }]}>{s.value}</Text>
                <Text style={styles.statLabel}>{s.label}</Text>
              </View>
            ))}
          </View>

          {/* ── BOOKMARKS ── */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionEyebrow}>03</Text>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Bookmark</Text>
              {bookmarks.length > 0 && (
                <Text style={styles.sectionCount}>{bookmarks.length}</Text>
              )}
            </View>

            {bookmarks.length === 0 ? (
              <View style={[styles.emptyBlock, { borderColor: theme.border }]}>
                <Text style={styles.emptyText}>BELUM ADA BOOKMARK</Text>
                <Pressable
                  style={[styles.emptyBtn, { backgroundColor: theme.accent }]}
                  onPress={() => router.push('/')}
                >
                  <Text style={[styles.emptyBtnText, { color: theme.background }]}>
                    Temukan Komik
                  </Text>
                </Pressable>
              </View>
            ) : (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.bookmarksScroll}
              >
                {bookmarks.map((item) => (
                  <Pressable
                    key={item.manga_id}
                    onPress={() => router.push(`/manga/${item.manga_id}` as any)}
                    style={styles.bookmarkCard}
                  >
                    <Image
                      source={{ uri: item.cover_url || '' }}
                      style={styles.bookmarkCover}
                      contentFit="cover"
                      transition={200}
                    />
                    <Text style={[styles.bookmarkTitle, { color: theme.text }]} numberOfLines={1}>
                      {item.manga_title}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            )}
          </View>

          {/* ── INFO SECTION ── */}
          <View style={[styles.section, { borderTopWidth: 1, borderTopColor: theme.border }]}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionEyebrow}>04</Text>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Info Akun</Text>
            </View>

            {[
              { label: 'Email', value: user?.email ?? '—' },
              { label: 'Username', value: user?.username ?? '—' },
              {
                label: 'Bergabung',
                value: user?.createdAt
                  ? new Date(user.createdAt).toLocaleDateString('id-ID', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })
                  : '—',
              },
            ].map((item) => (
              <View key={item.label} style={[styles.infoRow, { borderBottomColor: theme.border }]}>
                <Text style={styles.infoLabel}>{item.label.toUpperCase()}</Text>
                <Text style={[styles.infoValue, { color: theme.text }]} numberOfLines={1}>
                  {item.value}
                </Text>
              </View>
            ))}
          </View>

          {/* ── NOTIFICATIONS SECTION ── */}
          <View style={[styles.section, { borderTopWidth: 1, borderTopColor: theme.border }]}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionEyebrow}>05</Text>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Notifikasi</Text>
            </View>

            <Pressable
              style={({ pressed }) => [
                styles.menuRow,
                { opacity: pressed ? 0.7 : 1, borderBottomColor: theme.border }
              ]}
              onPress={() => router.push('/notifications')}
            >
              <View style={styles.menuLeft}>
                <Ionicons name="notifications-outline" size={18} color={theme.text} />
                <Text style={[styles.menuText, { color: theme.text }]}>RIWAYAT NOTIFIKASI</Text>
              </View>
              <Ionicons name="chevron-forward-outline" size={16} color={theme.textSecondary} />
            </Pressable>
          </View>

          {/* ── LOGOUT ── */}
          <View style={[styles.section, { borderTopWidth: 1, borderTopColor: theme.border }]}>
            <Pressable
              id="logout-btn"
              style={({ pressed }) => [
                styles.logoutBtn,
                { opacity: pressed ? 0.7 : 1 },
              ]}
              onPress={logout}
            >
              <Ionicons name="log-out-outline" size={15} color="#FF3B3B" />
              <Text style={styles.logoutText}>KELUAR</Text>
            </Pressable>
          </View>

          <View style={{ height: 80 }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  scroll: {
    paddingBottom: 20,
  },
  header: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.two,
    borderBottomWidth: 1,
    marginBottom: 0,
  },
  headerEyebrow: {
    fontSize: 10,
    fontWeight: '700',
    color: '#4A4A4A',
    letterSpacing: 2,
    marginBottom: 2,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -1,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
    borderBottomWidth: 1,
  },
  avatar: {
    width: 64,
    height: 64,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: 1,
  },
  userInfo: {
    flex: 1,
    gap: 4,
  },
  rankBadge: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginBottom: 2,
  },
  rankText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 2,
  },
  username: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  email: {
    fontSize: 12,
    color: '#4A4A4A',
    fontWeight: '400',
  },
  statsRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  statItem: {
    flex: 1,
    paddingVertical: Spacing.three,
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -1,
  },
  statLabel: {
    fontSize: 8,
    fontWeight: '700',
    color: '#4A4A4A',
    letterSpacing: 1,
  },
  section: {
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 10,
    marginBottom: Spacing.two,
  },
  sectionEyebrow: {
    fontSize: 11,
    fontWeight: '700',
    color: '#4A4A4A',
    letterSpacing: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.5,
    flex: 1,
  },
  sectionCount: {
    fontSize: 11,
    color: '#4A4A4A',
    fontWeight: '600',
  },
  emptyBlock: {
    borderWidth: 1,
    borderStyle: 'dashed',
    padding: Spacing.four,
    alignItems: 'center',
    gap: 12,
  },
  emptyText: {
    color: '#4A4A4A',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  emptyBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  emptyBtnText: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  bookmarksScroll: {
    gap: 12,
    paddingRight: 4,
  },
  bookmarkCard: {
    width: 96,
    gap: 6,
  },
  bookmarkCover: {
    width: 96,
    height: 134,
    borderRadius: 2,
  },
  bookmarkTitle: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.1,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  infoLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#4A4A4A',
    letterSpacing: 1.5,
    width: 80,
  },
  infoValue: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'right',
  },
  menuRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  menuText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: Spacing.two,
  },
  logoutText: {
    color: '#FF3B3B',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
});
