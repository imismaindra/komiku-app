import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTheme } from '@/hooks/use-theme';
import { fetchMangaDetail, formatViewCount, getMangaStatusLabel, getCountryFlag } from '@/services/mangaApi';
import { Spacing } from '@/constants/theme';
import type { MangaItem } from '@/types';

export default function MangaDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const theme = useTheme();

  const [manga, setManga] = useState<MangaItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [descExpanded, setDescExpanded] = useState(false);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const res = await fetchMangaDetail(id);
        if (res.retcode === 0) {
          setManga(res.data);
        } else {
          setError('Manga tidak ditemukan');
        }
      } catch {
        setError('Gagal memuat detail manga');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: '#0A0A0F' }]}>
        <ActivityIndicator size="large" color="#FF6B35" />
        <Text style={styles.loadingText}>Memuat detail...</Text>
      </View>
    );
  }

  if (error || !manga) {
    return (
      <View style={[styles.center, { backgroundColor: '#0A0A0F' }]}>
        <Text style={styles.errorEmoji}>😵</Text>
        <Text style={styles.errorTitle}>Oops!</Text>
        <Text style={styles.errorText}>{error ?? 'Manga tidak ditemukan'}</Text>
        <Pressable
          style={styles.backBtn}
          onPress={() => {
            if (router.canGoBack()) {
              router.back();
            } else {
              router.replace('/');
            }
          }}
        >
          <Text style={styles.backBtnText}>← Kembali</Text>
        </Pressable>
      </View>
    );
  }

  const genres = manga.taxonomy?.Genre ?? [];
  const authors = manga.taxonomy?.Author ?? [];
  const format = manga.taxonomy?.Format?.[0]?.name ?? 'Unknown';
  const description = manga.description ?? 'Tidak ada deskripsi.';

  return (
    <View style={[styles.root, { backgroundColor: '#0A0A0F' }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Hero Cover */}
        <View style={styles.hero}>
          <Image
            source={{ uri: manga.cover_portrait_url || manga.cover_image_url }}
            style={styles.heroCover}
            contentFit="cover"
            transition={300}
          />
          <LinearGradient
            colors={['transparent', 'rgba(10,10,15,0.6)', '#0A0A0F']}
            style={styles.heroGradient}
          />
          {/* Back button */}
          <SafeAreaView style={styles.heroOverlay}>
            <Pressable
              style={styles.heroBackBtn}
              onPress={() => {
                if (router.canGoBack()) {
                  router.back();
                } else {
                  router.replace('/');
                }
              }}
            >
              <Text style={styles.heroBackText}>←</Text>
            </Pressable>
          </SafeAreaView>
        </View>

        {/* Content */}
        <View style={styles.content}>
          {/* Title & Format */}
          <View style={styles.titleRow}>
            <View style={styles.formatBadge}>
              <Text style={styles.formatText}>
                {getCountryFlag(manga.country_id)} {format}
              </Text>
            </View>
            {manga.is_recommended && (
              <View style={styles.recommendedBadge}>
                <Text style={styles.recommendedText}>⭐ Featured</Text>
              </View>
            )}
          </View>
          <Text style={styles.title}>{manga.title}</Text>
          {manga.alternative_title && (
            <Text style={styles.altTitle} numberOfLines={1}>
              {manga.alternative_title}
            </Text>
          )}

          {/* Stats */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>⭐ {manga.user_rate}</Text>
              <Text style={styles.statLabel}>Rating</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>👁️ {formatViewCount(manga.view_count)}</Text>
              <Text style={styles.statLabel}>Views</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>🔖 {formatViewCount(manga.bookmark_count)}</Text>
              <Text style={styles.statLabel}>Bookmark</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>📑 {manga.latest_chapter_number}</Text>
              <Text style={styles.statLabel}>Chapter</Text>
            </View>
          </View>

          {/* Genre Tags */}
          <View style={styles.genreRow}>
            {genres.map((g) => (
              <View key={g.slug} style={styles.genreTag}>
                <Text style={styles.genreTagText}>{g.name}</Text>
              </View>
            ))}
          </View>

          {/* Info Grid */}
          <View style={styles.infoGrid}>
            <InfoItem label="Status" value={getMangaStatusLabel(manga.status)} />
            <InfoItem label="Tahun Rilis" value={manga.release_year} />
            <InfoItem label="Format" value={format} />
            <InfoItem label="Negara" value={manga.country_id === 'KR' ? 'Korea' : manga.country_id === 'CN' ? 'China' : 'Jepang'} />
          </View>

          {/* Authors */}
          {authors.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>✍️ Author</Text>
              <Text style={styles.sectionValue}>
                {authors.map((a) => a.name).join(', ')}
              </Text>
            </View>
          )}

          {/* Description */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📝 Sinopsis</Text>
            <Text
              style={styles.description}
              numberOfLines={descExpanded ? undefined : 4}
            >
              {description}
            </Text>
            <Pressable onPress={() => setDescExpanded(!descExpanded)}>
              <Text style={styles.readMoreBtn}>
                {descExpanded ? 'Sembunyikan ↑' : 'Baca selengkapnya ↓'}
              </Text>
            </Pressable>
          </View>

          {/* Read Button */}
          <Pressable
            id="read-manga-btn"
            style={({ pressed }) => [
              styles.readBtn,
              { opacity: pressed ? 0.85 : 1 },
            ]}
            onPress={() => {
              if (manga.latest_chapter_id) {
                router.push(`/chapter/${manga.latest_chapter_id}` as any);
              }
            }}
          >
            <Text style={styles.readBtnText}>📖 Mulai Baca - Chapter {manga.latest_chapter_number}</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <View style={infoStyles.container}>
      <Text style={infoStyles.label}>{label}</Text>
      <Text style={infoStyles.value}>{value}</Text>
    </View>
  );
}

const infoStyles = StyleSheet.create({
  container: {
    backgroundColor: '#13131A',
    borderRadius: 10,
    padding: Spacing.two,
    flex: 1,
    minWidth: '45%',
    alignItems: 'center',
    gap: 2,
  },
  label: {
    color: '#6B7280',
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  value: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
});

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.two,
  },
  loadingText: {
    color: '#9CA3AF',
    marginTop: Spacing.two,
  },
  errorEmoji: {
    fontSize: 48,
  },
  errorTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
  },
  errorText: {
    color: '#9CA3AF',
    fontSize: 14,
  },
  backBtn: {
    marginTop: Spacing.two,
    backgroundColor: '#FF6B35',
    borderRadius: 10,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  backBtnText: {
    color: '#fff',
    fontWeight: '700',
  },
  hero: {
    height: 320,
    position: 'relative',
  },
  heroCover: {
    width: '100%',
    height: '100%',
  },
  heroGradient: {
    ...StyleSheet.absoluteFill,
  },
  heroOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    padding: Spacing.three,
  },
  heroBackBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroBackText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
  },
  content: {
    padding: Spacing.four,
    gap: Spacing.three,
    marginTop: -Spacing.four,
  },
  titleRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  formatBadge: {
    backgroundColor: '#1E1E2E',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  formatText: {
    color: '#9CA3AF',
    fontSize: 12,
    fontWeight: '600',
  },
  recommendedBadge: {
    backgroundColor: '#FF6B3520',
    borderColor: '#FF6B35',
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  recommendedText: {
    color: '#FF6B35',
    fontSize: 12,
    fontWeight: '600',
  },
  title: {
    color: '#fff',
    fontSize: 26,
    fontWeight: '800',
    lineHeight: 32,
  },
  altTitle: {
    color: '#6B7280',
    fontSize: 13,
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: '#13131A',
    borderRadius: 14,
    padding: Spacing.three,
    alignItems: 'center',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    gap: 3,
  },
  statValue: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  statLabel: {
    color: '#6B7280',
    fontSize: 10,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#2D2D3D',
  },
  genreRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.one,
  },
  genreTag: {
    backgroundColor: '#6C63FF20',
    borderColor: '#6C63FF',
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  genreTagText: {
    color: '#6C63FF',
    fontSize: 12,
    fontWeight: '600',
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  section: {
    gap: Spacing.one,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  sectionValue: {
    color: '#9CA3AF',
    fontSize: 14,
  },
  description: {
    color: '#9CA3AF',
    fontSize: 14,
    lineHeight: 22,
  },
  readMoreBtn: {
    color: '#FF6B35',
    fontSize: 13,
    fontWeight: '600',
    marginTop: 4,
  },
  readBtn: {
    backgroundColor: '#FF6B35',
    borderRadius: 14,
    padding: Spacing.three,
    alignItems: 'center',
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 6,
    marginTop: Spacing.one,
  },
  readBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
