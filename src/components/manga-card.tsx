/* eslint-disable react-hooks/immutability */
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

import { Spacing } from '@/constants/theme';
import type { MangaItem } from '@/types';

interface MangaCardProps {
  item: MangaItem;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/** Returns true if the given date string is today (local date). */
function isUpdatedToday(dateStr?: string): boolean {
  if (!dateStr) return false;
  const today = new Date();
  const updated = new Date(dateStr);
  return (
    updated.getFullYear() === today.getFullYear() &&
    updated.getMonth() === today.getMonth() &&
    updated.getDate() === today.getDate()
  );
}

export function MangaCard({ item }: MangaCardProps) {
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const rating = item.user_rate || 0.0;
  const flag = item.country_id === 'KR' ? '🇰🇷' : item.country_id === 'CN' ? '🇨🇳' : '🇯🇵';
  const format = item.taxonomy?.Format?.[0]?.name ?? '';
  const showNewBadge = isUpdatedToday(item.latest_chapter_time);

  return (
    <AnimatedPressable
      style={[styles.container, animStyle]}
      onPressIn={() => {
        scale.value = withSpring(0.97, { damping: 16 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 16 });
      }}
      onPress={() => router.push(`/manga/${item.manga_id}` as any)}
    >
      {/* Cover image with sharp bottom-left corner */}
      <View style={styles.imageWrapper}>
        <Image
          source={{ uri: item.cover_image_url }}
          style={styles.cover}
          contentFit="cover"
          transition={300}
        />
        {/* Subtle bottom fade */}
        <LinearGradient
          colors={['transparent', 'rgba(13, 13, 13, 0.5)']}
          style={styles.gradient}
          locations={[0.5, 1]}
        />
        {/* NEW badge — top-left, only when updated today */}
        {showNewBadge && (
          <View style={styles.newBadge}>
            <Text style={styles.newBadgeText}>NEW</Text>
          </View>
        )}
        {/* Country flag top-right */}
        <View style={styles.flagBadge}>
          <Text style={styles.flagText}>{flag}</Text>
        </View>
        {/* Rating bottom-left */}
        <View style={styles.ratingBadge}>
          <Ionicons name="star" size={9} color="#E8FF00" />
          <Text style={styles.ratingText}>{rating.toFixed(1)}</Text>
        </View>
      </View>

      {/* Info below image — editorial style */}
      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={2}>
          {item.title}
        </Text>
        <View style={styles.metaRow}>
          <Text style={styles.chapterText}>
            Ch.{item.latest_chapter_number}
          </Text>
          {format ? (
            <View style={styles.formatTag}>
              <Text style={styles.formatText}>{format.toUpperCase()}</Text>
            </View>
          ) : null}
        </View>
      </View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '47%',
    marginBottom: Spacing.three,
  },
  imageWrapper: {
    borderRadius: 4,
    borderBottomLeftRadius: 0,
    overflow: 'hidden',
    aspectRatio: 0.68,
    backgroundColor: '#141414',
  },
  cover: {
    ...StyleSheet.absoluteFill,
  },
  gradient: {
    ...StyleSheet.absoluteFill,
  },
  newBadge: {
    position: 'absolute',
    top: 6,
    left: 6,
    backgroundColor: '#E8FF00',
    borderRadius: 3,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  newBadgeText: {
    fontSize: 8,
    fontWeight: '800',
    color: '#0D0D0D',
    letterSpacing: 0.8,
  },
  flagBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: 'rgba(13,13,13,0.75)',
    borderRadius: 3,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  flagText: {
    fontSize: 11,
  },
  ratingBadge: {
    position: 'absolute',
    bottom: 6,
    left: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(13,13,13,0.82)',
    borderRadius: 3,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  ratingText: {
    fontSize: 10,
    color: '#E8FF00',
    fontWeight: '700',
  },
  info: {
    paddingTop: 8,
    paddingHorizontal: 2,
    gap: 5,
  },
  title: {
    fontSize: 12,
    fontWeight: '600',
    color: '#F0F0F0',
    lineHeight: 16,
    letterSpacing: 0.1,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  chapterText: {
    fontSize: 10,
    color: '#E8FF00',
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  formatTag: {
    backgroundColor: '#1E1E1E',
    borderRadius: 2,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  formatText: {
    fontSize: 8,
    color: '#6B6B6B',
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
