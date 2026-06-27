import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radius } from '@/constants/theme';

export default function CheckEmailScreen() {
    const router = useRouter();
    const { email } = useLocalSearchParams<{ email: string }>();

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                <View style={styles.iconContainer}>
                    <Ionicons name="mail-outline" size={80} color={Colors.yellow} />
                </View>

                <Text style={styles.title}>Check Your Email</Text>

                <Text style={styles.description}>
                    We've sent a confirmation link to:
                </Text>

                <Text style={styles.email}>{email || 'your email address'}</Text>

                <Text style={styles.instructions}>
                    Click the link in the email to verify your account.{'\n'}
                    After verification, you can log in.
                </Text>

                <View style={styles.buttonContainer}>
                    <TouchableOpacity
                        style={styles.loginButton}
                        onPress={() => router.replace('/(auth)/login')}
                    >
                        <Text style={styles.loginButtonText}>Go to Login</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.resendButton}
                        onPress={() => router.back()}
                    >
                        <Text style={styles.resendButtonText}>Back to Sign Up</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.starRow}>
                    {['✦', '✧', '✦', '✧', '✦'].map((s, i) => (
                        <Text key={i} style={[styles.starDeco, { opacity: i === 2 ? 1 : 0.3 }]}>
                            {s}
                        </Text>
                    ))}
                </View>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.black,
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: Spacing.xl,
    },
    iconContainer: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: Colors.darkPanel,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: Spacing.xl,
        borderWidth: 2,
        borderColor: Colors.yellow,
    },
    title: {
        fontSize: Typography['2xl'],
        fontWeight: Typography.bold,
        color: Colors.yellow,
        marginBottom: Spacing.md,
        textAlign: 'center',
    },
    description: {
        fontSize: Typography.base,
        color: Colors.textSecondary,
        marginBottom: Spacing.sm,
    },
    email: {
        fontSize: Typography.md,
        fontWeight: Typography.semibold,
        color: Colors.textPrimary,
        marginBottom: Spacing.lg,
    },
    instructions: {
        fontSize: Typography.sm,
        color: Colors.textMuted,
        textAlign: 'center',
        marginBottom: Spacing.xl,
        lineHeight: 20,
    },
    buttonContainer: {
        width: '100%',
        gap: Spacing.md,
    },
    loginButton: {
        backgroundColor: Colors.yellow,
        paddingVertical: Spacing.md,
        borderRadius: Radius.md,
        alignItems: 'center',
    },
    loginButtonText: {
        color: Colors.black,
        fontSize: Typography.base,
        fontWeight: Typography.bold,
    },
    resendButton: {
        backgroundColor: Colors.surface,
        paddingVertical: Spacing.md,
        borderRadius: Radius.md,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: Colors.border,
    },
    resendButtonText: {
        color: Colors.textSecondary,
        fontSize: Typography.base,
    },
    starRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: Spacing.sm,
        marginTop: Spacing['2xl'],
    },
    starDeco: {
        color: Colors.yellow,
        fontSize: 14,
    },
});