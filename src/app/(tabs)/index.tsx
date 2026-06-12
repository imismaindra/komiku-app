import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

import { MangaCard } from '@/components/manga-card';
import { MangaFeaturedCard } from '@/components/manga-featured-card';
import { MangaCardSkeleton, MangaFeaturedSkeleton } from '@/components/loading-skeleton';
import { useAuth } from '@/context/auth-context';
import { useNotifications } from '@/context/notification-context';
import { useTheme } from '@/hooks/use-theme';
import { fetchMangaList } from '@/services/mangaApi';
import { Spacing } from '@/constants/theme';
import type { MangaItem } from '@/types';

const GENRES = ['Semua', 'Action', 'Fantasy', 'Adventure', 'Romance', 'Comedy', 'Drama'];

export default function HomeScreen() {
  const { state: authState } = useAuth();
  const { unreadCount } = useNotifications();
  const theme = useTheme();

  const [mangaList, setMangaList] = useState<MangaItem[]>([]);
  const [featured, setFeatured] = useState<MangaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedGenre, setSelectedGenre] = useState('Semua');
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async (pageNum: number, reset: boolean = false) => {
    try {
      setError(null);
      const res = await fetchMangaList(pageNum, 24);
      if (res.retcode === 0) {
        const newItems = res.data;
        if (reset) {
          setMangaList(newItems);
          setFeatured(newItems.filter((m) => m.is_recommended).slice(0, 5));
        } else {
          setMangaList((prev) => [...prev, ...newItems]);
        }
        setTotalPages(res.meta.total_page);
      }
    } catch {
      setError('Gagal memuat data. Periksa koneksi internet.');
    }
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      await loadData(1, true);
      setLoading(false);
    })();
  }, [loadData]);

  const onRefresh = async () => {
    setRefreshing(true);
    setPage(1);
    await loadData(1, true);
    setRefreshing(false);
  };

  const onLoadMore = async () => {
    if (loadingMore || page >= totalPages) return;
    const nextPage = page + 1;
    setLoadingMore(true);
    setPage(nextPage);
    await loadData(nextPage, false);
    setLoadingMore(false);
  };

  const filteredManga =
    selectedGenre === 'Semua'
      ? mangaList
      : mangaList.filter((m) =>
          m.taxonomy?.Genre?.some((g) => g.name === selectedGenre)
        );

  const renderMangaItem = useCallback(
    ({ item }: { item: MangaItem }) => <MangaCard item={item} />,
    []
  );

  const username = authState.user?.username ?? 'Pembaca';

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'left', 'right']}>
        <FlatList
          data={filteredManga}
          renderItem={renderMangaItem}
          keyExtractor={(item) => item.manga_id}
          numColumns={2}
          columnWrapperStyle={styles.columnWrapper}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={theme.accent}
              colors={[theme.accent]}
            />
          }
          onEndReached={onLoadMore}
          onEndReachedThreshold={0.3}
          ListHeaderComponent={
            <View>
              {/* ── HEADER ── */}
              <View style={styles.header}>
                <View style={styles.headerRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.headerEyebrow}>SELAMAT DATANG,</Text>
                    <Text style={[styles.headerTitle, { color: theme.text }]}>
                      {username.toUpperCase()}
                      <Text style={[styles.headerDot, { color: theme.accent }]}>.</Text>
                    </Text>
                  </View>
                  <Pressable
                    onPress={() => router.push('/notifications')}
                    style={styles.bellButton}
                  >
                    <Ionicons name="notifications-outline" size={24} color={theme.text} />
                    {unreadCount > 0 && (
                      <View style={[styles.bellBadge, { backgroundColor: theme.accent }]}>
                        <Text style={[styles.bellBadgeText, { color: theme.background }]}>
                          {unreadCount > 9 ? '9+' : unreadCount}
                        </Text>
                      </View>
                    )}
                  </Pressable>
                </View>
                <View style={[styles.headerRule, { backgroundColor: theme.border }]} />
              </View>

              {/* ── FEATURED SECTION ── */}
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionEyebrow}>01</Text>
                <Text style={[styles.sectionTitle, { color: theme.text }]}>Rekomendasi</Text>
              </View>

              {loading ? (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.featuredScroll}>
                  {[1, 2].map((i) => <MangaFeaturedSkeleton key={i} />)}
                </ScrollView>
              ) : (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.featuredScroll}
                  contentContainerStyle={styles.featuredContent}
                >
                  {featured.map((item) => (
                    <MangaFeaturedCard key={item.manga_id} item={item} />
                  ))}
                </ScrollView>
              )}

              {/* ── GENRE FILTER — text-only style ── */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.genreScroll}
                contentContainerStyle={styles.genreContent}
              >
                {GENRES.map((genre) => {
                  const isActive = selectedGenre === genre;
                  return (
                    <Pressable
                      key={genre}
                      onPress={() => setSelectedGenre(genre)}
                      style={styles.genreItem}
                    >
                      <Text
                        style={[
                          styles.genreLabel,
                          { color: isActive ? theme.accent : '#4A4A4A' },
                        ]}
                      >
                        {genre.toUpperCase()}
                      </Text>
                      {isActive && (
                        <View style={[styles.genreUnderline, { backgroundColor: theme.accent }]} />
                      )}
                    </Pressable>
                  );
                })}
              </ScrollView>

              {/* ── COLLECTION HEADER ── */}
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionEyebrow}>02</Text>
                <Text style={[styles.sectionTitle, { color: theme.text }]}>
                  {selectedGenre === 'Semua' ? 'Koleksi' : selectedGenre}
                </Text>
                <Text style={styles.sectionCount}>{filteredManga.length}</Text>
              </View>

              {error && (
                <View style={styles.errorBox}>
                  <Ionicons name="alert-circle-outline" size={14} color="#FF3B3B" />
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              )}

              {loading && (
                <View style={styles.skeletonGrid}>
                  {[1, 2, 3, 4].map((i) => <MangaCardSkeleton key={i} />)}
                </View>
              )}
            </View>
          }
          ListFooterComponent={
            loadingMore ? (
              <View style={styles.loadingMore}>
                <ActivityIndicator color={theme.accent} size="small" />
              </View>
            ) : <View style={{ height: 80 }} />
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
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.two,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bellButton: {
    position: 'relative',
    padding: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#2A2A2A',
    backgroundColor: '#141414',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bellBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  bellBadgeText: {
    fontSize: 9,
    fontWeight: '900',
  },
  headerEyebrow: {
    fontSize: 10,
    fontWeight: '700',
    color: '#4A4A4A',
    letterSpacing: 2,
    marginBottom: 2,
  },
  headerTitle: {
    fontSize: 30,
    fontWeight: '800',
    letterSpacing: -1,
    lineHeight: 34,
  },
  headerDot: {
    fontSize: 34,
    fontWeight: '900',
  },
  headerRule: {
    height: 1,
    marginTop: Spacing.three,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.two,
    gap: 10,
  },
  sectionEyebrow: {
    fontSize: 11,
    fontWeight: '700',
    color: '#4A4A4A',
    letterSpacing: 1,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.5,
    flex: 1,
  },
  sectionCount: {
    fontSize: 11,
    color: '#4A4A4A',
    fontWeight: '600',
  },
  featuredScroll: {
    paddingBottom: Spacing.two,
  },
  featuredContent: {
    paddingHorizontal: Spacing.four,
  },
  genreScroll: {
    marginTop: Spacing.one,
    borderBottomWidth: 1,
    borderBottomColor: '#1E1E1E',
  },
  genreContent: {
    paddingHorizontal: Spacing.four,
    gap: 24,
  },
  genreItem: {
    paddingBottom: 10,
    paddingTop: 4,
    position: 'relative',
  },
  genreLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
  },
  genreUnderline: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 2,
  },
  listContent: {
    paddingBottom: 20,
  },
  columnWrapper: {
    paddingHorizontal: Spacing.four,
    justifyContent: 'space-between',
  },
  skeletonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: Spacing.four,
    justifyContent: 'space-between',
  },
  errorBox: {
    marginHorizontal: Spacing.four,
    backgroundColor: 'rgba(255, 59, 59, 0.08)',
    borderLeftWidth: 3,
    borderLeftColor: '#FF3B3B',
    padding: Spacing.two,
    marginBottom: Spacing.two,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  errorText: {
    color: '#FF3B3B',
    fontSize: 12,
    fontWeight: '600',
  },
  loadingMore: {
    padding: Spacing.four,
    alignItems: 'center',
  },
});
