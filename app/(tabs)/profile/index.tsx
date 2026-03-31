import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  StatusBar, useWindowDimensions, ActivityIndicator, Switch,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { getUser, logout } from '../../../services/authService';
import { getTheme } from '../../../constants/theme';
import { useColorScheme } from '../../../hooks/use-color-scheme';

const HEADER_HEIGHT = 260;
const CARD_OVERLAP  = 60;

export default function Profil() {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const theme = getTheme(colorScheme);
  const isDark = colorScheme === 'dark';

  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(isDark);

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
      await logout();
    } catch (err) {
      console.error('Logout error', err);
    } finally {
      router.replace('/(auth)/welcome');
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.background }}>
        <ActivityIndicator size="large" color="#3FCC54" />
      </View>
    );
  }

  const hasPhone = !!user?.phone;

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
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
        {/* ✅ Only name shown — email removed */}
        <Text style={styles.userName}>{user?.name ?? '-'}</Text>
      </LinearGradient>

      {/* ── Floating info card ── */}
      <View style={[
        styles.floatingCard,
        { top: HEADER_HEIGHT - CARD_OVERLAP, left: 16, right: 16, backgroundColor: theme.card ?? '#fff' }
      ]}>
        {/* Email row — with arrow to change email */}
        <TouchableOpacity
          style={styles.infoRow}
          activeOpacity={0.7}
          onPress={() => router.push('/(tabs)/profile/change-email')}
        >
          <View style={styles.iconCircle}>
            <Ionicons name="mail-outline" size={18} color="#3FCC54" />
          </View>
          <View style={styles.infoText}>
            <Text style={[styles.infoLabel, { color: theme.secondary }]}>Email</Text>
            <Text style={[styles.infoValue, { color: theme.text }]}>{user?.email ?? '-'}</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#3FCC54" />
        </TouchableOpacity>

        <View style={styles.divider} />

        {/* Phone number row — with arrow to change phone */}
        <TouchableOpacity
          style={styles.infoRow}
          activeOpacity={0.7}
          onPress={() => router.push('/(tabs)/profile/change-phone')}
        >
          <View style={styles.iconCircle}>
            <Ionicons name="call-outline" size={18} color="#3FCC54" />
          </View>
          <View style={styles.infoText}>
            <Text style={[styles.infoLabel, { color: theme.secondary }]}>Nombor Telefon</Text>
            {hasPhone ? (
              <Text style={[styles.infoValue, { color: theme.text }]}>{user.phone}</Text>
            ) : (
              // ✅ Alert-style hint if no phone registered
              <View style={styles.phoneMissing}>
                <Ionicons name="alert-circle-outline" size={13} color="#F59E0B" />
                <Text style={styles.phoneMissingText}>Nombor telefon belum didaftarkan</Text>
              </View>
            )}
          </View>
          <Ionicons name="chevron-forward" size={18} color="#3FCC54" />
        </TouchableOpacity>
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
        <View style={[styles.card, { backgroundColor: theme.card ?? '#fff' }]}>

          {/* Keamanan → change password */}
          <TouchableOpacity
            style={styles.settingsRow}
            activeOpacity={0.7}
            onPress={() => router.push('/(tabs)/profile/change-password')}
          >
            <View style={styles.iconCircle}>
              <Ionicons name="lock-closed-outline" size={18} color="#3FCC54" />
            </View>
            <Text style={[styles.settingsLabel, { color: theme.text }]}>Keamanan</Text>
            <Ionicons name="chevron-forward" size={18} color="#3FCC54" />
          </TouchableOpacity>

          <View style={styles.divider} />

          {/* ✅ Dark / Light mode toggle */}
          <View style={styles.settingsRow}>
            <View style={styles.iconCircle}>
              <Ionicons name={darkMode ? 'moon-outline' : 'sunny-outline'} size={18} color="#3FCC54" />
            </View>
            <Text style={[styles.settingsLabel, { color: theme.text }]}>
              {darkMode ? 'Mod Gelap' : 'Mod Cerah'}
            </Text>
            <Switch
              value={darkMode}
              onValueChange={(val) => setDarkMode(val)}
              trackColor={{ false: '#D1D5DB', true: '#3FCC5480' }}
              thumbColor={darkMode ? '#3FCC54' : '#fff'}
            />
          </View>

          <View style={styles.divider} />

          {/* Pengaturan → data privacy */}
          <TouchableOpacity
            style={styles.settingsRow}
            activeOpacity={0.7}
            onPress={() => router.push('/(tabs)/profile/data-privacy')}
          >
            <View style={styles.iconCircle}>
              <Ionicons name="document-text-outline" size={18} color="#3FCC54" />
            </View>
            <Text style={[styles.settingsLabel, { color: theme.text }]}>Dasar Privasi</Text>
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
  container: { flex: 1 },
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
  userName: { fontSize: 16, fontWeight: '700', color: '#fff' },
  floatingCard: {
    position: 'absolute', zIndex: 10,
    borderRadius: 20, paddingHorizontal: 16, paddingVertical: 4,
    shadowColor: '#000', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.14, shadowRadius: 20, elevation: 10,
  },
  scroll: { paddingHorizontal: 16, gap: 14 },
  cardSpacer: { height: 180 },
  card: {
    borderRadius: 20,
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
  infoLabel: { fontSize: 12, marginBottom: 2 },
  infoValue: { fontSize: 14, fontWeight: '700' },
  phoneMissing: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  phoneMissingText: { fontSize: 12, color: '#F59E0B', fontWeight: '600' },
  divider: { height: 1, backgroundColor: '#F0F5F3', marginLeft: 52 },
  settingsRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, gap: 14 },
  settingsLabel: { flex: 1, fontSize: 14, fontWeight: '700' },
  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 10, backgroundColor: '#FFF0F0', borderRadius: 30,
    borderWidth: 1.5, borderColor: '#E05252', paddingVertical: 16, marginTop: 4,
  },
  logoutText: { color: '#E05252', fontSize: 14, fontWeight: '600' },
});