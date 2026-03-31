import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  StatusBar, ActivityIndicator, Modal, Pressable, Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { getUser, logout } from '../../../services/authService';
import { getTheme } from '../../../constants/theme';
import { useColorScheme } from '../../../hooks/use-color-scheme';
import { useAppearance } from '../../../context/AppearanceContext';

type AppearanceOption = 'system' | 'light' | 'dark';

const APPEARANCE_OPTIONS: { value: AppearanceOption; label: string; icon: string }[] = [
  { value: 'system', label: 'Sistem', icon: 'phone-portrait-outline' },
  { value: 'light',  label: 'Cerah',  icon: 'sunny-outline' },
  { value: 'dark',   label: 'Gelap',  icon: 'moon-outline' },
];

export default function Profil() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const theme = getTheme(colorScheme);

  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { appearance, setAppearance } = useAppearance();
  const [modalVisible, setModalVisible] = useState(false);

  const overlayAnim = useRef(new Animated.Value(0)).current;
  const sheetAnim   = useRef(new Animated.Value(0)).current;

  const openModal = () => {
    setModalVisible(true);
    Animated.timing(overlayAnim, { toValue: 1, duration: 120, useNativeDriver: true }).start(() => {
      Animated.timing(sheetAnim, { toValue: 1, duration: 200, useNativeDriver: true }).start();
    });
  };

  const closeModal = () => {
    Animated.timing(sheetAnim, { toValue: 0, duration: 150, useNativeDriver: true }).start(() => {
      Animated.timing(overlayAnim, { toValue: 0, duration: 100, useNativeDriver: true }).start(() => {
        setModalVisible(false);
      });
    });
  };

  const sheetTranslateY = sheetAnim.interpolate({ inputRange: [0, 1], outputRange: [40, 0] });

  useEffect(() => {
    getUser().then(setUser).catch(console.error).finally(() => setLoading(false));
  }, []);

  const handleLogout = async () => {
    try { await logout(); } catch (err) { console.error(err); } finally {
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
  const currentAppearance = APPEARANCE_OPTIONS.find(o => o.value === appearance)!;

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle="light-content" />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}>

        {/* ── Header ── */}
        <LinearGradient
          colors={['#3FCC54', '#00B99B']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.header, { paddingTop: insets.top + 20 }]}
        >
          <Text style={styles.headerTitle}>Profil</Text>
          <View style={styles.avatarCircle}>
            <Ionicons name="person" size={48} color="rgba(63,204,84,0.8)" />
          </View>
          <Text style={styles.userName}>{user?.name ?? '-'}</Text>
        </LinearGradient>

        {/* ── Info card — overlaps header ── */}
        <View style={styles.cardWrapper}>
          <View style={[styles.card, { backgroundColor: theme.card ?? '#fff' }]}>

            <TouchableOpacity style={styles.row} activeOpacity={0.7} onPress={() => router.push('/(tabs)/profile/change-email')}>
              <View style={styles.iconCircle}>
                <Ionicons name="mail-outline" size={18} color="#3FCC54" />
              </View>
              <View style={styles.rowText}>
                <Text style={[styles.rowLabel, { color: theme.secondary }]}>Email</Text>
                <Text style={[styles.rowValue, { color: theme.text }]}>{user?.email ?? '-'}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#3FCC54" />
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity style={styles.row} activeOpacity={0.7} onPress={() => router.push('/(tabs)/profile/change-phone')}>
              <View style={styles.iconCircle}>
                <Ionicons name="call-outline" size={18} color="#3FCC54" />
              </View>
              <View style={styles.rowText}>
                <Text style={[styles.rowLabel, { color: theme.secondary }]}>Nombor Telefon</Text>
                {hasPhone ? (
                  <Text style={[styles.rowValue, { color: theme.text }]}>{user.phone}</Text>
                ) : (
                  <View style={styles.phoneMissing}>
                    <Ionicons name="alert-circle-outline" size={13} color="#F59E0B" />
                    <Text style={styles.phoneMissingText}>Nombor telefon belum didaftarkan</Text>
                  </View>
                )}
              </View>
              <Ionicons name="chevron-forward" size={18} color="#3FCC54" />
            </TouchableOpacity>

          </View>
        </View>

        {/* ── Settings card ── */}
        <View style={styles.section}>
          <View style={[styles.card, { backgroundColor: theme.card ?? '#fff' }]}>

            <TouchableOpacity style={styles.row} activeOpacity={0.7} onPress={() => router.push('/(tabs)/profile/change-password')}>
              <View style={styles.iconCircle}>
                <Ionicons name="lock-closed-outline" size={18} color="#3FCC54" />
              </View>
              <Text style={[styles.settingsLabel, { color: theme.text }]}>Keamanan</Text>
              <Ionicons name="chevron-forward" size={18} color="#3FCC54" />
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity style={styles.row} activeOpacity={0.7} onPress={openModal}>
              <View style={styles.iconCircle}>
                <Ionicons name={currentAppearance.icon as any} size={18} color="#3FCC54" />
              </View>
              <Text style={[styles.settingsLabel, { color: theme.text }]}>Penampilan</Text>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{currentAppearance.label}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#3FCC54" />
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity style={styles.row} activeOpacity={0.7} onPress={() => router.push('/(tabs)/profile/data-privacy')}>
              <View style={styles.iconCircle}>
                <Ionicons name="document-text-outline" size={18} color="#3FCC54" />
              </View>
              <Text style={[styles.settingsLabel, { color: theme.text }]}>Dasar Privasi</Text>
              <Ionicons name="chevron-forward" size={18} color="#3FCC54" />
            </TouchableOpacity>

          </View>

          <TouchableOpacity
            style={[styles.logoutBtn, { backgroundColor: colorScheme === 'dark' ? '#3D2020' : '#FFF0F0' }]}
            onPress={handleLogout}
            activeOpacity={0.85}
          >
            <Ionicons name="log-out-outline" size={20} color="#E05252" />
            <Text style={styles.logoutText}>Keluar dari Akun</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>

      {/* ── Appearance modal ── */}
      <Modal visible={modalVisible} transparent animationType="none" onRequestClose={closeModal}>
        <Animated.View style={[styles.modalOverlay, { opacity: overlayAnim }]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={closeModal} />
          <Animated.View style={[styles.modalSheet, { backgroundColor: theme.card ?? '#fff' }, { opacity: sheetAnim, transform: [{ translateY: sheetTranslateY }] }]}>

            <View style={styles.modalHandle} />
            <Text style={[styles.modalTitle, { color: theme.text }]}>Penampilan</Text>
            <Text style={[styles.modalSubtitle, { color: theme.secondary }]}>Pilih tema paparan aplikasi anda</Text>
            <View style={styles.modalDivider} />

            {APPEARANCE_OPTIONS.map((option, index) => {
              const isSelected = appearance === option.value;
              return (
                <TouchableOpacity
                  key={option.value}
                  style={[styles.optionRow, index < APPEARANCE_OPTIONS.length - 1 && styles.optionRowBorder]}
                  activeOpacity={0.7}
                  onPress={() => { setAppearance(option.value); closeModal(); }}
                >
                  <View style={[styles.optionIcon, isSelected && styles.optionIconSelected]}>
                    <Ionicons name={option.icon as any} size={20} color={isSelected ? '#fff' : '#3FCC54'} />
                  </View>
                  <Text style={[styles.optionLabel, { color: theme.text }, isSelected && { color: '#3FCC54' }]}>
                    {option.label}
                  </Text>
                  {isSelected && <Ionicons name="checkmark-circle" size={22} color="#3FCC54" />}
                </TouchableOpacity>
              );
            })}

            <TouchableOpacity style={styles.modalCancel} onPress={closeModal}>
              <Text style={styles.modalCancelText}>Batal</Text>
            </TouchableOpacity>

          </Animated.View>
        </Animated.View>
      </Modal>

    </View>
  );
}

