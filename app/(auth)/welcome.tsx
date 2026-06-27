import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Animated,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Head from 'expo-router/head';
import { Colors, Typography, Spacing, Radius } from '@/constants/theme';
import { Button } from '@/components/ui';

const { width, height } = Dimensions.get('window');

// Floating star particle
function Star({ x, y, size, delay }: { x: number; y: number; size: number; delay: number }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          Animated.sequence([
            Animated.timing(opacity, { toValue: 1, duration: 800, useNativeDriver: true }),
            Animated.timing(opacity, { toValue: 0.2, duration: 1200, useNativeDriver: true }),
            Animated.timing(opacity, { toValue: 0.8, duration: 1000, useNativeDriver: true }),
          ]),
          Animated.sequence([
            Animated.timing(translateY, { toValue: -8, duration: 2000, useNativeDriver: true }),
            Animated.timing(translateY, { toValue: 0, duration: 2000, useNativeDriver: true }),
          ]),
        ]),
      ])
    ).start();
  }, []);

  return (
    <Animated.Text
      style={{
        position: 'absolute',
        left: x,
        top: y,
        fontSize: size,
        color: Colors.yellow,
        opacity,
        transform: [{ translateY }],
      }}
    >
      ✦
    </Animated.Text>
  );
}

const STARS = [
  { x: 30, y: 80, size: 10, delay: 0 },
  { x: width - 60, y: 120, size: 8, delay: 300 },
  { x: 80, y: 180, size: 6, delay: 600 },
  { x: width - 40, y: 220, size: 12, delay: 200 },
  { x: 20, y: height * 0.4, size: 7, delay: 900 },
  { x: width - 80, y: height * 0.45, size: 9, delay: 500 },
  { x: 60, y: height * 0.7, size: 11, delay: 100 },
  { x: width - 30, y: height * 0.72, size: 6, delay: 800 },
  { x: width / 2 - 20, y: 50, size: 8, delay: 400 },
  { x: width / 2 + 40, y: height * 0.6, size: 10, delay: 700 },
];

export default function WelcomeScreen() {
  const router = useRouter();

  // Logo glow animation
  const glow = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    // Logo entrance
    Animated.spring(logoScale, {
      toValue: 1,
      delay: 300,
      useNativeDriver: true,
      tension: 50,
      friction: 7,
    }).start();

    // Pulsing glow
    Animated.loop(
      Animated.sequence([
        Animated.timing(glow, { toValue: 1, duration: 2000, useNativeDriver: true }),
        Animated.timing(glow, { toValue: 0.3, duration: 2000, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const glowOpacity = glow.interpolate({ inputRange: [0, 1], outputRange: [0.1, 0.5] });

  return (
    <>
      <Head>
        <title>Stars Between Us</title>
        <meta name="description" content="A private universe for two." />
      </Head>
      <SafeAreaView style={styles.container}>
        {/* Background stars */}
        {STARS.map((s, i) => (
          <Star key={i} {...s} />
        ))}

        {/* Red accent line — top */}
        <View style={styles.redAccentTop} />

        <View style={styles.content}>
          {/* Logo section */}
          <Animated.View style={[styles.logoSection, { transform: [{ scale: logoScale }] }]}>
            {/* Glow halo behind crown */}
            <Animated.View style={[styles.glowHalo, { opacity: glowOpacity }]} />

            {/* Crown / KH emblem */}
            <View style={styles.crownContainer}>
              <Text style={styles.crownEmoji}>♛</Text>
            </View>

            <Text style={styles.appName}>Stars Between Us</Text>
            <View style={styles.taglineRow}>
              <View style={styles.taglineLine} />
              <Text style={styles.tagline}>our little universe</Text>
              <View style={styles.taglineLine} />
            </View>
          </Animated.View>

          {/* Decorative card */}
          <View style={styles.card}>
            <Text style={styles.cardText}>
              A private space for two people who share{' '}
              <Text style={styles.cardHighlight}>something worth keeping. </Text>
              Messages, memories, and moments — just yours.
            </Text>
          </View>

          {/* Actions */}
          <View style={styles.actions}>
            <Button
              label="Begin Our Story"
              variant="primary"
              size="lg"
              onPress={() => router.push('/(auth)/register')}
              style={styles.primaryBtn}
            />
            <Button
              label="I already have an account"
              variant="secondary"
              size="lg"
              onPress={() => router.push('/(auth)/login')}
            />
          </View>
        </View>

        {/* Red accent line — bottom */}
        <View style={styles.redAccentBottom} />
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.black,
  },
  redAccentTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: Colors.red,
  },
  redAccentBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: Colors.red,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.xl,
    justifyContent: 'space-between',
    paddingVertical: Spacing['2xl'],
  },
  logoSection: {
    alignItems: 'center',
    marginTop: Spacing.xl,
  },
  glowHalo: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: Colors.yellow,
    top: -20,
  },
  crownContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.darkPanel,
    borderWidth: 2,
    borderColor: Colors.yellow,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  crownEmoji: {
    fontSize: 50,
    color: Colors.yellow,
  },
  appName: {
    fontSize: Typography['3xl'],
    fontWeight: Typography.black,
    color: Colors.textPrimary,
    letterSpacing: -0.5,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  taglineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  taglineLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.yellowBorder,
  },
  tagline: {
    color: Colors.yellow,
    fontSize: Typography.sm,
    fontWeight: Typography.medium,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  card: {
    backgroundColor: Colors.darkPanel,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    borderLeftWidth: 3,
    borderLeftColor: Colors.red,
  },
  cardText: {
    color: Colors.textSecondary,
    fontSize: Typography.base,
    lineHeight: Typography.base * Typography.relaxed,
    textAlign: 'center',
  },
  cardHighlight: {
    color: Colors.yellow,
    fontWeight: Typography.semibold,
  },
  actions: {
    gap: Spacing.md,
  },
  primaryBtn: {
    width: '100%',
  },
});
