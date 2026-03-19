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

const USER = {
  name: 'Ahmad Rahman',
  email: 'ahmadrahman@gmail.com',
  phone: '08XXXXXXXXXX',
  ktp: '32XXXXXXXXXXX',
};

const HEADER_HEIGHT = 300;
const CARD_OVERLAP  = 60; // how many px the card sits inside the green header

export default function Profil() {
  const { width } = useWindowDimensions();
  const insets     = useSafeAreaInsets();

  const handleLogout = () => {
    router.replace('/(auth)/welcome');
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* ── Green gradient header (fixed behind everything) ── */}
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
        <Text style={styles.userName}>{USER.name}</Text>
        <Text style={styles.userEmail}>{USER.email}</Text>
      </LinearGradient>

      {/* ── Floating info card — absolutely positioned over the header ── */}
      <View style={[
        styles.floatingCard,
        {
          top: HEADER_HEIGHT - CARD_OVERLAP,
          left: 16,
          right: 16,
        }
      ]}>
        {/* Email */}
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

        {/* Phone */}
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

        {/* KTP */}
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

      {/* ── Scroll content below the floating card ── */}
      <ScrollView
        style={{ marginTop: HEADER_HEIGHT - CARD_OVERLAP }}
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: insets.bottom + 24 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Spacer so scroll starts below the floating card */}
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
  container: {
    flex: 1,
    backgroundColor: '#F4F7F6',
  },

  // Fixed green header
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 16,
    position: 'absolute',
    top: 56,
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

  // Floating info card — absolutely on top of header
  floatingCard: {
    position: 'absolute',
    zIndex: 10,
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.14,
    shadowRadius: 20,
    elevation: 10,
  },

  // Scroll
  scroll: {
    paddingHorizontal: 16,
    gap: 14,
  },
  cardSpacer: {
    height: 230, // enough to clear the floating info card + gap
  },

  // Settings card — matches floatingCard style
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingVertical: 4,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.14,
    shadowRadius: 20,
    elevation: 10,
    marginBottom: 14,
  },

  // Rows
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
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    gap: 14,
  },
  settingsLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: '#1A2E27',
  },

  // Logout
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#FFF0F0',
    borderRadius: 30,
    borderWidth: 1.5,
    borderColor: '#E05252',
    paddingVertical: 16,
    marginTop: 4,
  },
  logoutText: {
    color: '#E05252',
    fontSize: 14,
    fontWeight: '600',
  },
});