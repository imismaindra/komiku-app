import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { MangaItem } from '@/types';

interface MangaCardProps {
  item: MangaItem;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function MangaCard({ item }: MangaCardProps) {
  const theme = useTheme();
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const genres = item.taxonomy?.Genre?.slice(0, 2).map((g) => g.name) ?? [];

  return (
    <AnimatedPressable
      style={[styles.container, animStyle]}
      onPressIn={() => {
        scale.value = withSpring(0.95);
      }}
      onPressOut={() => {
        scale.value = withSpring(1);
      }}
      onPress={() => router.push(`/manga/${item.manga_id}` as any)}
    >
      <View style={[styles.card, { backgroundColor: theme.backgroundElement }]}>
        <Image
          source={{ uri: item.cover_image_url }}
          style={styles.cover}
          contentFit="cover"
          transition={300}
        />
        {/* Rating Badge */}
        <View style={styles.ratingBadge}>
          <ThemedText style={styles.ratingText}>⭐ {item.user_rate}</ThemedText>
        </View>
        {/* Country Badge */}
        <View style={[styles.countryBadge, { backgroundColor: theme.background + 'CC' }]}>
          <ThemedText style={styles.countryText}>
            {item.country_id === 'KR' ? '🇰🇷' : item.country_id === 'CN' ? '🇨🇳' : '🇯🇵'}
          </ThemedText>
        </View>
      </View>
      <View style={styles.info}>
        <ThemedText style={styles.title} numberOfLines={2}>
          {item.title}
        </ThemedText>
        <View style={styles.genres}>
          {genres.map((g) => (
            <View
              key={g}
              style={[styles.genreTag, { backgroundColor: theme.backgroundSelected }]}
            >
              <ThemedText style={styles.genreText}>{g}</ThemedText>
            </View>
          ))}
        </View>
        <ThemedText style={styles.chapter} themeColor="textSecondary">
          Ch. {item.latest_chapter_number}
        </ThemedText>
      </View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '47%',
    marginBottom: Spacing.three,
  },
  card: {
    borderRadius: Spacing.two,
    overflow: 'hidden',
    aspectRatio: 0.7,
  },
  cover: {
    width: '100%',
    height: '100%',
  },
  ratingBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: 'rgba(0,0,0,0.75)',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  ratingText: {
    fontSize: 10,
    color: '#FFD700',
    fontWeight: '700',
  },
  countryBadge: {
    position: 'absolute',
    top: 6,
    left: 6,
    borderRadius: 6,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  countryText: {
    fontSize: 12,
  },
  info: {
    paddingTop: Spacing.one,
    gap: 4,
  },
  title: {
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
  },
  genres: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  genreTag: {
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  genreText: {
    fontSize: 10,
    fontWeight: '500',
  },
  chapter: {
    fontSize: 11,
  },
});
