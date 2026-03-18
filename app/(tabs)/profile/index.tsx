import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  useWindowDimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

// ── Hardcoded user data ──
const USER = {
  name: 'Ahmad Rahman',
  email: 'ahmadrahman@gmail.com',
  phone: '08XXXXXXXXXX',
  ktp: '32XXXXXXXXXXX',
};

export default function Profil() {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const handleLogout = () => {
    // TODO: clear auth state then redirect
    router.replace('/(auth)/welcome');
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* ── Green gradient header ── */}
      <LinearGradient
        colors={['#3FCC54', '#00B99B']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: insets.top + 12 }]}
      >
        <Text style={styles.headerTitle}>Profil</Text>

        {/* Avatar circle */}
        <View style={styles.avatarCircle}>
          <Ionicons name="person" size={48} color="rgba(63,204,84,0.8)" />
        </View>

        <Text style={styles.userName}>{USER.name}</Text>
        <Text style={styles.userEmail}>{USER.email}</Text>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Info card ── */}
        <View style={styles.card}>
          {/* Email row */}
          <View style={styles.infoRow}>
            <View style={styles.iconCircle}>
              <Ionicons name="mail-outline" size={18} color="#3FCC54" />
            </View>
            <View style={styles.infoText}>
              <Text style={styles.infoLabel}>Email</Text>
              <Text style={styles.infoValue}>{USER.email}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          {/* Phone row */}
          <View style={styles.infoRow}>
            <View style={styles.iconCircle}>
              <Ionicons name="call-outline" size={18} color="#3FCC54" />
            </View>
            <View style={styles.infoText}>
              <Text style={styles.infoLabel}>Telepon</Text>
              <Text style={styles.infoValue}>{USER.phone}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          {/* KTP row */}
          <View style={styles.infoRow}>
            <View style={styles.iconCircle}>
              <Ionicons name="card-outline" size={18} color="#3FCC54" />
            </View>
            <View style={styles.infoText}>
              <Text style={styles.infoLabel}>KTP</Text>
              <Text style={styles.infoValue}>{USER.ktp}</Text>
            </View>
          </View>
        </View>

        {/* ── Settings card ── */}
        <View style={styles.card}>
          {/* Keamanan */}
          <TouchableOpacity style={styles.settingsRow} activeOpacity={0.7}>
            <View style={styles.iconCircle}>
              <Ionicons name="lock-closed-outline" size={18} color="#3FCC54" />
            </View>
            <Text style={styles.settingsLabel}>Keamanan</Text>
            <Ionicons name="chevron-forward" size={18} color="#3FCC54" style={styles.chevron} />
          </TouchableOpacity>

          <View style={styles.divider} />

          {/* Pengaturan */}
          <TouchableOpacity style={styles.settingsRow} activeOpacity={0.7}>
            <View style={styles.iconCircle}>
              <Ionicons name="settings-outline" size={18} color="#3FCC54" />
            </View>
            <Text style={styles.settingsLabel}>Pengaturan</Text>
            <Ionicons name="chevron-forward" size={18} color="#3FCC54" style={styles.chevron} />
          </TouchableOpacity>
        </View>

        {/* ── Logout button ── */}
        <TouchableOpacity
          style={styles.logoutBtn}
          onPress={handleLogout}
          activeOpacity={0.85}
        >
          <Ionicons name="log-out-outline" size={20} color="#E05252" />
          <Text style={styles.logoutText}>Keluar dari Akun</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F7F6',
  },

  // Header
  header: {
    alignItems: 'center',
    paddingBottom: 32,
    paddingHorizontal: 24,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 16,
  },
  avatarCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  userName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.85)',
  },

  // Scroll
  scroll: {
    padding: 16,
    gap: 14,
  },

  // Cards
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingVertical: 4,
    paddingHorizontal: 16,
    shadowColor: '#0A3D2A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 14,
  },

  // Info rows
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    gap: 14,
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#EEF9F1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoText: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: '#9ABFB5',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1A2E27',
  },

  divider: {
    height: 1,
    backgroundColor: '#F0F5F3',
    marginLeft: 52,
  },

  // Settings rows
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    gap: 14,
  },
  settingsLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#1A2E27',
  },
  chevron: {
    marginLeft: 'auto',
  },

  // Logout
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#FEE8E8',
    borderRadius: 30,
    paddingVertical: 16,
    marginTop: 4,
  },
  logoutText: {
    color: '#E05252',
    fontSize: 14,
    fontWeight: '600',
  },
});