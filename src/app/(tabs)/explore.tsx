import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { MangaCard } from '@/components/manga-card';
import { MangaCardSkeleton } from '@/components/loading-skeleton';
import { useTheme } from '@/hooks/use-theme';
import { fetchMangaList } from '@/services/mangaApi';
import { Spacing } from '@/constants/theme';
import type { MangaItem } from '@/types';

const FORMATS = ['Semua', 'Manhwa', 'Manhua', 'Manga'];

export default function ExploreScreen() {
  const theme = useTheme();
  const [allManga, setAllManga] = useState<MangaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFormat, setSelectedFormat] = useState('Semua');
  const [error, setError] = useState<string | null>(null);
  const [isFocused, setIsFocused] = useState(false);

  const loadData = useCallback(async (pageNum: number, reset: boolean = false) => {
    try {
      setError(null);
      const res = await fetchMangaList(pageNum, 24);
      if (res.retcode === 0) {
        if (reset) {
          setAllManga(res.data);
        } else {
          setAllManga((prev) => [...prev, ...res.data]);
        }
        setTotalPages(res.meta.total_page);
      }
    } catch {
      setError('Gagal memuat data.');
    }
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      await loadData(1, true);
      setLoading(false);
    })();
  }, [loadData]);

  const onLoadMore = async () => {
    if (loadingMore || page >= totalPages) return;
    const next = page + 1;
    setLoadingMore(true);
    setPage(next);
    await loadData(next, false);
    setLoadingMore(false);
  };

  const filtered = allManga.filter((m) => {
    const matchSearch =
      !searchQuery ||
      m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.alternative_title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchFormat =
      selectedFormat === 'Semua' ||
      m.taxonomy?.Format?.some((f) => f.name === selectedFormat);
    return matchSearch && matchFormat;
  });

  const renderItem = useCallback(
    ({ item }: { item: MangaItem }) => <MangaCard item={item} />,
    []
  );

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'left', 'right']}>
        {/* ── HEADER ── */}
        <View style={[styles.header, { borderBottomColor: theme.border }]}>
          <View>
            <Text style={styles.headerEyebrow}>TEMUKAN</Text>
            <Text style={[styles.headerTitle, { color: theme.text }]}>
              JELAJAH<Text style={{ color: theme.accent }}>.</Text>
            </Text>
          </View>
        </View>

        {/* ── SEARCH — flat underline style ── */}
        <View style={[styles.searchWrapper, { borderBottomColor: isFocused ? theme.accent : theme.border }]}>
          <Ionicons name="search-outline" size={16} color={isFocused ? theme.accent : '#4A4A4A'} />
          <TextInput
            id="explore-search"
            style={[styles.searchInput, { color: theme.text }]}
            placeholder="Cari judul komik..."
            placeholderTextColor="#4A4A4A"
            value={searchQuery}
            onChangeText={setSearchQuery}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery('')}>
              <Ionicons name="close" size={16} color="#4A4A4A" />
            </Pressable>
          )}
        </View>

        {/* ── FILTER ROWS ── */}
        <View style={[styles.filterSection, { borderBottomColor: theme.border }]}>
          {/* Format filter */}
          <View style={styles.filterRow}>
            <Text style={styles.filterLabel}>JENIS</Text>
            <View style={styles.filterOptions}>
              {FORMATS.map((f) => {
                const isActive = selectedFormat === f;
                return (
                  <Pressable key={f} onPress={() => setSelectedFormat(f)}>
                    <Text
                      style={[
                        styles.filterOption,
                        { color: isActive ? theme.accent : '#4A4A4A',
                          fontWeight: isActive ? '700' : '400' },
                      ]}
                    >
                      {f.toUpperCase()}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </View>

        {/* ── RESULT COUNT ── */}
        <View style={styles.resultRow}>
          <Text style={styles.resultText}>
            {loading ? '—' : `${filtered.length} JUDUL`}
          </Text>
        </View>

        {error && (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle-outline" size={14} color="#FF3B3B" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {loading ? (
          <View style={styles.skeletonGrid}>
            {[1, 2, 3, 4, 5, 6].map((i) => <MangaCardSkeleton key={i} />)}
          </View>
        ) : (
          <FlatList
            data={filtered}
            renderItem={renderItem}
            keyExtractor={(item) => item.manga_id}
            numColumns={2}
            columnWrapperStyle={styles.columnWrapper}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            onEndReached={onLoadMore}
            onEndReachedThreshold={0.3}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Text style={styles.emptyTitle}>TIDAK DITEMUKAN</Text>
                <Text style={styles.emptySubText}>
                  Coba kata kunci atau filter yang berbeda
                </Text>
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
        )}
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
    borderBottomWidth: 1,
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
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
    paddingVertical: 12,
    borderBottomWidth: 1.5,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    padding: 0,
  },
  filterSection: {
    borderBottomWidth: 1,
    paddingVertical: 10,
    gap: 8,
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
    gap: 14,
  },
  filterLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#4A4A4A',
    letterSpacing: 1.5,
    width: 44,
  },
  filterOptions: {
    flexDirection: 'row',
    gap: 14,
    flexWrap: 'wrap',
  },
  filterOption: {
    fontSize: 11,
    letterSpacing: 0.5,
  },
  resultRow: {
    paddingHorizontal: Spacing.four,
    paddingVertical: 8,
  },
  resultText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#4A4A4A',
    letterSpacing: 1.5,
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
  skeletonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: Spacing.four,
    justifyContent: 'space-between',
    paddingTop: Spacing.two,
  },
  listContent: {
    paddingTop: Spacing.two,
    paddingBottom: 20,
  },
  columnWrapper: {
    paddingHorizontal: Spacing.four,
    justifyContent: 'space-between',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    gap: 10,
    paddingHorizontal: Spacing.five,
  },
  emptyTitle: {
    color: '#F0F0F0',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 1,
  },
  emptySubText: {
    color: '#4A4A4A',
    fontSize: 12,
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  loadingMore: {
    padding: Spacing.four,
    alignItems: 'center',
  },
});
