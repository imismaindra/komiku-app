import { router } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { useAuth } from '@/context/auth-context';
import { Spacing } from '@/constants/theme';

export default function LoginScreen() {
  const { login, state, clearError } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) return;
    const success = await login({ email: email.trim(), password });
    if (success) {
      router.replace('/(tabs)' as any);
    }
  };

  return (
    <View style={styles.root}>
      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1 }}
        >
          <ScrollView
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* ── BRANDING BLOCK ── */}
            <View style={styles.brand}>
              <View style={styles.logoSquare}>
                <Text style={styles.logoChar}>K</Text>
              </View>
              <View style={styles.brandText}>
                <Text style={styles.appName}>KOMIKU</Text>
                <Text style={styles.appTagline}>Baca komik favoritmu kapan saja</Text>
              </View>
            </View>

            {/* ── DIVIDER LINE ── */}
            <View style={styles.dividerFull} />

            {/* ── FORM HEADER ── */}
            <View style={styles.formHeader}>
              <Text style={styles.formEyebrow}>AUTENTIKASI</Text>
              <Text style={styles.formTitle}>Masuk</Text>
            </View>

            {/* ── ERROR ── */}
            {state.error && (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle-outline" size={14} color="#FF3B3B" />
                <Text style={styles.errorText}>{state.error}</Text>
              </View>
            )}

            {/* ── FIELDS ── */}
            <View style={styles.fields}>
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>EMAIL</Text>
                <TextInput
                  id="login-email"
                  style={styles.input}
                  placeholder="nama@email.com"
                  placeholderTextColor="#3A3A3A"
                  value={email}
                  onChangeText={(t) => { setEmail(t); clearError(); }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              <View style={styles.field}>
                <Text style={styles.fieldLabel}>PASSWORD</Text>
                <View style={styles.passwordRow}>
                  <TextInput
                    id="login-password"
                    style={[styles.input, { flex: 1 }]}
                    placeholder="Masukkan password"
                    placeholderTextColor="#3A3A3A"
                    value={password}
                    onChangeText={(t) => { setPassword(t); clearError(); }}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                  />
                  <Pressable onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                    <Ionicons
                      name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                      size={18}
                      color="#4A4A4A"
                    />
                  </Pressable>
                </View>
              </View>
            </View>

            {/* ── SUBMIT ── */}
            <Pressable
              id="login-submit"
              style={({ pressed }) => [
                styles.submitBtn,
                { opacity: pressed || state.isLoading ? 0.8 : 1 },
              ]}
              onPress={handleLogin}
              disabled={state.isLoading}
            >
              {state.isLoading ? (
                <ActivityIndicator color="#0D0D0D" />
              ) : (
                <Text style={styles.submitText}>MASUK</Text>
              )}
            </Pressable>

            {/* ── REGISTER LINK ── */}
            <View style={styles.switchRow}>
              <View style={styles.switchLine} />
              <Pressable
                id="goto-register"
                onPress={() => router.push('/(auth)/register' as any)}
              >
                <Text style={styles.switchText}>
                  Belum punya akun?{' '}
                  <Text style={styles.switchLink}>Daftar</Text>
                </Text>
              </Pressable>
              <View style={styles.switchLine} />
            </View>

          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0D0D0D',
  },
  scroll: {
    flexGrow: 1,
    padding: Spacing.four,
    paddingTop: Spacing.five,
    gap: Spacing.three,
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  logoSquare: {
    width: 56,
    height: 56,
    backgroundColor: '#E8FF00',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoChar: {
    fontSize: 32,
    fontWeight: '900',
    color: '#0D0D0D',
    letterSpacing: -2,
  },
  brandText: {
    gap: 2,
  },
  appName: {
    fontSize: 24,
    fontWeight: '800',
    color: '#F0F0F0',
    letterSpacing: 3,
  },
  appTagline: {
    fontSize: 11,
    color: '#4A4A4A',
    fontWeight: '400',
    letterSpacing: 0.3,
  },
  dividerFull: {
    height: 1,
    backgroundColor: '#1E1E1E',
    marginVertical: 4,
  },
  formHeader: {
    gap: 4,
    marginTop: Spacing.two,
  },
  formEyebrow: {
    fontSize: 9,
    fontWeight: '700',
    color: '#4A4A4A',
    letterSpacing: 2.5,
  },
  formTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#F0F0F0',
    letterSpacing: -1,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,59,59,0.08)',
    borderLeftWidth: 3,
    borderLeftColor: '#FF3B3B',
    padding: 12,
  },
  errorText: {
    color: '#FF3B3B',
    fontSize: 12,
    fontWeight: '600',
  },
  fields: {
    gap: Spacing.three,
  },
  field: {
    gap: 8,
  },
  fieldLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#4A4A4A',
    letterSpacing: 2,
  },
  input: {
    backgroundColor: '#141414',
    color: '#F0F0F0',
    fontSize: 15,
    fontWeight: '500',
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  passwordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#141414',
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  eyeBtn: {
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  submitBtn: {
    backgroundColor: '#E8FF00',
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 4,
  },
  submitText: {
    color: '#0D0D0D',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 2.5,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginTop: 4,
  },
  switchLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#1E1E1E',
  },
  switchText: {
    color: '#4A4A4A',
    fontSize: 12,
    fontWeight: '400',
  },
  switchLink: {
    color: '#E8FF00',
    fontWeight: '700',
  },
});
