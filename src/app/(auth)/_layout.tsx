import { Stack, router } from 'expo-router';
import { useEffect } from 'react';

import { useAuth } from '@/context/auth-context';

export default function AuthLayout() {
  const { state } = useAuth();

  // If already authenticated, redirect to main app
  useEffect(() => {
    if (!state.isLoading && state.isAuthenticated) {
      router.replace('/(tabs)' as any);
    }
  }, [state.isAuthenticated, state.isLoading]);

  return (
    <Stack screenOptions={{ headerShown: false, animation: 'fade' }} />
  );
}
