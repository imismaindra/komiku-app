import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { MangaCard } from '@/components/manga-card';
import { MangaFeaturedCard } from '@/components/manga-featured-card';
import { MangaCardSkeleton, MangaFeaturedSkeleton } from '@/components/loading-skeleton';
import { useAuth } from '@/context/auth-context';
import { useTheme } from '@/hooks/use-theme';
import { fetchMangaList } from '@/services/mangaApi';
import { Spacing } from '@/constants/theme';
import type { MangaItem } from '@/types';

const GENRES = ['Semua', 'Action', 'Fantasy', 'Adventure', 'Romance', 'Comedy', 'Drama'];

export default function HomeScreen() {
  const { state: authState } = useAuth();
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

  return (
    <View style={[styles.root, { backgroundColor: '#0A0A0F' }]}>
      <SafeAreaView style={{ flex: 1 }}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerGreeting}>
              Halo, {authState.user?.username ?? 'Pembaca'} 👋
            </Text>
            <Text style={styles.headerTitle}>Komiku</Text>
          </View>
          <View style={styles.headerBadge}>
            <Text style={styles.headerBadgeText}>📖</Text>
          </View>
        </View>

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
              tintColor="#FF6B35"
              colors={['#FF6B35']}
            />
          }
          onEndReached={onLoadMore}
          onEndReachedThreshold={0.3}
          ListHeaderComponent={
            <View style={styles.listHeader}>
              {/* Featured Section */}
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>🔥 Featured</Text>
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
                  contentContainerStyle={{ paddingHorizontal: Spacing.four }}
                >
                  {featured.map((item) => (
                    <MangaFeaturedCard key={item.manga_id} item={item} />
                  ))}
                </ScrollView>
              )}

              {/* Genre Chips */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.genreScroll}
                contentContainerStyle={styles.genreContent}
              >
                {GENRES.map((genre) => (
                  <View
                    key={genre}
                    style={[
                      styles.genreChip,
                      selectedGenre === genre
                        ? { backgroundColor: '#FF6B35' }
                        : { backgroundColor: '#1E1E2E', borderColor: '#2D2D3D', borderWidth: 1 },
                    ]}
                    // @ts-ignore
                    onStartShouldSetResponder={() => true}
                    onResponderGrant={() => setSelectedGenre(genre)}
                  >
                    <Text
                      style={[
                        styles.genreChipText,
                        { color: selectedGenre === genre ? '#fff' : '#9CA3AF' },
                      ]}
                    >
                      {genre}
                    </Text>
                  </View>
                ))}
              </ScrollView>

              {/* Popular Section Header */}
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>📚 {selectedGenre === 'Semua' ? 'Semua Komik' : selectedGenre}</Text>
                <Text style={styles.sectionCount}>{filteredManga.length} komik</Text>
              </View>

              {error && (
                <View style={styles.errorBox}>
                  <Text style={styles.errorText}>⚠️ {error}</Text>
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
                <ActivityIndicator color="#FF6B35" />
                <Text style={styles.loadingMoreText}>Memuat lebih banyak...</Text>
              </View>
            ) : null
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two,
    paddingTop: Spacing.three,
  },
  headerGreeting: {
    color: '#9CA3AF',
    fontSize: 13,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '800',
  },
  headerBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FF6B3520',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerBadgeText: {
    fontSize: 22,
  },
  listContent: {
    paddingBottom: 20,
  },
  listHeader: {
    marginBottom: Spacing.two,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two,
    marginTop: Spacing.two,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
  },
  sectionCount: {
    color: '#6B7280',
    fontSize: 12,
  },
  featuredScroll: {
    paddingBottom: Spacing.two,
  },
  genreScroll: {
    marginVertical: Spacing.two,
  },
  genreContent: {
    paddingHorizontal: Spacing.four,
    gap: Spacing.two,
  },
  genreChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
  },
  genreChipText: {
    fontSize: 13,
    fontWeight: '600',
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
    backgroundColor: '#FF000020',
    borderColor: '#FF6B6B',
    borderWidth: 1,
    borderRadius: 10,
    padding: Spacing.three,
    marginBottom: Spacing.two,
  },
  errorText: {
    color: '#FF6B6B',
    fontSize: 13,
  },
  loadingMore: {
    padding: Spacing.four,
    alignItems: 'center',
    gap: Spacing.two,
  },
  loadingMoreText: {
    color: '#6B7280',
    fontSize: 13,
  },
});
