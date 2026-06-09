/* eslint-disable react-hooks/immutability */
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Dimensions, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { Spacing } from '@/constants/theme';
import type { MangaItem } from '@/types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH - Spacing.four * 2;

interface MangaFeaturedCardProps {
  item: MangaItem;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function MangaFeaturedCard({ item }: MangaFeaturedCardProps) {
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const genres = item.taxonomy?.Genre?.slice(0, 2).map((g) => g.name) ?? [];
  const rating = item.user_rate || 0.0;
  const originLabel =
    item.country_id === 'KR' ? 'MANHWA' :
    item.country_id === 'CN' ? 'MANHUA' :
    'MANGA';

  return (
    <AnimatedPressable
      style={[styles.container, animStyle]}
      onPressIn={() => {
        scale.value = withSpring(0.98, { damping: 16 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 16 });
      }}
      onPress={() => router.push(`/manga/${item.manga_id}` as any)}
    >
      <Image
        source={{ uri: item.cover_portrait_url || item.cover_image_url }}
        style={styles.cover}
        contentFit="cover"
        transition={300}
      />

      {/* Heavy bottom gradient */}
      <LinearGradient
        colors={['transparent', 'rgba(13, 13, 13, 0.5)', 'rgba(13, 13, 13, 0.98)']}
        style={styles.gradient}
        locations={[0.2, 0.55, 1]}
      />

      {/* Top: origin label */}
      <View style={styles.topRow}>
        <View style={styles.originTag}>
          <Text style={styles.originText}>{originLabel}</Text>
        </View>
        <View style={styles.ratingChip}>
          <Ionicons name="star" size={11} color="#E8FF00" />
          <Text style={styles.ratingText}>{rating.toFixed(1)}</Text>
        </View>
      </View>

      {/* Bottom: editorial info block */}
      <View style={styles.info}>
        {genres.length > 0 && (
          <View style={styles.genreRow}>
            {genres.map((g) => (
              <Text key={g} style={styles.genreText}>{g.toUpperCase()}</Text>
            ))}
          </View>
        )}

        <Text style={styles.title} numberOfLines={2}>
          {item.title}
        </Text>

        <View style={styles.bottomMeta}>
          <Text style={styles.chapterLabel}>
            {item.latest_chapter_number} <Text style={styles.chapterUnit}>BAB</Text>
          </Text>
          {item.description ? (
            <Text style={styles.synopsis} numberOfLines={1}>
              {item.description}
            </Text>
          ) : null}
        </View>
      </View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  container: {
    width: CARD_WIDTH,
    height: 240,
    borderRadius: 6,
    borderTopRightRadius: 0,
    overflow: 'hidden',
    marginRight: Spacing.three,
    backgroundColor: '#141414',
  },
  cover: {
    ...StyleSheet.absoluteFill,
  },
  gradient: {
    ...StyleSheet.absoluteFill,
  },
  topRow: {
    position: 'absolute',
    top: 12,
    left: 12,
    right: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  originTag: {
    backgroundColor: '#E8FF00',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 2,
  },
  originText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#0D0D0D',
    letterSpacing: 1.5,
  },
  ratingChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(13,13,13,0.7)',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 2,
    borderWidth: 1,
    borderColor: 'rgba(232,255,0,0.2)',
  },
  ratingText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#E8FF00',
  },
  info: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    gap: 6,
  },
  genreRow: {
    flexDirection: 'row',
    gap: 10,
  },
  genreText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#6B6B6B',
    letterSpacing: 1.2,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#F0F0F0',
    lineHeight: 26,
    letterSpacing: -0.3,
  },
  bottomMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  chapterLabel: {
    fontSize: 18,
    fontWeight: '800',
    color: '#E8FF00',
    letterSpacing: -0.5,
  },
  chapterUnit: {
    fontSize: 9,
    fontWeight: '700',
    color: '#6B6B6B',
    letterSpacing: 1,
  },
  synopsis: {
    flex: 1,
    fontSize: 11,
    color: '#6B6B6B',
    lineHeight: 15,
  },
});
