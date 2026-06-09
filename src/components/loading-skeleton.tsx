import { View, StyleSheet, Animated, Dimensions } from 'react-native';
import { useEffect, useMemo } from 'react';
import { useTheme } from '@/hooks/use-theme';
import { Spacing } from '@/constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const FEATURED_WIDTH = SCREEN_WIDTH - Spacing.four * 2;

interface SkeletonBoxProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: object;
}

function SkeletonBox({ width = '100%', height = 16, borderRadius = 0, style }: SkeletonBoxProps) {
  const theme = useTheme();
  const opacity = useMemo(() => new Animated.Value(0.3), []);

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.7, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.3, duration: 700, useNativeDriver: true }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        {
          width: width as any,
          height,
          borderRadius,
          backgroundColor: theme.backgroundSelected,
          opacity,
        },
        style,
      ]}
    />
  );
}

export function MangaCardSkeleton() {
  return (
    <View style={styles.container}>
      {/* Cover image skeleton — sharp corners matching card */}
      <SkeletonBox height={170} borderRadius={0} />
      {/* Info below */}
      <View style={styles.info}>
        <SkeletonBox height={11} width="85%" />
        <SkeletonBox height={11} width="55%" />
        <SkeletonBox height={9} width="35%" />
      </View>
    </View>
  );
}

export function MangaFeaturedSkeleton() {
  return (
    <View style={styles.featuredContainer}>
      <SkeletonBox height={240} borderRadius={0} width="100%" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '47%',
    marginBottom: Spacing.three,
    gap: 0,
  },
  info: {
    paddingTop: 8,
    paddingHorizontal: 2,
    gap: 6,
  },
  featuredContainer: {
    width: FEATURED_WIDTH,
    height: 240,
    overflow: 'hidden',
    marginRight: Spacing.three,
  },
});
