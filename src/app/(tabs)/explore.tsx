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

import { MangaCard } from '@/components/manga-card';
import { MangaCardSkeleton } from '@/components/loading-skeleton';
import { useTheme } from '@/hooks/use-theme';
import { fetchMangaList } from '@/services/mangaApi';
import { Spacing } from '@/constants/theme';
import type { MangaItem } from '@/types';

const FORMATS = ['Semua', 'Manhwa', 'Manhua', 'Manga'];
const COUNTRIES = [
  { label: 'Semua', value: '' },
  { label: '🇰🇷 Korea', value: 'KR' },
  { label: '🇨🇳 China', value: 'CN' },
  { label: '🇯🇵 Jepang', value: 'JP' },
];

export default function ExploreScreen() {
  const theme = useTheme();
  const [allManga, setAllManga] = useState<MangaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFormat, setSelectedFormat] = useState('Semua');
  const [selectedCountry, setSelectedCountry] = useState('');
  const [error, setError] = useState<string | null>(null);

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

    const matchCountry = !selectedCountry || m.country_id === selectedCountry;

    return matchSearch && matchFormat && matchCountry;
  });

  const renderItem = useCallback(
    ({ item }: { item: MangaItem }) => <MangaCard item={item} />,
    []
  );

  return (
    <View style={[styles.root, { backgroundColor: '#0A0A0F' }]}>
      <SafeAreaView style={{ flex: 1 }}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>🔍 Jelajah Komik</Text>
        </View>

        {/* Search */}
        <View style={[styles.searchBar, { backgroundColor: '#1E1E2E', borderColor: '#2D2D3D' }]}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            id="explore-search"
            style={[styles.searchInput, { color: '#fff' }]}
            placeholder="Cari judul komik..."
            placeholderTextColor="#4B5563"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery('')}>
              <Text style={styles.clearBtn}>✕</Text>
            </Pressable>
          )}
        </View>

        {/* Format Filter */}
        <View style={styles.filterRow}>
          {FORMATS.map((f) => (
            <Pressable
              key={f}
              style={[
                styles.filterChip,
                selectedFormat === f
                  ? { backgroundColor: '#FF6B35' }
                  : { backgroundColor: '#1E1E2E', borderColor: '#2D2D3D', borderWidth: 1 },
              ]}
              onPress={() => setSelectedFormat(f)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  { color: selectedFormat === f ? '#fff' : '#9CA3AF' },
                ]}
              >
                {f}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Country Filter */}
        <View style={[styles.filterRow, { marginTop: 0 }]}>
          {COUNTRIES.map((c) => (
            <Pressable
              key={c.value}
              style={[
                styles.filterChip,
                selectedCountry === c.value
                  ? { backgroundColor: '#6C63FF' }
                  : { backgroundColor: '#1E1E2E', borderColor: '#2D2D3D', borderWidth: 1 },
              ]}
              onPress={() => setSelectedCountry(c.value)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  { color: selectedCountry === c.value ? '#fff' : '#9CA3AF' },
                ]}
              >
                {c.label}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Results count */}
        <View style={styles.resultMeta}>
          <Text style={styles.resultText}>
            {loading ? 'Memuat...' : `${filtered.length} komik ditemukan`}
          </Text>
        </View>

        {error && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>⚠️ {error}</Text>
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
            contentContainerStyle={{ paddingBottom: 20, paddingHorizontal: Spacing.four }}
            showsVerticalScrollIndicator={false}
            onEndReached={onLoadMore}
            onEndReachedThreshold={0.3}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Text style={styles.emptyEmoji}>🔭</Text>
                <Text style={styles.emptyText}>Komik tidak ditemukan</Text>
                <Text style={styles.emptySubText}>Coba kata kunci lain</Text>
              </View>
            }
            ListFooterComponent={
              loadingMore ? (
                <View style={styles.loadingMore}>
                  <ActivityIndicator color="#FF6B35" />
                </View>
              ) : null
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
    paddingVertical: Spacing.two,
    paddingTop: Spacing.three,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '800',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: Spacing.four,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: Spacing.three,
    paddingVertical: 10,
    gap: 8,
    marginBottom: Spacing.two,
  },
  searchIcon: {
    fontSize: 16,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    padding: 0,
  },
  clearBtn: {
    color: '#6B7280',
    fontSize: 16,
    padding: 2,
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.four,
    gap: Spacing.one,
    marginBottom: Spacing.two,
    flexWrap: 'wrap',
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  resultMeta: {
    paddingHorizontal: Spacing.four,
    marginBottom: Spacing.two,
  },
  resultText: {
    color: '#6B7280',
    fontSize: 12,
  },
  errorBox: {
    marginHorizontal: Spacing.four,
    backgroundColor: '#FF000020',
    borderColor: '#FF6B6B',
    borderWidth: 1,
    borderRadius: 10,
    padding: Spacing.two,
    marginBottom: Spacing.two,
  },
  errorText: {
    color: '#FF6B6B',
    fontSize: 13,
  },
  skeletonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: Spacing.four,
    justifyContent: 'space-between',
  },
  columnWrapper: {
    justifyContent: 'space-between',
    marginBottom: 0,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    gap: Spacing.two,
  },
  emptyEmoji: {
    fontSize: 48,
  },
  emptyText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  emptySubText: {
    color: '#6B7280',
    fontSize: 13,
  },
  loadingMore: {
    padding: Spacing.four,
    alignItems: 'center',
  },
});
