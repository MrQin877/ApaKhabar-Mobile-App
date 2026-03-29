import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  useWindowDimensions,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { getUser, logout } from '../../../services/authService';

const HEADER_HEIGHT = 300;
const CARD_OVERLAP  = 60;

export default function Profil() {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Load user from storage
  useEffect(() => {
    const loadUser = async () => {
      try {
        const userData = await getUser();
        setUser(userData);
      } catch (err) {
        console.error('Failed to load user', err);
      } finally {
        setLoading(false);
      }
    };
    loadUser();
  }, []);

  const handleLogout = async () => {
    try {
      await logout(); // calls Laravel /api/logout + clears token
    } catch (err) {
      console.error('Logout error', err);
    } finally {
      router.replace('/(auth)/welcome');
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#3FCC54" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* ── Green gradient header ── */}
      <LinearGradient
        colors={['#3FCC54', '#00B99B']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.header, { height: HEADER_HEIGHT, paddingTop: insets.top + 12 }]}
      >
        <Text style={styles.headerTitle}>Profil</Text>
        <View style={styles.avatarCircle}>
          <Ionicons name="person" size={48} color="rgba(63,204,84,0.8)" />
        </View>
        <Text style={styles.userName}>{user?.name ?? '-'}</Text>
        <Text style={styles.userEmail}>{user?.email ?? '-'}</Text>
      </LinearGradient>

      {/* ── Floating info card ── */}
      <View style={[
        styles.floatingCard,
        { top: HEADER_HEIGHT - CARD_OVERLAP, left: 16, right: 16 }
      ]}>
        {/* Email */}
        <View style={styles.infoRow}>
          <View style={styles.iconCircle}>
            <Ionicons name="mail-outline" size={18} color="#3FCC54" />
          </View>
          <View style={styles.infoText}>
            <Text style={styles.infoLabel}>Email</Text>
            <Text style={styles.infoValue}>{user?.email ?? '-'}</Text>
          </View>
        </View>
        <View style={styles.divider} />

        {/* Role */}
        <View style={styles.infoRow}>
          <View style={styles.iconCircle}>
            <Ionicons name="shield-outline" size={18} color="#3FCC54" />
          </View>
          <View style={styles.infoText}>
            <Text style={styles.infoLabel}>Peranan</Text>
            <Text style={styles.infoValue}>{user?.role ?? '-'}</Text>
          </View>
        </View>
      </View>

      {/* ── Scroll content ── */}
      <ScrollView
        style={{ marginTop: HEADER_HEIGHT - CARD_OVERLAP }}
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: insets.bottom + 24 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.cardSpacer} />

        {/* Settings card */}
        <View style={styles.card}>
          <TouchableOpacity style={styles.settingsRow} activeOpacity={0.7}>
            <View style={styles.iconCircle}>
              <Ionicons name="lock-closed-outline" size={18} color="#3FCC54" />
            </View>
            <Text style={styles.settingsLabel}>Keamanan</Text>
            <Ionicons name="chevron-forward" size={18} color="#3FCC54" />
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity style={styles.settingsRow} activeOpacity={0.7}>
            <View style={styles.iconCircle}>
              <Ionicons name="settings-outline" size={18} color="#3FCC54" />
            </View>
            <Text style={styles.settingsLabel}>Pengaturan</Text>
            <Ionicons name="chevron-forward" size={18} color="#3FCC54" />
          </TouchableOpacity>
        </View>

        {/* Logout */}
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
  container: { flex: 1, backgroundColor: '#F4F7F6' },
  header: {
    position: 'absolute', top: 0, left: 0, right: 0,
    alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24,
  },
  headerTitle: {
    fontSize: 16, fontWeight: '700', color: '#fff',
    marginBottom: 16, position: 'absolute', top: 56,
  },
  avatarCircle: {
    width: 90, height: 90, borderRadius: 45,
    backgroundColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 12, borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  userName: { fontSize: 16, fontWeight: '700', color: '#fff', marginBottom: 4 },
  userEmail: { fontSize: 13, color: 'rgba(255,255,255,0.85)' },
  floatingCard: {
    position: 'absolute', zIndex: 10, backgroundColor: '#fff',
    borderRadius: 20, paddingHorizontal: 16, paddingVertical: 4,
    shadowColor: '#000', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.14, shadowRadius: 20, elevation: 10,
  },
  scroll: { paddingHorizontal: 16, gap: 14 },
  cardSpacer: { height: 200 },
  card: {
    backgroundColor: '#fff', borderRadius: 20,
    paddingVertical: 4, paddingHorizontal: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.14, shadowRadius: 20, elevation: 10, marginBottom: 14,
  },
  infoRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, gap: 14 },
  iconCircle: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: '#EEF9F1', alignItems: 'center', justifyContent: 'center',
  },
  infoText: { flex: 1 },
  infoLabel: { fontSize: 12, color: '#9ABFB5', marginBottom: 2 },
  infoValue: { fontSize: 14, fontWeight: '700', color: '#1A2E27' },
  divider: { height: 1, backgroundColor: '#F0F5F3', marginLeft: 52 },
  settingsRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, gap: 14 },
  settingsLabel: { flex: 1, fontSize: 14, fontWeight: '700', color: '#1A2E27' },
  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 10, backgroundColor: '#FFF0F0', borderRadius: 30,
    borderWidth: 1.5, borderColor: '#E05252', paddingVertical: 16, marginTop: 4,
  },
  logoutText: { color: '#E05252', fontSize: 14, fontWeight: '600' },
});