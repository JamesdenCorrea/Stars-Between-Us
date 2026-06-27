import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, Animated, KeyboardAvoidingView,
  Platform, ScrollView, TouchableOpacity, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import Head from 'expo-router/head';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radius } from '@/constants/theme';
import { Button, Input, Divider } from '@/components/ui';
import { supabase } from '@/lib/supabase';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 60, friction: 8 }),
    ]).start();
  }, []);

  const validate = () => {
    const errs: typeof errors = {};
    if (!email.trim()) errs.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(email)) errs.email = 'Enter a valid email';
    if (!password) errs.password = 'Password is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleResendConfirmation = async (emailAddr: string) => {
    const { error } = await supabase.auth.resend({ type: 'signup', email: emailAddr });
    if (error) {
      Alert.alert('Error', error.message);
    } else {
      Alert.alert('Email Sent ✦', 'A new confirmation link has been sent to ' + emailAddr);
    }
  };

  const handleLogin = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        if (error.message === 'Email not confirmed') {
          Alert.alert(
            'Email Not Confirmed',
            'Please confirm your email before logging in. Check your inbox or request a new link.',
            [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Resend Link',
                onPress: () => handleResendConfirmation(email.trim()),
              },
            ]
          );
        } else if (error.message === 'Invalid login credentials') {
          Alert.alert('Login Failed', 'Incorrect email or password. Please try again.');
        } else {
          Alert.alert('Login Failed', error.message);
        }
        return;
      }

      // Success - the auth listener in _layout.tsx will automatically redirect to dashboard
      console.log('Login successful:', data.user?.email);
    } catch (e) {
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      setErrors({ email: 'Enter your email first' });
      return;
    }
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim());
    if (error) {
      Alert.alert('Error', error.message);
    } else {
      Alert.alert('Check your inbox', 'We sent a password reset link to ' + email);
    }
  };

  return (
    <>
      <Head>
        <title>Login | Stars Between Us</title>
      </Head>
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : undefined} 
          style={styles.keyboardView}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
        >
          <ScrollView 
            contentContainerStyle={styles.scroll} 
            keyboardShouldPersistTaps="handled" 
            showsVerticalScrollIndicator={false}
            bounces={false}
            overScrollMode="never"
          >
            <TouchableOpacity
              style={styles.backBtn}
              onPress={() => router.canGoBack() ? router.back() : router.replace('/(auth)/welcome')}
            >
              <Ionicons name="arrow-back" size={22} color={Colors.textSecondary} />
            </TouchableOpacity>

            <Animated.View style={[styles.content, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
              <View style={styles.header}>
                <View style={styles.iconBadge}>
                  <Ionicons name="heart" size={28} color={Colors.red} />
                </View>
                <Text style={styles.title}>Welcome back</Text>
                <Text style={styles.subtitle}>Sign in to your shared universe</Text>
              </View>

              <View style={styles.form}>
                <Input
                  label="Email"
                  placeholder="you@example.com"
                  value={email}
                  onChangeText={(t) => { setEmail(t); setErrors(e => ({ ...e, email: undefined })); }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  error={errors.email}
                  leftIcon={<Ionicons name="mail-outline" size={18} color={Colors.textMuted} />}
                />
                <Input
                  label="Password"
                  placeholder="Your secret key"
                  value={password}
                  onChangeText={(t) => { setPassword(t); setErrors(e => ({ ...e, password: undefined })); }}
                  secureTextEntry={!showPassword}
                  autoComplete="password"
                  error={errors.password}
                  leftIcon={<Ionicons name="lock-closed-outline" size={18} color={Colors.textMuted} />}
                  rightIcon={
                    <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                      <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={18} color={Colors.textMuted} />
                    </TouchableOpacity>
                  }
                />
                <TouchableOpacity style={styles.forgotBtn} onPress={handleForgotPassword}>
                  <Text style={styles.forgotText}>Forgot password?</Text>
                </TouchableOpacity>
              </View>

              <Button label="Sign In" variant="primary" size="lg" loading={loading} onPress={handleLogin} style={styles.signInBtn} />

              <Divider label="or" />

              <View style={styles.registerRow}>
                <Text style={styles.registerPrompt}>Don't have an account? </Text>
                <TouchableOpacity onPress={() => router.replace('/(auth)/register')}>
                  <Text style={styles.registerLink}>Create one</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.starRow}>
                {['✦', '✧', '✦', '✧', '✦'].map((s, i) => (
                  <Text key={i} style={[styles.starDeco, { opacity: i === 2 ? 1 : 0.3, fontSize: i === 2 ? 16 : 10 }]}>{s}</Text>
                ))}
              </View>
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.black },
  keyboardView: { flex: 1 },
  scroll: { flexGrow: 1, paddingHorizontal: Spacing.xl, paddingBottom: Spacing['2xl'] },
  backBtn: { marginTop: Spacing.md, marginBottom: Spacing.lg, width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center' },
  content: { flex: 1 },
  header: { alignItems: 'center', marginBottom: Spacing['2xl'] },
  iconBadge: { width: 72, height: 72, borderRadius: 36, backgroundColor: Colors.darkPanel, borderWidth: 2, borderColor: Colors.red, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.md },
  title: { fontSize: Typography['2xl'], fontWeight: Typography.bold, color: Colors.textPrimary, marginBottom: Spacing.xs },
  subtitle: { fontSize: Typography.base, color: Colors.textSecondary },
  form: { marginBottom: Spacing.md },
  forgotBtn: { alignSelf: 'flex-end', marginTop: -Spacing.xs },
  forgotText: { color: Colors.yellow, fontSize: Typography.sm, fontWeight: Typography.medium },
  signInBtn: { width: '100%', marginBottom: Spacing.md },
  registerRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: Spacing.sm },
  registerPrompt: { color: Colors.textSecondary, fontSize: Typography.base },
  registerLink: { color: Colors.yellow, fontSize: Typography.base, fontWeight: Typography.semibold },
  starRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: Spacing.sm, marginTop: Spacing['2xl'] },
  starDeco: { color: Colors.yellow },
});
