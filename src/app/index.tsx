import { ActivityIndicator, View } from 'react-native';
import { Redirect } from 'expo-router';

import { useAuth } from '@/context/auth-context';

/**
 * Root index — redirects to (auth)/login or (tabs) based on auth state.
 * This is the correct Expo Router pattern for auth guards.
 */
export default function Index() {
  const { state } = useAuth();

  if (state.isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0A0A0F' }}>
        <ActivityIndicator size="large" color="#FF6B35" />
      </View>
    );
  }

  if (state.isAuthenticated) {
    return <Redirect href={'/(tabs)' as any} />;
  }

  return <Redirect href={'/(auth)/login' as any} />;
}
