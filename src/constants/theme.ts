/**
 * Inkwell Dark Theme — Komiku App
 * Raw editorial aesthetic inspired by manga zine culture.
 * Pure ink-black backgrounds with electric lime & red-hot accents.
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#0D0D0D',
    background: '#F5F0E8',
    backgroundElement: '#EAE4D8',
    backgroundSelected: '#D9D2C4',
    textSecondary: '#5A5A5A',
    accent: '#1A1A1A',
    accentSecondary: '#E63323',
    cardBackground: '#FFFFFF',
    border: '#D0C8B8',
  },
  dark: {
    text: '#F0F0F0',
    background: '#0D0D0D',
    backgroundElement: '#141414',
    backgroundSelected: '#1E1E1E',
    textSecondary: '#6B6B6B',
    accent: '#E8FF00',
    accentSecondary: '#FF3B3B',
    cardBackground: '#141414',
    border: '#2A2A2A',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
