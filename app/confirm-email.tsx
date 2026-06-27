import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '@/lib/supabase';
import { Colors, Typography, Spacing, Radius } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';

type ErrorType = 'expired' | 'already_used' | 'server_error' | 'unknown';

export default function ConfirmEmailScreen() {
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorType, setErrorType] = useState<ErrorType>('unknown');
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const handleConfirmation = async () => {
      try {
        const hash = window.location.hash;
        const search = window.location.search;
        const hashParams = new URLSearchParams(hash.replace('#', ''));
        const searchParams = new URLSearchParams(search);

        const accessToken = hashParams.get('access_token') || searchParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token') || searchParams.get('refresh_token');
        const errorCode = hashParams.get('error') || searchParams.get('error');
        const errorCodeParam = hashParams.get('error_code') || searchParams.get('error_code');

        if (errorCode) {
          if (errorCodeParam === 'otp_expired') setErrorType('expired');
          else if (errorCodeParam === 'unexpected_failure') setErrorType('already_used');
          else setErrorType('server_error');
          setStatus('error');
          return;
        }

        if (accessToken) {
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken ?? '',
          });

          if (error) {
            setErrorType('server_error');
            setStatus('error');
          } else if (data.session) {
            // Session set successfully — go straight to dashboard
            setStatus('success');
            setShowModal(true);
          }
          return;
        }

        // No token — check existing session
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          setStatus('success');
          setShowModal(true);
        } else {
          setErrorType('unknown');
          setStatus('error');
        }
      } catch (err: any) {
        setErrorType('server_error');
        setStatus('error');
      }
    };

    handleConfirmation();
  }, []);

  const getErrorContent = () => {
    switch (errorType) {
      case 'expired':
        return {
          title: 'Link Expired',
          message: 'This confirmation link has expired. Please register again or request a new link.',
          action: 'Register Again',
          onAction: () => router.replace('/(auth)/register'),
        };
      case 'already_used':
        return {
          title: 'Already Confirmed ✦',
          message: 'Your email is already confirmed. Go ahead and log in!',
          action: 'Go to Login',
          onAction: () => router.replace('/(auth)/login'),
        };
      case 'server_error':
        return {
          title: 'Link Already Used',
          message: 'This link was already used or expired. Your account may already be active — try logging in!',
          action: 'Go to Login',
          onAction: () => router.replace('/(auth)/login'),
        };
      default:
        return {
          title: 'Invalid Link',
          message: 'This confirmation link is invalid. Please register again.',
          action: 'Register Again',
          onAction: () => router.replace('/(auth)/register'),
        };
    }
  };

  const errorContent = getErrorContent();

  return (
    <SafeAreaView style={styles.container}>
      {status === 'loading' && (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.yellow} />
          <Text style={styles.loadingText}>Verifying your email...</Text>
        </View>
      )}

      {status === 'error' && (
        <View style={styles.center}>
          <View style={[styles.iconCircle, errorType === 'already_used' && styles.iconCircleYellow]}>
            <Ionicons
              name={errorType === 'already_used' ? 'checkmark-circle' : 'close-circle'}
              size={48}
              color={errorType === 'already_used' ? Colors.yellow : Colors.red}
            />
          </View>
          <Text style={[styles.errorTitle, errorType === 'already_used' && { color: Colors.yellow }]}>
            {errorContent.title}
          </Text>
          <Text style={styles.errorText}>{errorContent.message}</Text>
          <TouchableOpacity style={styles.btn} onPress={errorContent.onAction}>
            <Text style={styles.btnText}>{errorContent.action}</Text>
          </TouchableOpacity>
          {errorType !== 'already_used' && (
            <TouchableOpacity style={styles.secondaryBtn} onPress={() => router.replace('/(auth)/login')}>
              <Text style={styles.secondaryBtnText}>Try Login Instead</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      <Modal visible={showModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalStar}>✦</Text>
            <Text style={styles.modalTitle}>Welcome to{'\n'}Stars Between Us!</Text>
            <Text style={styles.modalMessage}>
              Your email has been confirmed. Your universe awaits.
            </Text>
            <TouchableOpacity
              style={styles.modalBtn}
              onPress={() => {
                setShowModal(false);
                router.replace('/(app)/dashboard');
              }}
            >
              <Text style={styles.modalBtnText}>Enter Your Universe</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.black },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xl },
  loadingText: { color: Colors.textSecondary, marginTop: Spacing.md, fontSize: Typography.base },
  iconCircle: { width: 90, height: 90, borderRadius: 45, backgroundColor: Colors.redGlow, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.lg },
  iconCircleYellow: { backgroundColor: Colors.yellowGlow },
  errorTitle: { fontSize: Typography['2xl'], fontWeight: Typography.bold, color: Colors.red, marginBottom: Spacing.sm, textAlign: 'center' },
  errorText: { fontSize: Typography.base, color: Colors.textSecondary, textAlign: 'center', marginBottom: Spacing.xl, lineHeight: Typography.base * 1.6 },
  btn: { width: '100%', backgroundColor: Colors.yellow, padding: Spacing.md, borderRadius: Radius.md, alignItems: 'center', marginBottom: Spacing.md },
  btnText: { color: Colors.black, fontWeight: Typography.bold, fontSize: Typography.base },
  secondaryBtn: { padding: Spacing.md },
  secondaryBtnText: { color: Colors.textMuted, fontSize: Typography.sm, textDecorationLine: 'underline' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: Colors.darkPanel, borderRadius: Radius.xl, padding: Spacing.xl, width: '85%', alignItems: 'center', borderWidth: 1, borderColor: Colors.yellowBorder },
  modalStar: { fontSize: 48, color: Colors.yellow, marginBottom: Spacing.md },
  modalTitle: { fontSize: Typography['2xl'], fontWeight: Typography.bold, color: Colors.textPrimary, textAlign: 'center', marginBottom: Spacing.md },
  modalMessage: { fontSize: Typography.base, color: Colors.textSecondary, textAlign: 'center', marginBottom: Spacing.xl, lineHeight: Typography.base * 1.6 },
  modalBtn: { width: '100%', backgroundColor: Colors.yellow, padding: Spacing.md, borderRadius: Radius.md, alignItems: 'center' },
  modalBtnText: { color: Colors.black, fontWeight: Typography.bold, fontSize: Typography.base },
});
