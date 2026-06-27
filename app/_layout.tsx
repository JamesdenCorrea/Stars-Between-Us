import { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, View } from 'react-native';
import { supabase } from '@/lib/supabase';
import { Colors } from '@/constants/theme';

export default function RootLayout() {
  const segments = useSegments();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      checkAuthState(session);
      setIsLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth event:', event);

      if (event === 'SIGNED_OUT') {
        console.log('User signed out, redirecting to login');
        router.replace('/(auth)/login');
        return;
      }

      checkAuthState(session);
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [segments]);

  const checkAuthState = (session: any) => {
    const isLoggedIn = !!session;
    const isInAuthGroup = segments[0] === '(auth)';
    const isInAppGroup = segments[0] === '(app)';
    const isConfirmEmail = segments[0] === 'confirm-email';

    if (isConfirmEmail) return;

    console.log('Auth check:', { isLoggedIn, isInAuthGroup, isInAppGroup, segments });

    if (isLoggedIn && !isInAppGroup) {
      console.log('Redirecting to dashboard');
      router.replace('/(app)/dashboard');
    } else if (!isLoggedIn && !isInAuthGroup) {
      console.log('Redirecting to login');
      router.replace('/(auth)/login');
    }
  };

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.black }}>
        <ActivityIndicator size="large" color={Colors.yellow} />
      </View>
    );
  }

  return (
    <>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(app)" />
        <Stack.Screen name="confirm-email" />
      </Stack>
    </>
  );
}