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
import { Spacing } from '@/constants/theme';

export default function RegisterScreen() {
  const { register, state, clearError } = useAuth();

  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState('');

  const handleRegister = async () => {
    setLocalError('');
    clearError();

    if (!email.trim() || !username.trim() || !password || !confirmPassword) {
      setLocalError('Semua field harus diisi');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setLocalError('Format email tidak valid');
      return;
    }
    if (username.trim().length < 3) {
      setLocalError('Username minimal 3 karakter');
      return;
    }
    if (password.length < 6) {
      setLocalError('Password minimal 6 karakter');
      return;
    }
    if (password !== confirmPassword) {
      setLocalError('Password tidak cocok');
      return;
    }

    const success = await register({
      email: email.trim(),
      username: username.trim(),
      password,
    });

    if (success) {
      router.replace('/(tabs)' as any);
    }
  };

  const displayError = localError || state.error;

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
            {/* Header */}
            <Pressable
              style={styles.backBtn}
              onPress={() => {
                if (router.canGoBack()) {
                  router.back();
                } else {
                  router.replace('/(auth)/login' as any);
                }
              }}
            >
              <Text style={styles.backText}>← Kembali</Text>
            </Pressable>

            {/* Logo */}
            <View style={styles.logoContainer}>
              <View style={styles.logoBox}>
                <Text style={styles.logoEmoji}>📖</Text>
              </View>
              <Text style={styles.logoText}>Buat Akun</Text>
              <Text style={styles.tagline}>Bergabung dan mulai baca komik</Text>
            </View>

            {/* Form */}
            <View style={[styles.card, { backgroundColor: '#13131A' }]}>
              {displayError ? (
                <View style={styles.errorBox}>
                  <Text style={styles.errorText}>⚠️ {displayError}</Text>
                </View>
              ) : null}

              <View style={styles.field}>
                <Text style={styles.label}>Username</Text>
                <TextInput
                  id="register-username"
                  style={styles.input}
                  placeholder="Nama panggilanmu"
                  placeholderTextColor="#4B5563"
                  value={username}
                  onChangeText={(t) => { setUsername(t); setLocalError(''); clearError(); }}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Email</Text>
                <TextInput
                  id="register-email"
                  style={styles.input}
                  placeholder="nama@email.com"
                  placeholderTextColor="#4B5563"
                  value={email}
                  onChangeText={(t) => { setEmail(t); setLocalError(''); clearError(); }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Password</Text>
                <View>
                  <TextInput
                    id="register-password"
                    style={[styles.input, { paddingRight: 50 }]}
                    placeholder="Min. 6 karakter"
                    placeholderTextColor="#4B5563"
                    value={password}
                    onChangeText={(t) => { setPassword(t); setLocalError(''); }}
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

              <View style={styles.field}>
                <Text style={styles.label}>Konfirmasi Password</Text>
                <TextInput
                  id="register-confirm-password"
                  style={styles.input}
                  placeholder="Ulangi password"
                  placeholderTextColor="#4B5563"
                  value={confirmPassword}
                  onChangeText={(t) => { setConfirmPassword(t); setLocalError(''); }}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                />
              </View>

              <Pressable
                id="register-submit"
                style={({ pressed }) => [
                  styles.registerBtn,
                  { opacity: pressed || state.isLoading ? 0.8 : 1 },
                ]}
                onPress={handleRegister}
                disabled={state.isLoading}
              >
                {state.isLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.registerBtnText}>Daftar Sekarang</Text>
                )}
              </Pressable>

              <Pressable
                style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1, alignItems: 'center' })}
                onPress={() => {
                  if (router.canGoBack()) {
                    router.back();
                  } else {
                    router.replace('/(auth)/login' as any);
                  }
                }}
              >
                <Text style={styles.loginLink}>
                  Sudah punya akun?{' '}
                  <Text style={{ color: '#FF6B35', fontWeight: '700' }}>Masuk</Text>
                </Text>
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
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: '#6C63FF20',
    top: -80,
    left: -60,
  },
  bgCircle2: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#FF6B3520',
    bottom: 80,
    right: -50,
  },
  scroll: {
    flexGrow: 1,
    padding: Spacing.four,
    gap: Spacing.three,
  },
  backBtn: {
    alignSelf: 'flex-start',
    paddingVertical: 4,
  },
  backText: {
    color: '#FF6B35',
    fontSize: 15,
    fontWeight: '600',
  },
  logoContainer: {
    alignItems: 'center',
    gap: Spacing.one,
    paddingVertical: Spacing.two,
  },
  logoBox: {
    width: 64,
    height: 64,
    borderRadius: 18,
    backgroundColor: '#6C63FF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
  },
  logoEmoji: {
    fontSize: 32,
  },
  logoText: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
    marginTop: Spacing.one,
  },
  tagline: {
    fontSize: 13,
    color: '#6B7280',
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
    color: '#9CA3AF',
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: Spacing.three,
    fontSize: 15,
    backgroundColor: '#1E1E2E',
    color: '#fff',
    borderColor: '#2D2D3D',
  },
  eyeBtn: {
    position: 'absolute',
    right: 12,
    top: 12,
  },
  eyeText: {
    fontSize: 18,
  },
  registerBtn: {
    backgroundColor: '#6C63FF',
    borderRadius: 12,
    padding: Spacing.three,
    alignItems: 'center',
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 6,
    marginTop: Spacing.one,
  },
  registerBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  loginLink: {
    color: '#9CA3AF',
    fontSize: 14,
  },
});
