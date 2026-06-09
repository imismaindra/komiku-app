import { Tabs, router } from 'expo-router';
import { useEffect } from 'react';

import { useAuth } from '@/context/auth-context';
import { CustomTabBar } from '@/components/custom-tab-bar';

export default function TabsLayout() {
  const { state } = useAuth();

  // Guard: redirect to login if not authenticated
  useEffect(() => {
    if (!state.isLoading && !state.isAuthenticated) {
      router.replace('/(auth)/login' as any);
    }
  }, [state.isAuthenticated, state.isLoading]);

  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Beranda',
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Jelajah',
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profil',
        }}
      />
    </Tabs>
  );
}

