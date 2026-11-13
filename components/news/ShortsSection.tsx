import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, Text, View } from 'react-native';
import { PressableFeedback } from 'heroui-native/pressable-feedback';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAppTheme } from '@/hooks/useAppTheme';
import { getShorts, type ShortVideo } from '@/services/shortsService';
import { newsImage } from './FeaturedCard';

export function ShortsSection() {
  const theme = useAppTheme();
  const [items, setItems] = useState<ShortVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const load = () => { setLoading(true); setError(false); getShorts().then(page => setItems(page.items.slice(0, 8))).catch(() => setError(true)).finally(() => setLoading(false)); };
  useEffect(() => { let active = true; getShorts().then(page => { if (active) setItems(page.items.slice(0, 8)); }).catch(() => { if (active) setError(true); }).finally(() => { if (active) setLoading(false); }); return () => { active = false; }; }, []);
  return <View nativeID="homepage-videos" style={{ gap: 12, paddingVertical: 8 }}>
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
      <Text accessibilityRole="header" style={{ flex: 1, color: theme.text, fontSize: 17, fontWeight: '700' }}>Video pendek terbaru dari ApaKhabar</Text>
      <Text accessibilityRole="link" onPress={() => router.navigate({ pathname: '/(tabs)/video', params: { id: '', restart: String(Date.now()) } })} style={{ color: theme.primary, fontSize: 12, paddingVertical: 12 }}>Lihat semua</Text>
    </View>
    {loading ? <ActivityIndicator color={theme.primary}/> : error ? <Text accessibilityRole="button" onPress={load} style={{ color: theme.secondary, paddingVertical: 16 }}>Video tidak dapat dimuatkan. Cuba lagi</Text> : !items.length ? <Text style={{ color: theme.secondary }}>Belum ada video diterbitkan.</Text> : <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
      {items.map(item => <PressableFeedback key={item.id} accessibilityRole="button" accessibilityLabel={`Mainkan ${item.title}, ${item.view_count} tontonan`} onPress={() => router.navigate({ pathname: '/(tabs)/video', params: { id: item.id, restart: String(Date.now()) } })} style={{ width: 116, aspectRatio: 9 / 16, borderRadius: 14, overflow: 'hidden', backgroundColor: theme.accent }}>
        {!!item.thumbnail_url && <Image source={{ uri: newsImage(item.thumbnail_url) }} style={{ width: '100%', height: '100%' }}/>}
        <View style={{ position: 'absolute', inset: 0, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0002' }}><Ionicons name="play" size={28} color="white"/></View>
        <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#0008', padding: 8, flexDirection: 'row', gap: 4 }}><Ionicons name="play" size={13} color="white"/><Text style={{ color: 'white', fontSize: 12 }}>{Intl.NumberFormat('en', { notation: 'compact' }).format(item.view_count || 0)}</Text></View>
      </PressableFeedback>)}
    </ScrollView>}
  </View>;
}
