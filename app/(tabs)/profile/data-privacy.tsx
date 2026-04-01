import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getTheme } from '../../../constants/theme';
import { useColorScheme } from '../../../hooks/use-color-scheme';

const sections = [
  {
    title: '1. Pengumpulan Maklumat',
    content:
      'Kami mengumpul maklumat peribadi yang anda berikan secara sukarela semasa mendaftar akaun, termasuk nama, alamat e-mel, dan nombor telefon. Maklumat ini digunakan untuk menguruskan akaun anda dan menyampaikan perkhidmatan kami.',
  },
  {
    title: '2. Penggunaan Maklumat',
    content:
      'Maklumat anda digunakan untuk menyediakan, menyelenggara, dan meningkatkan perkhidmatan kami; menghantar pemberitahuan berkaitan akaun; dan mematuhi keperluan undang-undang yang berkenaan.',
  },
  {
    title: '3. Perkongsian Maklumat',
    content:
      'Kami tidak menjual atau menyewakan maklumat peribadi anda kepada pihak ketiga. Maklumat anda hanya dikongsi dengan penyedia perkhidmatan yang membantu kami mengendalikan aplikasi ini, tertakluk kepada perjanjian kerahsiaan yang ketat.',
  },
  {
    title: '4. Keselamatan Data',
    content:
      'Kami menggunakan langkah keselamatan teknikal dan organisasi yang sesuai untuk melindungi maklumat peribadi anda daripada akses, pengubahan, pendedahan, atau pemusnahan yang tidak dibenarkan.',
  },
  {
    title: '5. Hak Pengguna',
    content:
      'Anda berhak untuk mengakses, meminda, atau meminta penghapusan maklumat peribadi anda pada bila-bila masa. Untuk membuat sebarang permintaan, sila hubungi kami melalui saluran sokongan yang disediakan dalam aplikasi.',
  },
  {
    title: '6. Kuki dan Penjejakan',
    content:
      'Aplikasi kami mungkin menggunakan teknologi penjejakan untuk meningkatkan pengalaman pengguna dan menganalisis penggunaan aplikasi. Anda boleh mengawal keutamaan penjejakan melalui tetapan peranti anda.',
  },
  {
    title: '7. Perubahan Dasar',
    content:
      'Kami berhak untuk mengubah dasar privasi ini pada bila-bila masa. Sebarang perubahan ketara akan dimaklumkan kepada anda melalui pemberitahuan dalam aplikasi atau e-mel.',
  },
  {
    title: '8. Hubungi Kami',
    content:
      'Sekiranya anda mempunyai sebarang pertanyaan atau kebimbangan mengenai dasar privasi ini, sila hubungi pasukan kami di support@apakhabar.com.',
  },
];

export default function DataPrivacyScreen() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const theme = getTheme(colorScheme);

  return (
    <View style={[styles.container, { backgroundColor: theme.background, paddingTop: insets.top }]}>
      <StatusBar barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'} />

      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <TouchableOpacity style={styles.back} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Dasar Privasi</Text>
        <View style={styles.back} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        <View style={styles.hero}>
          <View style={[styles.heroIcon, { backgroundColor: '#3FCC5420' }]}>
            <Ionicons name="shield-checkmark-outline" size={40} color="#3FCC54" />
          </View>
          <Text style={[styles.heroTitle, { color: theme.text }]}>Dasar Privasi ApaKhabar</Text>
          <Text style={[styles.heroDate, { color: theme.secondary }]}>
            Dikemaskini: 1 Januari 2025
          </Text>
          <Text style={[styles.heroIntro, { color: theme.secondary }]}>
            Privasi anda adalah keutamaan kami. Dokumen ini menerangkan bagaimana kami mengumpul, menggunakan, dan melindungi maklumat peribadi anda.
          </Text>
        </View>

        {/* Sections */}
        {sections.map((section, index) => (
          <View key={index} style={[styles.section, { backgroundColor: theme.card ?? '#fff', borderColor: theme.border }]}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>{section.title}</Text>
            <Text style={[styles.sectionContent, { color: theme.text, opacity: 0.65 }]}>{section.content}</Text>
          </View>
        ))}

        {/* Footer note */}
        <Text style={[styles.footer, { color: theme.secondary }]}>
          Dengan menggunakan aplikasi ApaKhabar, anda bersetuju dengan dasar privasi ini.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  back: { padding: 16, width: 54 },
  headerTitle: { fontSize: 16, fontWeight: '700' },
  scroll: { paddingHorizontal: 20, gap: 12, paddingTop: 8 },
  hero: { alignItems: 'center', paddingVertical: 24, gap: 8 },
  heroIcon: {
    width: 80, height: 80, borderRadius: 40,
    alignItems: 'center', justifyContent: 'center', marginBottom: 8,
  },
  heroTitle: { fontSize: 20, fontWeight: '700', textAlign: 'center' },
  heroDate: { fontSize: 12, textAlign: 'center' },
  heroIntro: { fontSize: 14, textAlign: 'center', lineHeight: 22, marginTop: 4, paddingHorizontal: 8 },
  section: {
    borderRadius: 16, padding: 16,
    borderWidth: 1,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
  },
  sectionTitle: { fontSize: 14, fontWeight: '700', marginBottom: 8 },
  sectionContent: { fontSize: 13, lineHeight: 21 },
  footer: { fontSize: 12, textAlign: 'center', lineHeight: 18, marginTop: 8, paddingHorizontal: 16 },
});