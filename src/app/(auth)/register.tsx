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
            {/* ── BACK ── */}
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
              <Ionicons name="arrow-back" size={18} color="#4A4A4A" />
              <Text style={styles.backText}>KEMBALI</Text>
            </Pressable>

            {/* ── BRANDING BLOCK ── */}
            <View style={styles.brand}>
              <View style={styles.logoSquare}>
                <Text style={styles.logoChar}>K</Text>
              </View>
              <View style={styles.brandText}>
                <Text style={styles.appName}>KOMIKU</Text>
                <Text style={styles.appTagline}>Bergabung dan mulai baca komik</Text>
              </View>
            </View>

            {/* ── DIVIDER LINE ── */}
            <View style={styles.dividerFull} />

            {/* ── FORM HEADER ── */}
            <View style={styles.formHeader}>
              <Text style={styles.formEyebrow}>PENDAFTARAN</Text>
              <Text style={styles.formTitle}>Buat Akun</Text>
            </View>

            {/* ── ERROR ── */}
            {displayError ? (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle-outline" size={14} color="#FF3B3B" />
                <Text style={styles.errorText}>{displayError}</Text>
              </View>
            ) : null}

            {/* ── FIELDS ── */}
            <View style={styles.fields}>
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>USERNAME</Text>
                <TextInput
                  id="register-username"
                  style={styles.input}
                  placeholder="Nama panggilanmu"
                  placeholderTextColor="#3A3A3A"
                  value={username}
                  onChangeText={(t) => { setUsername(t); setLocalError(''); clearError(); }}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              <View style={styles.field}>
                <Text style={styles.fieldLabel}>EMAIL</Text>
                <TextInput
                  id="register-email"
                  style={styles.input}
                  placeholder="nama@email.com"
                  placeholderTextColor="#3A3A3A"
                  value={email}
                  onChangeText={(t) => { setEmail(t); setLocalError(''); clearError(); }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              <View style={styles.field}>
                <Text style={styles.fieldLabel}>PASSWORD</Text>
                <View style={styles.passwordRow}>
                  <TextInput
                    id="register-password"
                    style={[styles.input, { flex: 1 }]}
                    placeholder="Min. 6 karakter"
                    placeholderTextColor="#3A3A3A"
                    value={password}
                    onChangeText={(t) => { setPassword(t); setLocalError(''); }}
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

              <View style={styles.field}>
                <Text style={styles.fieldLabel}>KONFIRMASI PASSWORD</Text>
                <TextInput
                  id="register-confirm-password"
                  style={styles.input}
                  placeholder="Ulangi password"
                  placeholderTextColor="#3A3A3A"
                  value={confirmPassword}
                  onChangeText={(t) => { setConfirmPassword(t); setLocalError(''); }}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                />
              </View>
            </View>

            {/* ── SUBMIT ── */}
            <Pressable
              id="register-submit"
              style={({ pressed }) => [
                styles.submitBtn,
                { opacity: pressed || state.isLoading ? 0.8 : 1 },
              ]}
              onPress={handleRegister}
              disabled={state.isLoading}
            >
              {state.isLoading ? (
                <ActivityIndicator color="#0D0D0D" />
              ) : (
                <Text style={styles.submitText}>DAFTAR SEKARANG</Text>
              )}
            </Pressable>

            {/* ── LOGIN LINK ── */}
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
              <Text style={styles.switchText}>
                Sudah punya akun?{' '}
                <Text style={styles.switchLink}>Masuk</Text>
              </Text>
            </Pressable>

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
    paddingTop: Spacing.three,
    gap: Spacing.three,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingVertical: 4,
  },
  backText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#4A4A4A',
    letterSpacing: 1.5,
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginTop: Spacing.two,
  },
  logoSquare: {
    width: 48,
    height: 48,
    backgroundColor: '#E8FF00',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoChar: {
    fontSize: 28,
    fontWeight: '900',
    color: '#0D0D0D',
    letterSpacing: -2,
  },
  brandText: {
    gap: 2,
  },
  appName: {
    fontSize: 20,
    fontWeight: '800',
    color: '#F0F0F0',
    letterSpacing: 3,
  },
  appTagline: {
    fontSize: 10,
    color: '#4A4A4A',
    fontWeight: '400',
  },
  dividerFull: {
    height: 1,
    backgroundColor: '#1E1E1E',
    marginVertical: 4,
  },
  formHeader: {
    gap: 4,
  },
  formEyebrow: {
    fontSize: 9,
    fontWeight: '700',
    color: '#4A4A4A',
    letterSpacing: 2.5,
  },
  formTitle: {
    fontSize: 28,
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
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 2.5,
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
