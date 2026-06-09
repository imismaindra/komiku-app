import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import { Stack } from 'expo-router';
import { useColorScheme, LogBox } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

LogBox.ignoreLogs([
  '"shadow*" style props are deprecated',
  '"textShadow*" style props are deprecated',
  'Animated: `useNativeDriver` is not supported',
]);

import { AuthProvider } from '@/context/auth-context';
 
function RootStack() {
  const colorScheme = useColorScheme();
  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="manga/[id]"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="chapter/[id]"
          options={{
            headerShown: false,
          }}
        />
      </Stack>
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <RootStack />
      </AuthProvider>
    </GestureHandlerRootView>
  );
}