const shadow = {
  shadowColor: '#000', shadowOffset: { width: 0, height: 8 },
  shadowOpacity: 0.14, shadowRadius: 20, elevation: 10,
};

const styles = StyleSheet.create({
  container: { flex: 1 },

  // ── Header ──
  header: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 52,   // ✅ enough space so username is never clipped
  },
  headerTitle: { fontSize: 16, fontWeight: '700', color: '#fff', marginBottom: 20 },
  avatarCircle: {
    width: 90, height: 90, borderRadius: 45,
    backgroundColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 12, borderWidth: 2, borderColor: 'rgba(255,255,255,0.5)',
  },
  userName: { fontSize: 16, fontWeight: '700', color: '#fff', marginBottom: 4 },

  // ── Cards ──
  cardWrapper: { paddingHorizontal: 16, marginTop: -24 },  // overlaps header
  section: { paddingHorizontal: 16, paddingTop: 14, gap: 14 },
  card: { borderRadius: 20, paddingVertical: 4, paddingHorizontal: 16, ...shadow },

  // ── Rows ──
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, gap: 14 },
  iconCircle: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#EEF9F1', alignItems: 'center', justifyContent: 'center' },
  rowText: { flex: 1 },
  rowLabel: { fontSize: 12, marginBottom: 2 },
  rowValue: { fontSize: 14, fontWeight: '700' },
  phoneMissing: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  phoneMissingText: { fontSize: 12, color: '#F59E0B', fontWeight: '600' },
  divider: { height: 1, backgroundColor: '#F0F5F3', marginLeft: 52 },
  settingsLabel: { flex: 1, fontSize: 14, fontWeight: '700' },

  // ── Badge ──
  badge: { backgroundColor: '#EEF9F1', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3, marginRight: 6 },
  badgeText: { fontSize: 12, fontWeight: '600', color: '#3FCC54' },

  // ── Logout ──   ← ADD THESE TWO
  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 10, borderRadius: 30, borderWidth: 1.5, borderColor: '#E05252', paddingVertical: 16,
  },
  logoutText: { color: '#E05252', fontSize: 14, fontWeight: '600' },

  // ── Modal ──
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  modalSheet: { borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 24, paddingTop: 16, paddingBottom: 40 },
  modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: '#D1D5DB', alignSelf: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 18, fontWeight: '700', marginBottom: 4 },
  modalSubtitle: { fontSize: 13, marginBottom: 20 },
  modalDivider: { height: 1, backgroundColor: '#F0F5F3', marginBottom: 8 },
  optionRow: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14 },
  optionRowBorder: { borderBottomWidth: 1, borderBottomColor: '#F0F5F3' },
  optionIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#EEF9F1', alignItems: 'center', justifyContent: 'center' },
  optionIconSelected: { backgroundColor: '#3FCC54' },
  optionLabel: { flex: 1, fontSize: 15, fontWeight: '600' },
  modalCancel: { marginTop: 16, alignItems: 'center', paddingVertical: 14, borderRadius: 14, backgroundColor: '#F4F7F6' },
  modalCancelText: { fontSize: 14, fontWeight: '700', color: '#9ABFB5' },
});