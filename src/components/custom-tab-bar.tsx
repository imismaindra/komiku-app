import React, { useEffect } from 'react';
import {
  View,
  StyleSheet,
  Pressable,
  Platform,
  Text,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/use-theme';

interface TabItemProps {
  route: any;
  isFocused: boolean;
  onPress: () => void;
  onLongPress: () => void;
  label: string;
}

const TAB_LABELS: Record<string, string> = {
  index: 'Beranda',
  explore: 'Jelajah',
  profile: 'Profil',
};

const TAB_ICONS: Record<string, { active: string; inactive: string }> = {
  index: { active: 'home', inactive: 'home-outline' },
  explore: { active: 'compass', inactive: 'compass-outline' },
  profile: { active: 'person', inactive: 'person-outline' },
};

function TabItem({ route, isFocused, onPress, onLongPress, label }: TabItemProps) {
  const theme = useTheme();
  const scale = useSharedValue(1);
  const indicatorWidth = useSharedValue(isFocused ? 1 : 0);

  useEffect(() => {
    indicatorWidth.value = withTiming(isFocused ? 1 : 0, { duration: 200 });
  }, [isFocused]);

  const onPressIn = () => {
    scale.value = withSpring(0.9, { damping: 14, stiffness: 280 });
  };

  const onPressOut = () => {
    scale.value = withSpring(1, { damping: 14, stiffness: 280 });
  };

  const iconConfig = TAB_ICONS[route.name] ?? { active: 'ellipse', inactive: 'ellipse-outline' };
  const iconName = isFocused ? iconConfig.active : iconConfig.inactive;

  const containerAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const indicatorStyle = useAnimatedStyle(() => ({
    width: `${indicatorWidth.value * 100}%` as any,
    opacity: indicatorWidth.value,
  }));

  return (
    <Animated.View style={[styles.tabItem, containerAnimStyle]}>
      <Pressable
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        onPress={onPress}
        onLongPress={onLongPress}
        style={styles.pressable}
      >
        {/* Top indicator line */}
        <View style={styles.indicatorTrack}>
          <Animated.View
            style={[
              styles.indicator,
              { backgroundColor: theme.accent },
              indicatorStyle,
            ]}
          />
        </View>

        <Ionicons
          name={iconName as any}
          size={20}
          color={isFocused ? theme.accent : '#4A4A4A'}
          style={styles.icon}
        />

        <Text
          style={[
            styles.label,
            {
              color: isFocused ? theme.text : '#4A4A4A',
              fontWeight: isFocused ? '700' : '400',
            },
          ]}
        >
          {label}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

export function CustomTabBar({ state, descriptors, navigation }: any) {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.background,
          borderTopColor: theme.border,
        },
      ]}
    >
      {state.routes.map((route: any, index: number) => {
        const { options } = descriptors[route.key];
        const label = TAB_LABELS[route.name] ?? route.name;
        const isFocused = state.index === index;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });
          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        const onLongPress = () => {
          navigation.emit({ type: 'tabLongPress', target: route.key });
        };

        return (
          <TabItem
            key={route.key}
            route={route}
            isFocused={isFocused}
            onPress={onPress}
            onLongPress={onLongPress}
            label={label}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderTopWidth: 1,
    height: Platform.OS === 'ios' ? 82 : 64,
    paddingBottom: Platform.OS === 'ios' ? 20 : 0,
  },
  tabItem: {
    flex: 1,
  },
  pressable: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 4,
  },
  indicatorTrack: {
    position: 'absolute',
    top: 0,
    left: '15%',
    right: '15%',
    height: 2,
    overflow: 'hidden',
    alignItems: 'center',
  },
  indicator: {
    height: 2,
    alignSelf: 'center',
  },
  icon: {
    marginBottom: 3,
  },
  label: {
    fontSize: 10,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
});
