import { View, StyleSheet, Animated } from 'react-native';
import { useEffect, useRef } from 'react';
import { useTheme } from '@/hooks/use-theme';
import { Spacing } from '@/constants/theme';

interface SkeletonBoxProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: object;
}

function SkeletonBox({ width = '100%', height = 16, borderRadius = 6, style }: SkeletonBoxProps) {
  const theme = useTheme();
  const opacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.4,
          duration: 800,
          useNativeDriver: true,
        }),
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
  const theme = useTheme();
  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundElement }]}>
      <SkeletonBox height={160} borderRadius={8} />
      <View style={styles.info}>
        <SkeletonBox height={13} width="90%" />
        <SkeletonBox height={13} width="60%" />
        <SkeletonBox height={11} width="40%" />
      </View>
    </View>
  );
}

export function MangaFeaturedSkeleton() {
  const theme = useTheme();
  return (
    <View style={[styles.featuredContainer, { backgroundColor: theme.backgroundElement }]}>
      <SkeletonBox height={220} borderRadius={0} width="100%" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '47%',
    marginBottom: Spacing.three,
    borderRadius: Spacing.two,
    overflow: 'hidden',
    padding: 0,
  },
  info: {
    padding: Spacing.one,
    gap: 6,
    paddingBottom: Spacing.two,
  },
  featuredContainer: {
    width: 300,
    height: 220,
    borderRadius: Spacing.three,
    overflow: 'hidden',
    marginRight: Spacing.three,
  },
});
