import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, Animated, KeyboardAvoidingView,
  Platform, ScrollView, TouchableOpacity, Alert, Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radius } from '@/constants/theme';
import { Button, Input, Divider } from '@/components/ui';
import { supabase } from '@/lib/supabase';

type Step = 1 | 2 | 3;

const PETS = [
  { id: 'bear', emoji: '🐻', label: 'Bear' },
  { id: 'bunny', emoji: '🐰', label: 'Bunny' },
  { id: 'cat', emoji: '🐱', label: 'Cat' },
  { id: 'dog', emoji: '🐶', label: 'Dog' },
  { id: 'fox', emoji: '🦊', label: 'Fox' },
  { id: 'panda', emoji: '🐼', label: 'Panda' },
];

export default function RegisterScreen() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [selectedPet, setSelectedPet] = useState('bear');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showEmailExistsModal, setShowEmailExistsModal] = useState(false);

  const progressAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 60, friction: 8 }),
    ]).start();
  }, []);

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: step === 1 ? 0.33 : step === 2 ? 0.66 : 1,
      duration: 400,
      useNativeDriver: false,
    }).start();
  }, [step]);

  const clearError = (field: string) => {
    setErrors(prev => { const e = { ...prev }; delete e[field]; return e; });
  };

  const validateStep1 = () => {
    const errs: Record<string, string> = {};
    if (!displayName.trim()) errs.displayName = 'What should we call you?';
    else if (displayName.trim().length < 2) errs.displayName = 'At least 2 characters';
    if (!email.trim()) errs.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(email)) errs.email = 'Enter a valid email';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const validateStep2 = () => {
    const errs: Record<string, string> = {};
    if (!password) errs.password = 'Password is required';
    else if (password.length < 6) errs.password = 'At least 6 characters';
    if (!confirmPassword) errs.confirmPassword = 'Please confirm your password';
    else if (password !== confirmPassword) errs.confirmPassword = "Passwords don't match";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNext = () => {
    if (step === 1 && validateStep1()) setStep(2);
    else if (step === 2 && validateStep2()) setStep(3);
  };

  const handleRegister = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          emailRedirectTo: 'http://localhost:8081/confirm-email',
          data: {
            display_name: displayName.trim(),
            pet_type: selectedPet,
          },
        },
      });

      if (error) {
        if (
          error.message?.toLowerCase().includes('already registered') ||
          error.message?.toLowerCase().includes('already been registered') ||
          error.status === 422
        ) {
          setShowEmailExistsModal(true);
        } else {
          Alert.alert('Registration Failed', error.message);
        }
        return;
      }

      // Supabase returns user but identities=[]] when email already exists
      if (data.user && data.user.identities && data.user.identities.length === 0) {
        setShowEmailExistsModal(true);
        return;
      }

      if (data.session) {
        // Email confirmation OFF
        router.replace('/(app)/dashboard');
        return;
      }

      // Email confirmation ON
      router.replace({
        pathname: '/(auth)/check-email',
        params: { email: email.trim() },
      });
    } catch (e) {
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  const stepTitles = {
    1: { title: 'Create your account', sub: 'Start building your shared universe' },
    2: { title: 'Secure your space', sub: 'Choose a strong password' },
    3: { title: 'Choose your companion', sub: 'Pick a pet to join your journey' },
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={styles.navRow}>
            <TouchableOpacity
              style={styles.backBtn}
              onPress={() => step > 1 ? setStep((step - 1) as Step) : router.canGoBack() ? router.back() : router.replace('/(auth)/welcome')}
            >
              <Ionicons name="arrow-back" size={22} color={Colors.textSecondary} />
            </TouchableOpacity>
            <Text style={styles.stepLabel}>Step {step} of 3</Text>
          </View>

          <View style={styles.progressTrack}>
            <Animated.View style={[styles.progressFill, { width: progressWidth }]} />
          </View>

          <Animated.View style={[styles.content, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
            <View style={styles.header}>
              <View style={styles.iconBadge}>
                {step === 3
                  ? <Text style={styles.petPreview}>{PETS.find(p => p.id === selectedPet)?.emoji}</Text>
                  : <Text style={styles.crownIcon}>♛</Text>}
              </View>
              <Text style={styles.title}>{stepTitles[step].title}</Text>
              <Text style={styles.subtitle}>{stepTitles[step].sub}</Text>
            </View>

            {step === 1 && (
              <View style={styles.form}>
                <Input
                  label="Your name"
                  placeholder="What should your partner call you?"
                  value={displayName}
                  onChangeText={(t) => { setDisplayName(t); clearError('displayName'); }}
                  autoCapitalize="words"
                  error={errors.displayName}
                  leftIcon={<Ionicons name="person-outline" size={18} color={Colors.textMuted} />}
                />
                <Input
                  label="Email"
                  placeholder="you@example.com"
                  value={email}
                  onChangeText={(t) => { setEmail(t); clearError('email'); }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  error={errors.email}
                  leftIcon={<Ionicons name="mail-outline" size={18} color={Colors.textMuted} />}
                />
                <View style={styles.hintBox}>
                  <Ionicons name="star-outline" size={14} color={Colors.yellow} />
                  <Text style={styles.hintText}>After signing up, you'll get a code to share with your partner.</Text>
                </View>
              </View>
            )}

            {step === 2 && (
              <View style={styles.form}>
                <Input
                  label="Password"
                  placeholder="At least 6 characters"
                  value={password}
                  onChangeText={(t) => { setPassword(t); clearError('password'); }}
                  secureTextEntry={!showPassword}
                  error={errors.password}
                  leftIcon={<Ionicons name="lock-closed-outline" size={18} color={Colors.textMuted} />}
                  rightIcon={
                    <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                      <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={18} color={Colors.textMuted} />
                    </TouchableOpacity>
                  }
                />
                {password.length > 0 && (
                  <View style={styles.strengthRow}>
                    {[2, 4, 6, 8].map((t, i) => (
                      <View key={i} style={[styles.strengthBar, password.length >= t && styles.strengthBarActive, password.length >= 8 && styles.strengthBarStrong]} />
                    ))}
                    <Text style={styles.strengthLabel}>
                      {password.length < 4 ? 'Weak' : password.length < 6 ? 'Fair' : password.length < 8 ? 'Good' : 'Strong'}
                    </Text>
                  </View>
                )}
                <Input
                  label="Confirm password"
                  placeholder="Repeat your password"
                  value={confirmPassword}
                  onChangeText={(t) => { setConfirmPassword(t); clearError('confirmPassword'); }}
                  secureTextEntry={!showConfirm}
                  error={errors.confirmPassword}
                  leftIcon={<Ionicons name="shield-checkmark-outline" size={18} color={Colors.textMuted} />}
                  rightIcon={
                    <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)}>
                      <Ionicons name={showConfirm ? 'eye-off-outline' : 'eye-outline'} size={18} color={Colors.textMuted} />
                    </TouchableOpacity>
                  }
                />
              </View>
            )}

            {step === 3 && (
              <View style={styles.petGrid}>
                {PETS.map((pet) => (
                  <TouchableOpacity
                    key={pet.id}
                    style={[styles.petCard, selectedPet === pet.id && styles.petCardSelected]}
                    onPress={() => setSelectedPet(pet.id)}
                  >
                    <Text style={styles.petEmoji}>{pet.emoji}</Text>
                    <Text style={[styles.petLabel, selectedPet === pet.id && styles.petLabelSelected]}>{pet.label}</Text>
                    {selectedPet === pet.id && (
                      <View style={styles.petCheckmark}>
                        <Ionicons name="checkmark-circle" size={16} color={Colors.yellow} />
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            )}

            <Button
              label={step < 3 ? 'Continue' : 'Create Account'}
              variant="primary"
              size="lg"
              loading={loading}
              onPress={step < 3 ? handleNext : handleRegister}
              style={styles.ctaBtn}
            />

            <Divider label="or" />

            <View style={styles.loginRow}>
              <Text style={styles.loginPrompt}>Already have an account? </Text>
              <TouchableOpacity onPress={() => router.replace('/(auth)/login')}>
                <Text style={styles.loginLink}>Sign in</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal visible={showEmailExistsModal} transparent animationType="fade" onRequestClose={() => setShowEmailExistsModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Ionicons name="alert-circle-outline" size={48} color={Colors.yellow} />
            <Text style={styles.modalTitle}>Email Already Registered</Text>
            <Text style={styles.modalMessage}>
              "{email}" already has an account. Would you like to log in instead?
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => {
                  setShowEmailExistsModal(false);
                  // Go back to step 1 so they can change email
                  setStep(1);
                  setEmail('');
                }}
              >
                <Text style={styles.modalButtonTextCancel}>Change Email</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonConfirm]}
                onPress={() => {
                  setShowEmailExistsModal(false);
                  router.replace('/(auth)/login');
                }}
              >
                <Text style={styles.modalButtonTextConfirm}>Go to Login</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.black },
  scroll: { flexGrow: 1, paddingHorizontal: Spacing.xl, paddingBottom: Spacing['2xl'] },
  navRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: Spacing.md, marginBottom: Spacing.md },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center' },
  stepLabel: { color: Colors.textMuted, fontSize: Typography.sm, letterSpacing: 0.5 },
  progressTrack: { height: 3, backgroundColor: Colors.surface, borderRadius: 2, marginBottom: Spacing.xl, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: Colors.yellow, borderRadius: 2 },
  content: { flex: 1 },
  header: { alignItems: 'center', marginBottom: Spacing.xl },
  iconBadge: { width: 80, height: 80, borderRadius: 40, backgroundColor: Colors.darkPanel, borderWidth: 2, borderColor: Colors.yellow, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.md },
  crownIcon: { fontSize: 36, color: Colors.yellow },
  petPreview: { fontSize: 44 },
  title: { fontSize: Typography['2xl'], fontWeight: Typography.bold, color: Colors.textPrimary, marginBottom: Spacing.xs },
  subtitle: { fontSize: Typography.base, color: Colors.textSecondary, textAlign: 'center' },
  form: { marginBottom: Spacing.md },
  hintBox: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.xs, backgroundColor: Colors.yellowGlow, borderRadius: Radius.md, padding: Spacing.md, borderWidth: 1, borderColor: Colors.yellowBorder, marginTop: Spacing.xs },
  hintText: { color: Colors.yellow, fontSize: Typography.sm, flex: 1, lineHeight: Typography.sm * 1.5 },
  strengthRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, marginTop: -Spacing.xs, marginBottom: Spacing.md },
  strengthBar: { flex: 1, height: 3, borderRadius: 2, backgroundColor: Colors.surface },
  strengthBarActive: { backgroundColor: Colors.yellow },
  strengthBarStrong: { backgroundColor: '#4CAF50' },
  strengthLabel: { color: Colors.textMuted, fontSize: Typography.xs, width: 45 },
  petGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md, justifyContent: 'center', marginBottom: Spacing.xl },
  petCard: { width: '28%', aspectRatio: 1, backgroundColor: Colors.surface, borderRadius: Radius.lg, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: Colors.border, position: 'relative' },
  petCardSelected: { borderColor: Colors.yellow, backgroundColor: Colors.yellowGlow },
  petEmoji: { fontSize: 36, marginBottom: Spacing.xs },
  petLabel: { fontSize: Typography.xs, color: Colors.textMuted, fontWeight: Typography.medium },
  petLabelSelected: { color: Colors.yellow },
  petCheckmark: { position: 'absolute', top: 6, right: 6 },
  ctaBtn: { width: '100%', marginBottom: Spacing.md },
  loginRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: Spacing.sm },
  loginPrompt: { color: Colors.textSecondary, fontSize: Typography.base },
  loginLink: { color: Colors.yellow, fontSize: Typography.base, fontWeight: Typography.semibold },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: Colors.darkPanel, borderRadius: Radius.lg, padding: Spacing.xl, width: '85%', alignItems: 'center', borderWidth: 1, borderColor: Colors.borderAccent, gap: Spacing.sm },
  modalTitle: { fontSize: Typography.xl, fontWeight: Typography.bold, color: Colors.yellow, textAlign: 'center' },
  modalMessage: { fontSize: Typography.base, color: Colors.textSecondary, textAlign: 'center', marginBottom: Spacing.sm },
  modalButtons: { flexDirection: 'row', gap: Spacing.md, width: '100%' },
  modalButton: { flex: 1, paddingVertical: Spacing.md, borderRadius: Radius.md, alignItems: 'center' },
  modalButtonCancel: { backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border },
  modalButtonConfirm: { backgroundColor: Colors.yellow },
  modalButtonTextCancel: { color: Colors.textSecondary, fontSize: Typography.sm, fontWeight: Typography.medium },
  modalButtonTextConfirm: { color: Colors.black, fontSize: Typography.sm, fontWeight: Typography.bold },
});
