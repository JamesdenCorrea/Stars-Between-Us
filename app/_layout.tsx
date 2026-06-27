import { Stack, router, useSegments } from 'expo-router';
import { StatusBar, View, ActivityIndicator } from 'react-native';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Colors } from '../constants/theme';
import { Session } from '@supabase/supabase-js';
import Head from 'expo-router/head';

export default function RootLayout() {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const segments = useSegments();

  useEffect(() => {
    // Check current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setIsLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      console.log('Auth state changed:', _event, session?.user?.email);
      setSession(session);
      
      // Log login activity
      if (_event === 'SIGNED_IN' && session?.user) {
        const { error } = await supabase
          .from('activity_logs')
          .insert({ user_id: session.user.id, activity: 'Logged in' });
        if (error) console.log('Failed to log login:', error.message);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(auth)' || segments[0] === undefined;
    const inAppGroup = segments[0] === '(app)';
    
    console.log('Navigation check:', { 
      session: !!session, 
      inAuthGroup, 
      inAppGroup, 
      segments: segments.join('/') 
    });

    if (!session && !inAuthGroup) {
      // No session, redirect to login
      router.replace('/(auth)/welcome');
    } else if (session && inAuthGroup) {
      // Has session, redirect to dashboard
      router.replace('/(app)/dashboard');
    }
  }, [session, isLoading, segments]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.black }}>
        <ActivityIndicator size="large" color={Colors.yellow} />
      </View>
    );
  }

  return (
    <>
      <Head>
        <title>Stars Between Us</title>
        <meta name="description" content="A private universe for two." />
        <link rel="icon" type="image/png" href="/favicon.png" />
      </Head>
      <StatusBar barStyle="light-content" backgroundColor={Colors.black} />
      <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(app)" />
        <Stack.Screen name="confirm-email" />
      </Stack>
    </>
  );
}
