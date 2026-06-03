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

import { useAuth } from '@/context/auth-context';
import { useTheme } from '@/hooks/use-theme';
import { Spacing } from '@/constants/theme';

export default function LoginScreen() {
  const { login, state, clearError } = useAuth();
  const theme = useTheme();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      return;
    }
    const success = await login({ email: email.trim(), password });
    if (success) {
      router.replace('/(tabs)' as any);
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: '#0A0A0F' }]}>
      {/* Background decoration */}
      <View style={styles.bgCircle1} />
      <View style={styles.bgCircle2} />

      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1 }}
        >
          <ScrollView
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled"
          >
            {/* Logo */}
            <View style={styles.logoContainer}>
              <View style={styles.logoBox}>
                <Text style={styles.logoEmoji}>📖</Text>
              </View>
              <Text style={styles.logoText}>Komiku</Text>
              <Text style={styles.tagline}>Baca komik favoritmu kapan saja</Text>
            </View>

            {/* Form */}
            <View style={[styles.card, { backgroundColor: '#13131A' }]}>
              <Text style={styles.cardTitle}>Masuk</Text>

              {state.error && (
                <View style={styles.errorBox}>
                  <Text style={styles.errorText}>⚠️ {state.error}</Text>
                </View>
              )}

              <View style={styles.field}>
                <Text style={[styles.label, { color: '#9CA3AF' }]}>Email</Text>
                <TextInput
                  id="login-email"
                  style={[styles.input, { backgroundColor: '#1E1E2E', color: '#fff', borderColor: '#2D2D3D' }]}
                  placeholder="nama@email.com"
                  placeholderTextColor="#4B5563"
                  value={email}
                  onChangeText={(t) => { setEmail(t); clearError(); }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              <View style={styles.field}>
                <Text style={[styles.label, { color: '#9CA3AF' }]}>Password</Text>
                <View>
                  <TextInput
                    id="login-password"
                    style={[styles.input, { backgroundColor: '#1E1E2E', color: '#fff', borderColor: '#2D2D3D', paddingRight: 50 }]}
                    placeholder="Masukkan password"
                    placeholderTextColor="#4B5563"
                    value={password}
                    onChangeText={(t) => { setPassword(t); clearError(); }}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                  />
                  <Pressable
                    style={styles.eyeBtn}
                    onPress={() => setShowPassword(!showPassword)}
                  >
                    <Text style={styles.eyeText}>{showPassword ? '🙈' : '👁️'}</Text>
                  </Pressable>
                </View>
              </View>

              <Pressable
                id="login-submit"
                style={({ pressed }) => [
                  styles.loginBtn,
                  { opacity: pressed || state.isLoading ? 0.8 : 1 },
                ]}
                onPress={handleLogin}
                disabled={state.isLoading}
              >
                {state.isLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.loginBtnText}>Masuk</Text>
                )}
              </Pressable>

              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>atau</Text>
                <View style={styles.dividerLine} />
              </View>

              <Pressable
                id="goto-register"
                style={({ pressed }) => [
                  styles.registerBtn,
                  { borderColor: '#FF6B35', opacity: pressed ? 0.7 : 1 },
                ]}
                onPress={() => router.push('/(auth)/register' as any)}
              >
                <Text style={styles.registerBtnText}>Daftar Akun Baru</Text>
              </Pressable>
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
  },
  bgCircle1: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: '#FF6B3520',
    top: -100,
    right: -80,
  },
  bgCircle2: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#6C63FF20',
    bottom: 100,
    left: -60,
  },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: Spacing.four,
    gap: Spacing.four,
  },
  logoContainer: {
    alignItems: 'center',
    gap: Spacing.one,
  },
  logoBox: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: '#FF6B35',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
  },
  logoEmoji: {
    fontSize: 36,
  },
  logoText: {
    fontSize: 32,
    fontWeight: '800',
    color: '#fff',
    marginTop: Spacing.two,
  },
  tagline: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  card: {
    borderRadius: 20,
    padding: Spacing.four,
    gap: Spacing.three,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 10,
  },
  cardTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    marginBottom: Spacing.one,
  },
  errorBox: {
    backgroundColor: '#FF000020',
    borderColor: '#FF6B6B',
    borderWidth: 1,
    borderRadius: 10,
    padding: Spacing.two,
  },
  errorText: {
    color: '#FF6B6B',
    fontSize: 13,
  },
  field: {
    gap: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: Spacing.three,
    fontSize: 15,
  },
  eyeBtn: {
    position: 'absolute',
    right: 12,
    top: 12,
  },
  eyeText: {
    fontSize: 18,
  },
  loginBtn: {
    backgroundColor: '#FF6B35',
    borderRadius: 12,
    padding: Spacing.three,
    alignItems: 'center',
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 6,
  },
  loginBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#2D2D3D',
  },
  dividerText: {
    color: '#4B5563',
    fontSize: 13,
  },
  registerBtn: {
    borderWidth: 1.5,
    borderRadius: 12,
    padding: Spacing.three,
    alignItems: 'center',
  },
  registerBtnText: {
    color: '#FF6B35',
    fontSize: 15,
    fontWeight: '600',
  },
});
