import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '@/context/auth-context';
import { Spacing } from '@/constants/theme';

export default function ProfileScreen() {
  const { state, logout } = useAuth();
  const user = state.user;

  const initials = user?.username
    ? user.username.slice(0, 2).toUpperCase()
    : '??';

  return (
    <View style={[styles.root, { backgroundColor: '#0A0A0F' }]}>
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>👤 Profil</Text>
          </View>

          {/* Avatar & Info */}
          <View style={styles.profileCard}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.username}>{user?.username ?? '-'}</Text>
              <Text style={styles.email}>{user?.email ?? '-'}</Text>
              <View style={styles.memberBadge}>
                <Text style={styles.memberText}>✨ Member Komiku</Text>
              </View>
            </View>
          </View>

          {/* Stats (placeholder) */}
          <View style={styles.statsRow}>
            {[
              { label: 'Dibaca', value: '0', emoji: '📖' },
              { label: 'Bookmark', value: '0', emoji: '🔖' },
              { label: 'Chapter', value: '0', emoji: '📑' },
            ].map((s) => (
              <View key={s.label} style={styles.statCard}>
                <Text style={styles.statEmoji}>{s.emoji}</Text>
                <Text style={styles.statValue}>{s.value}</Text>
                <Text style={styles.statLabel}>{s.label}</Text>
              </View>
            ))}
          </View>

          {/* Menu */}
          <View style={styles.menu}>
            <Text style={styles.menuSectionTitle}>Akun</Text>
            {[
              { icon: '📧', label: 'Email', value: user?.email },
              { icon: '👤', label: 'Username', value: user?.username },
              {
                icon: '📅',
                label: 'Bergabung',
                value: user?.createdAt
                  ? new Date(user.createdAt).toLocaleDateString('id-ID', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })
                  : '-',
              },
            ].map((item) => (
              <View key={item.label} style={styles.menuItem}>
                <Text style={styles.menuIcon}>{item.icon}</Text>
                <View style={styles.menuItemContent}>
                  <Text style={styles.menuLabel}>{item.label}</Text>
                  <Text style={styles.menuValue} numberOfLines={1}>
                    {item.value ?? '-'}
                  </Text>
                </View>
              </View>
            ))}
          </View>

          <View style={styles.menu}>
            <Text style={styles.menuSectionTitle}>Aplikasi</Text>
            {[
              { icon: '📖', label: 'Versi', value: '1.0.0' },
              { icon: '🌐', label: 'API', value: 'api.shngm.io' },
            ].map((item) => (
              <View key={item.label} style={styles.menuItem}>
                <Text style={styles.menuIcon}>{item.icon}</Text>
                <View style={styles.menuItemContent}>
                  <Text style={styles.menuLabel}>{item.label}</Text>
                  <Text style={styles.menuValue}>{item.value}</Text>
                </View>
              </View>
            ))}
          </View>

          {/* Logout */}
          <Pressable
            id="logout-btn"
            style={({ pressed }) => [styles.logoutBtn, { opacity: pressed ? 0.8 : 1 }]}
            onPress={logout}
          >
            <Text style={styles.logoutText}>🚪 Keluar dari Akun</Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  scroll: {
    padding: Spacing.four,
    gap: Spacing.three,
    paddingBottom: 40,
  },
  header: {
    marginBottom: Spacing.one,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '800',
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#13131A',
    borderRadius: 16,
    padding: Spacing.four,
    gap: Spacing.three,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#FF6B35',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  avatarText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '800',
  },
  profileInfo: {
    flex: 1,
    gap: 4,
  },
  username: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
  },
  email: {
    color: '#9CA3AF',
    fontSize: 13,
  },
  memberBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#FF6B3520',
    borderColor: '#FF6B35',
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 3,
    marginTop: 4,
  },
  memberText: {
    color: '#FF6B35',
    fontSize: 11,
    fontWeight: '600',
  },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#13131A',
    borderRadius: 12,
    padding: Spacing.two,
    alignItems: 'center',
    gap: 4,
  },
  statEmoji: {
    fontSize: 22,
  },
  statValue: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  statLabel: {
    color: '#6B7280',
    fontSize: 11,
  },
  menu: {
    backgroundColor: '#13131A',
    borderRadius: 16,
    overflow: 'hidden',
    gap: 0,
  },
  menuSectionTitle: {
    color: '#6B7280',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.one,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    gap: Spacing.two,
    borderTopWidth: 1,
    borderTopColor: '#1E1E2E',
  },
  menuIcon: {
    fontSize: 20,
    width: 28,
  },
  menuItemContent: {
    flex: 1,
  },
  menuLabel: {
    color: '#9CA3AF',
    fontSize: 12,
  },
  menuValue: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  logoutBtn: {
    backgroundColor: '#FF000020',
    borderColor: '#FF4444',
    borderWidth: 1,
    borderRadius: 12,
    padding: Spacing.three,
    alignItems: 'center',
    marginTop: Spacing.two,
  },
  logoutText: {
    color: '#FF6B6B',
    fontSize: 15,
    fontWeight: '700',
  },
});
