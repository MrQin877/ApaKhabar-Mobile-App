import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { Button } from 'heroui-native/button';
import { useCallback, useState, type ReactNode } from 'react';
import { ActivityIndicator, ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Design, getTheme } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { getToken } from '@/services/authService';
import { subscribeSession } from '@/services/sessionEvents';

type Section = 'notification' | 'profile';

// Read the existing session; private children never mount for guests.
export function PrivateSection({ section, children }: { section: Section; children: ReactNode }) {
  const theme = getTheme(useColorScheme());
  const [token, setToken] = useState<string | null | undefined>(undefined);
  useFocusEffect(useCallback(() => {
    let active = true;
    let generation = 0;
    const check = () => {
      const request = ++generation;
      setToken(undefined);
      getToken().then(value => { if (active && generation === request) setToken(value); }).catch(() => { if (active && generation === request) setToken(null); });
    };
    const unsubscribe = subscribeSession(check);
    check();
    return () => { active = false; unsubscribe(); setToken(undefined); };
  }, []));
  if (token === undefined) return <View style={{ flex: 1, backgroundColor: theme.background, justifyContent: 'center' }}><ActivityIndicator accessibilityLabel="Memuatkan" color={theme.primary}/></View>;
  return token ? <View key={token} style={{ flex: 1 }}>{children}</View> : <GuestAccess section={section}/>;
}

export function GuestAccess({ section }: { section: Section }) {
  const insets = useSafeAreaInsets();
  const scheme = useColorScheme();
  const theme = getTheme(scheme);
  const notification = section === 'notification';
  const title = notification ? 'Notifikasi' : 'Profil';
  const open = (page: 'login' | 'register') => router.push({ pathname: page === 'login' ? '/(auth)/login' : '/(auth)/register', params: { returnTo: `/(tabs)/${section}` } });
  return <View style={[styles.page, { backgroundColor: theme.background, paddingTop: insets.top, paddingLeft: insets.left, paddingRight: insets.right }]}>
    <StatusBar barStyle={scheme === 'dark' ? 'light-content' : 'dark-content'}/>
    <View style={[styles.header, { borderBottomColor: theme.border }]}><Text accessibilityRole="header" style={[styles.pageTitle, { color: theme.text }]}>{title}</Text></View>
    <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
      <View style={styles.content}>
        <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={styles.illustration}>
          <View style={[styles.halo, { backgroundColor: theme.communityBg }]}>
            <Ionicons name={notification ? 'notifications-outline' : 'person-outline'} size={104} color={theme.primary}/>
          </View>
          <View style={[styles.lock, { backgroundColor: theme.primary, borderColor: theme.background }]}><Ionicons name="lock-closed" size={25} color={theme.background}/></View>
        </View>
        <Text accessibilityRole="header" style={[styles.heading, { color: theme.text }]}>{notification ? 'Log masuk untuk melihat notifikasi' : 'Log masuk untuk mengakses profil'}</Text>
        <Text style={[styles.description, { color: theme.secondary }]}>{notification ? 'Log masuk ke akaun ApaKhabar anda untuk menerima kemas kini berita, siaran penting dan aktiviti terkini.' : 'Urus maklumat akaun, tetapan aplikasi, penanda buku dan pilihan peribadi anda.'}</Text>
        <View style={styles.actions}>
          <Button variant="ghost" className="h-auto min-w-0 rounded-xl px-4 py-3" onPress={() => open('login')} style={[styles.button, Design.primaryButton, { backgroundColor: theme.primary }]}><Text style={[Design.primaryButtonText, { color: theme.background }]}>Log masuk</Text></Button>
          <Button variant="ghost" className="h-auto min-w-0 rounded-xl px-4 py-3" onPress={() => open('register')} style={[styles.button, { backgroundColor: theme.background, borderWidth: 1, borderColor: theme.primary }]}><Text style={[styles.buttonText, { color: theme.primary }]}>Daftar akaun</Text></Button>
        </View>
      </View>
    </ScrollView>
  </View>;
}
const styles = StyleSheet.create({
  page: { flex: 1 }, header: { paddingHorizontal: 20, paddingVertical: 20, borderBottomWidth: StyleSheet.hairlineWidth },
  pageTitle: { fontSize: 28, fontWeight: '800', letterSpacing: -0.6 },
  scroll: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 32 },
  content: { width: '100%', maxWidth: Design.contentWidth, alignSelf: 'center', alignItems: 'center' },
  illustration: { width: 180, height: 160, marginBottom: 24, alignItems: 'center', justifyContent: 'center' },
  halo: { width: 174, height: 144, borderRadius: 80, alignItems: 'center', justifyContent: 'center', transform: [{ rotate: '-8deg' }] },
  lock: { position: 'absolute', right: 12, bottom: 12, width: 52, height: 52, borderRadius: 26, borderWidth: 4, alignItems: 'center', justifyContent: 'center' },
  heading: { fontSize: 24, lineHeight: 29, fontWeight: '700', textAlign: 'center', maxWidth: 310 },
  description: { fontSize: 16, lineHeight: 23, textAlign: 'center', marginTop: 16, maxWidth: 370 },
  actions: { width: '100%', gap: 12, marginTop: 44 }, button: { minHeight: 50, borderRadius: 12 },
  buttonText: { fontSize: 16, fontWeight: '700' },
});
