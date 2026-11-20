import { useState, type ReactNode } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { BottomSheetScrollView as ScrollView } from '@gorhom/bottom-sheet';
import { Button } from 'heroui-native/button';
import { Ionicons } from '@expo/vector-icons';
import { FormError } from '../ui/FormError';
import type { Theme } from '@/constants/theme';

export const reportCategories = ['Penipuan / Scam', 'Pelecehan / Penghinaan', 'Ujaran Kebencian', 'Ancaman / Intimidasi', 'Spam', 'Konten Tidak Pantas', 'Lainnya'] as const;

export function CommentReportForm({ content, author, category, onCategory, input, error, busy, theme, onSubmit, onCancel }: {
  content: string; author: string; category: string; onCategory: (value: string) => void;
  input: ReactNode; error: string; busy: boolean; theme: Theme; onSubmit: () => void; onCancel: () => void;
}) {
  const [choosing, setChoosing] = useState(false);
  return <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled">
    <Text style={{ color: theme.secondary, lineHeight: 20 }}>Pilih kategori dan jelaskan mengapa komentar ini perlu ditinjau moderator.</Text>
    <View style={[styles.preview, { borderColor: theme.border, backgroundColor: theme.accent }]}>
      <Text style={{ color: theme.secondary, fontSize: 12 }}>{author}</Text>
      <Text style={{ color: theme.text, lineHeight: 21 }}>{content}</Text>
    </View>
    <Text style={[styles.label, { color: theme.text }]}>Kategori laporan (wajib)</Text>
    <Button variant="ghost" accessibilityRole="button" accessibilityLabel="Pilih kategori laporan" accessibilityState={{ expanded: choosing }} isDisabled={busy}
      onPress={() => setChoosing(!choosing)} style={[styles.select, { borderColor: theme.border }]}>
      <Text style={{ color: category ? theme.text : theme.secondary, flex: 1 }}>{category || 'Pilih kategori'}</Text>
      <Ionicons name={choosing ? 'chevron-up' : 'chevron-down'} size={18} color={theme.secondary}/>
    </Button>
    {choosing && <View accessibilityRole="radiogroup" style={[styles.preview, { borderColor: theme.border }]}>
      {reportCategories.map(option => <Button key={option} variant="ghost" accessibilityRole="radio" accessibilityLabel={option}
        accessibilityState={{ checked: category === option }} isDisabled={busy} onPress={() => { onCategory(option); setChoosing(false); }} style={styles.option}>
        <Text style={{ color: theme.text, flex: 1 }}>{option}</Text>
        {category === option && <Ionicons name="checkmark" size={18} color={theme.primary}/>}
      </Button>)}
    </View>}
    <Text style={[styles.label, { color: theme.text }]}>Penjelasan (opsional)</Text>
    {input}
    <FormError message={error}/>
    <View style={styles.actions}>
      <Button variant="ghost" accessibilityLabel="Batal laporan" isDisabled={busy} onPress={onCancel} style={[styles.action, { borderColor: theme.border, borderWidth: 1 }]}><Text style={{ color: theme.text }}>Batal</Text></Button>
      <Button variant="ghost" accessibilityLabel="Kirim laporan" isDisabled={busy || !category} onPress={onSubmit} style={[styles.action, { backgroundColor: theme.primary, opacity: busy || !category ? 0.5 : 1 }]}>
        {busy && <ActivityIndicator size="small" color={theme.background}/>}<Text style={{ color: theme.background, fontWeight: '600' }}>{busy ? 'Mengirim...' : 'Kirim Laporan'}</Text>
      </Button>
    </View>
  </ScrollView>;
}
const styles = StyleSheet.create({
  form: { padding: 18, paddingBottom: 36, gap: 12 }, preview: { padding: 12, borderWidth: 1, borderRadius: 12, gap: 6 },
  label: { fontSize: 13, fontWeight: '600', marginTop: 4 }, select: { minHeight: 48, borderWidth: 1, borderRadius: 12, flexDirection: 'row', paddingHorizontal: 12 },
  option: { minHeight: 44, flexDirection: 'row', justifyContent: 'space-between' }, actions: { flexDirection: 'row', gap: 12, marginTop: 6 },
  action: { flex: 1, minHeight: 48, borderRadius: 12, flexDirection: 'row', gap: 8 },
});
