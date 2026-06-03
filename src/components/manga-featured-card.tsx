import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Dimensions, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import type { MangaItem } from '@/types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH - Spacing.four * 2;

interface MangaFeaturedCardProps {
  item: MangaItem;
}

export function MangaFeaturedCard({ item }: MangaFeaturedCardProps) {
  const genres = item.taxonomy?.Genre?.slice(0, 3).map((g) => g.name) ?? [];

  return (
    <Pressable
      style={styles.container}
      onPress={() => router.push(`/manga/${item.manga_id}` as any)}
    >
      <Image
        source={{ uri: item.cover_portrait_url || item.cover_image_url }}
        style={styles.cover}
        contentFit="cover"
        transition={300}
      />
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.5)', 'rgba(0,0,0,0.95)']}
        style={styles.gradient}
      />
      {/* Recommended Badge */}
      <View style={styles.recommendedBadge}>
        <ThemedText style={styles.recommendedText}>⭐ FEATURED</ThemedText>
      </View>
      {/* Info */}
      <View style={styles.info}>
        <View style={styles.genres}>
          {genres.map((g) => (
            <View key={g} style={styles.genreTag}>
              <ThemedText style={styles.genreText}>{g}</ThemedText>
            </View>
          ))}
        </View>
        <ThemedText style={styles.title} numberOfLines={2}>
          {item.title}
        </ThemedText>
        <View style={styles.meta}>
          <ThemedText style={styles.metaText}>⭐ {item.user_rate}</ThemedText>
          <ThemedText style={styles.metaDot}>·</ThemedText>
          <ThemedText style={styles.metaText}>Ch. {item.latest_chapter_number}</ThemedText>
          <ThemedText style={styles.metaDot}>·</ThemedText>
          <ThemedText style={styles.metaText}>
            {item.country_id === 'KR' ? '🇰🇷 Manhwa' : item.country_id === 'CN' ? '🇨🇳 Manhua' : '🇯🇵 Manga'}
          </ThemedText>
        </View>
        <ThemedText style={styles.description} numberOfLines={2}>
          {item.description}
        </ThemedText>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    width: CARD_WIDTH,
    height: 220,
    borderRadius: Spacing.three,
    overflow: 'hidden',
    marginRight: Spacing.three,
  },
  cover: {
    ...StyleSheet.absoluteFill,
  },
  gradient: {
    ...StyleSheet.absoluteFill,
  },
  recommendedBadge: {
    position: 'absolute',
    top: Spacing.two,
    left: Spacing.two,
    backgroundColor: '#FF6B35',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  recommendedText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  info: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: Spacing.three,
    gap: 4,
  },
  genres: {
    flexDirection: 'row',
    gap: 4,
  },
  genreTag: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  genreText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: '600',
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#fff',
    lineHeight: 24,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
  },
  metaDot: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
  },
  description: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    lineHeight: 17,
  },
});
