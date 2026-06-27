import { Stack, Redirect } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { ActivityIndicator, View } from 'react-native';
import { Colors } from '@/constants/theme';

export default function AppLayout() {
  const { session, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.black }}>
        <ActivityIndicator size="large" color={Colors.yellow} />
      </View>
    );
  }

  if (!session) {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: Colors.black },
        headerTintColor: Colors.yellow,
        headerTitleStyle: { color: Colors.textPrimary },
        headerBackTitle: 'Back',
        contentStyle: { backgroundColor: Colors.black },
        headerShown: false,
      }}
    >
      <Stack.Screen name="dashboard" />
    </Stack>
  );
}