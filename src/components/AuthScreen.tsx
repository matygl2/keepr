import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, fonts, radius, spacing } from '../constants/theme';
import { useAuth } from '../context/AuthContext';
import { isValidEmail } from '../utils/validation';
import FormField from './FormField';

type Mode = 'login' | 'register';
type Errors = Partial<Record<'name' | 'email' | 'password' | 'confirm', string>>;

export default function AuthScreen() {
  const { login, register } = useAuth();
  const [mode, setMode] = useState<Mode>('register');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const isRegister = mode === 'register';

  const switchMode = (next: Mode) => {
    setMode(next);
    setErrors({});
    setFormError('');
    setPassword('');
    setConfirm('');
  };

  const validate = (): Errors => {
    const next: Errors = {};
    if (isRegister && name.trim().length < 2) next.name = 'Enter your name.';
    if (!isValidEmail(email)) next.email = 'Enter a valid email address.';
    if (isRegister) {
      if (password.length < 6) next.password = 'Use at least 6 characters.';
      if (confirm !== password) next.confirm = 'Passwords do not match.';
    } else if (!password) {
      next.password = 'Enter your password.';
    }
    return next;
  };

  const handleSubmit = async () => {
    if (submitting) return;
    const found = validate();
    setErrors(found);
    setFormError('');
    if (Object.keys(found).length > 0) return;

    setSubmitting(true);
    const result = isRegister
      ? await register({ name, email, password })
      : await login(email, password);

    // On success the app swaps this screen for the main app, so only
    // touch state when something went wrong.
    if (!result.ok) {
      setFormError(result.error);
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.brand}>Keepr</Text>
          <Text style={styles.title}>
            {isRegister ? 'Create your account' : 'Welcome back'}
          </Text>
          <Text style={styles.subtitle}>
            {isRegister
              ? 'Save your products and never miss a warranty.'
              : 'Sign in to see your products and warranties.'}
          </Text>

          {isRegister && (
            <FormField
              label="FULL NAME"
              value={name}
              onChangeText={setName}
              placeholder="Lucía Morales"
              autoCapitalize="words"
              autoComplete="name"
              error={errors.name}
            />
          )}

          <FormField
            label="EMAIL"
            value={email}
            onChangeText={setEmail}
            placeholder="you@email.com"
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            autoComplete="email"
            error={errors.email}
          />

          <FormField
            label="PASSWORD"
            value={password}
            onChangeText={setPassword}
            placeholder="••••••"
            secureTextEntry
            autoCapitalize="none"
            error={errors.password}
          />

          {isRegister && (
            <FormField
              label="CONFIRM PASSWORD"
              value={confirm}
              onChangeText={setConfirm}
              placeholder="••••••"
              secureTextEntry
              autoCapitalize="none"
              error={errors.confirm}
            />
          )}

          {formError ? <Text style={styles.formError}>{formError}</Text> : null}

          <TouchableOpacity
            style={[styles.button, submitting && styles.buttonDisabled]}
            activeOpacity={0.8}
            onPress={handleSubmit}
            disabled={submitting}
          >
            <Text style={styles.buttonText}>
              {submitting ? 'Please wait…' : isRegister ? 'Create account' : 'Sign in'}
            </Text>
          </TouchableOpacity>

          <View style={styles.switchRow}>
            <Text style={styles.switchText}>
              {isRegister ? 'Already have an account?' : "Don't have an account?"}
            </Text>
            <TouchableOpacity onPress={() => switchMode(isRegister ? 'login' : 'register')}>
              <Text style={styles.switchLink}>{isRegister ? 'Sign in' : 'Create one'}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: spacing.lg,
  },
  brand: {
    fontFamily: fonts.serif,
    fontSize: 36,
    color: colors.primary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    fontFamily: fonts.serif,
    fontSize: 24,
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 21,
    marginBottom: spacing.lg,
  },
  formError: {
    color: colors.danger,
    backgroundColor: colors.dangerBg,
    borderRadius: radius.sm,
    padding: spacing.sm,
    fontSize: 13,
    marginBottom: spacing.md,
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: colors.white,
    fontWeight: '700',
    fontSize: 16,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.xs,
    marginTop: spacing.lg,
  },
  switchText: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  switchLink: {
    color: colors.primary,
    fontWeight: '700',
    fontSize: 14,
  },
});
