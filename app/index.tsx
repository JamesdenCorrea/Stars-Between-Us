import { Redirect } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { useAuth } from '@/hooks/useAuth';
import { Colors } from '@/constants/theme';

export default function Index() {
  const { session, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.black, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator color={Colors.yellow} size="large" />
      </View>
    );
  }

  if (session) return <Redirect href="/(app)/dashboard" />;
  return <Redirect href="/(auth)/welcome" />;
}
