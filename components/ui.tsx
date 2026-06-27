import React from 'react';
import {
  TouchableOpacity, Text, TextInput, View, StyleSheet,
  ActivityIndicator, TouchableOpacityProps, TextInputProps,
  ViewStyle, TextStyle,
} from 'react-native';
import { Colors, Typography, Spacing, Radius, Shadow } from '@/constants/theme';

interface ButtonProps extends TouchableOpacityProps {
  label: string;
  loading?: boolean;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
}

export function Button({ label, loading = false, variant = 'primary', size = 'md', disabled, style, ...rest }: ButtonProps) {
  const isDisabled = disabled || loading;
  return (
    <TouchableOpacity
      style={[styles.btnBase, styles[`btn_${variant}`], styles[`btn_size_${size}`], isDisabled && styles.btnDisabled, style as ViewStyle]}
      disabled={isDisabled}
      activeOpacity={0.75}
      {...rest}
    >
      {loading
        ? <ActivityIndicator color={variant === 'primary' ? Colors.black : Colors.yellow} size="small" />
        : <Text style={[styles.btnText, styles[`btnText_${variant}`], styles[`btnText_size_${size}`]]}>{label}</Text>
      }
    </TouchableOpacity>
  );
}

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export function Input({ label, error, leftIcon, rightIcon, style, ...rest }: InputProps) {
  return (
    <View style={styles.inputWrapper}>
      {label ? <Text style={styles.inputLabel}>{label}</Text> : null}
      <View style={[styles.inputContainer, error ? styles.inputError : null]}>
        {leftIcon ? <View style={styles.inputIcon}>{leftIcon}</View> : null}
        <TextInput style={[styles.inputField, style as ViewStyle]} placeholderTextColor={Colors.textMuted} selectionColor={Colors.yellow} {...rest} />
        {rightIcon ? <View style={styles.inputIcon}>{rightIcon}</View> : null}
      </View>
      {error ? <Text style={styles.inputErrorText}>{error}</Text> : null}
    </View>
  );
}

export function Divider({ label }: { label?: string }) {
  return (
    <View style={styles.divider}>
      <View style={styles.dividerLine} />
      {label ? <Text style={styles.dividerLabel}>{label}</Text> : null}
      <View style={styles.dividerLine} />
    </View>
  );
}

const styles = StyleSheet.create({
  btnBase: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderRadius: Radius.md, borderWidth: 1.5, borderColor: 'transparent' },
  btn_primary: { backgroundColor: Colors.yellow, ...Shadow.yellow },
  btn_secondary: { backgroundColor: 'transparent', borderColor: Colors.yellow },
  btn_ghost: { backgroundColor: 'transparent', borderColor: 'transparent' },
  btn_danger: { backgroundColor: Colors.red, ...Shadow.red },
  btn_size_sm: { paddingVertical: 6, paddingHorizontal: Spacing.md },
  btn_size_md: { paddingVertical: 12, paddingHorizontal: Spacing.lg },
  btn_size_lg: { paddingVertical: Spacing.md, paddingHorizontal: Spacing.xl },
  btnDisabled: { opacity: 0.4 },
  btnText: { fontWeight: Typography.bold, letterSpacing: 0.5 },
  btnText_primary: { color: Colors.black },
  btnText_secondary: { color: Colors.yellow },
  btnText_ghost: { color: Colors.textSecondary },
  btnText_danger: { color: Colors.textPrimary },
  btnText_size_sm: { fontSize: Typography.sm },
  btnText_size_md: { fontSize: Typography.base },
  btnText_size_lg: { fontSize: Typography.md },
  inputWrapper: { marginBottom: Spacing.md },
  inputLabel: { color: Colors.textSecondary, fontSize: Typography.sm, fontWeight: Typography.medium, marginBottom: Spacing.xs, letterSpacing: 0.3 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, borderRadius: Radius.md, borderWidth: 1.5, borderColor: Colors.border },
  inputError: { borderColor: Colors.red },
  inputIcon: { paddingHorizontal: Spacing.md },
  inputField: { flex: 1, color: Colors.textPrimary, fontSize: Typography.base, paddingVertical: 12, paddingHorizontal: Spacing.md },
  inputErrorText: { color: Colors.red, fontSize: Typography.xs, marginTop: Spacing.xs },
  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: Spacing.md },
  dividerLine: { flex: 1, height: 1, backgroundColor: Colors.border },
  dividerLabel: { color: Colors.textMuted, fontSize: Typography.xs, marginHorizontal: Spacing.md, letterSpacing: 0.5 },
});
