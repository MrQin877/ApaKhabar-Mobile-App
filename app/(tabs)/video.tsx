import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, AppState, FlatList, Share, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams, useIsFocused } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useVideoPlayer, VideoView } from 'expo-video';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { PressableFeedback } from 'heroui-native/pressable-feedback';
import { useAppTheme } from '@/hooks/useAppTheme';
import { CommentsSheet } from '@/components/news/CommentsSheet';
import { getToken } from '@/services/authService';
import { countShortView, getShort, getShorts, shortsCommentAdapter, toggleShortLike, type ShortVideo } from '@/services/shortsService';
import { newsImage } from '@/components/news/FeaturedCard';
import type { NewsCommentsSnapshot } from '@/utils/newsComments';
import { subscribeSession } from '@/services/sessionEvents';
import { floatingTabBarSpace } from '@/components/navigation/FloatingTabBar';

const counted = new Set<string>();
function publicationTime(value?: string) {
  if (!value) return '';
  const minutes = Math.floor((Date.now() - Date.parse(value)) / 60000);
  return !Number.isFinite(minutes) ? '' : minutes < 1 ? 'Baru sahaja' : minutes < 60 ? `${minutes} min lalu` : minutes < 1440 ? `${Math.floor(minutes / 60)} jam lalu` : `${Math.floor(minutes / 1440)} hari lalu`;
}
function VideoCard({ item, height, active, ready, update }: { item: ShortVideo; height: number; active: boolean; ready: boolean; update: (item: ShortVideo) => void }) {
  const navigationInsets = useSafeAreaInsets();
  const navigationSpace = floatingTabBarSpace(navigationInsets.bottom);
  const theme = useAppTheme();
  const [detail, setDetail] = useState(item);
  const [failed, setFailed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [paused, setPaused] = useState(false);
  const [flash, setFlash] = useState<'play' | 'pause' | null>(null);
  const [comments, setComments] = useState(false);
  const [busy, setBusy] = useState(false);
  const liking = useRef(false);
  const [notice, setNotice] = useState('');
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const watched = useRef(0);
  const inFlight = useRef(false);
  const alive = useRef(true);
  const player = useVideoPlayer(null, p => { p.loop = true; p.timeUpdateEventInterval = 1; });
  const load = useCallback(() => {
    setFailed(false); setLoading(true);
    return getShort(item.id).then(async video => { if (!alive.current) return; setDetail(video); await player.replaceAsync(video.video_url ? { uri: newsImage(video.video_url) } : null); if (!video.video_url && alive.current) setFailed(true); }).catch(() => { if (alive.current) setFailed(true); }).finally(() => { if (alive.current) setLoading(false); });
  }, [item.id, player]);
  useEffect(() => { alive.current = true; void Promise.resolve().then(() => { if (alive.current) void load(); }); return () => { alive.current = false; }; }, [load]);
  useEffect(() => {
    const status = player.addListener('statusChange', event => { setLoading(event.status === 'loading'); if (event.status === 'error') setFailed(true); });
    return () => status.remove();
  }, [player]);
  useEffect(() => {
    if (active && !paused && !comments && !failed) player.play(); else player.pause();
  }, [active, paused, comments, failed, loading, player]);
  useEffect(() => {
    const listener = player.addListener('timeUpdate', () => {
      if (!active || !player.playing || comments || !ready || counted.has(item.id) || inFlight.current) return;
      watched.current += 1;
      if (watched.current < 5) return;
      inFlight.current = true;
      void countShortView(item.id).then(result => { counted.add(item.id); update({ ...detail, view_count: result.view_count }); }).catch(() => { setNotice('Tontonan belum dapat disegerakkan.'); }).finally(() => { /* One attempt per mounted player; never count each loop. */ });
    });
    return () => listener.remove();
  }, [active, comments, ready, item.id, player, detail, update]);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);
  const onChange = useCallback((snapshot: NewsCommentsSnapshot) => setDetail(previous => ({ ...previous, comments_count: snapshot.total })), []);
  const like = async () => {
    if (liking.current) return;
    liking.current = true;
    const previous = detail;
    setBusy(true); setNotice('');
    try {
      if (!await getToken()) { router.push({ pathname: '/(auth)/login', params: { returnTo: `/(tabs)/video?id=${item.id}` } }); return; }
      if (!ready) { setNotice('Suka video memerlukan kemas kini API Shorts.'); return; }
      setDetail({ ...detail, liked_by_user: !detail.liked_by_user, likes_count: Math.max(0, detail.likes_count + (detail.liked_by_user ? -1 : 1)) });
      const result = await toggleShortLike(item.id); setDetail({ ...previous, liked_by_user: result.liked, likes_count: result.likes_count });
    }
    catch { setDetail(previous); setNotice('Suka tidak dapat dikemas kini. Cuba lagi.'); }
    finally { liking.current = false; setBusy(false); }
  };
  const share = async () => {
    try {
      const origin = process.env.EXPO_PUBLIC_SHORTS_PUBLIC_URL?.replace(/\/+$/, '');
      let url = '';
      if (origin) { const parsed = new URL(origin); if (parsed.protocol === 'https:' && !/^(localhost|127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(parsed.hostname)) url = `${origin}/shorts/${item.id}`; }
      await Share.share({ message: [detail.title, detail.description, url].filter(Boolean).join('\n') });
    } catch { setNotice('Perkongsian tidak tersedia. Sila cuba lagi.'); }
  };
  return <View style={{ height, width: '100%', maxWidth: height * 9 / 16, alignSelf: 'center', backgroundColor: '#000' }}>
    <VideoView player={player} style={StyleSheet.absoluteFill} nativeControls={false} contentFit="cover" surfaceType="textureView"/>
    <PressableFeedback accessibilityRole="button" accessibilityLabel={paused ? 'Mainkan video' : 'Jeda video'} onPress={() => { setPaused(!paused); setFlash(paused ? 'play' : 'pause'); if (timer.current) clearTimeout(timer.current); timer.current = setTimeout(() => setFlash(null), 650); }} style={StyleSheet.absoluteFill}/>
    {loading && <ActivityIndicator style={styles.center} color="white"/>}
    {!!flash && <View pointerEvents="none" style={styles.center}><View style={styles.flash}><Ionicons name={flash} size={38} color="white"/></View></View>}
    {failed && <View style={styles.center}><Text style={styles.white}>Video tidak dapat dimainkan.</Text><Text accessibilityRole="button" onPress={() => void load()} style={[styles.white, { padding: 20 }]}>Cuba lagi</Text></View>}
    <LinearGradient pointerEvents="none" colors={['transparent', '#000d']} style={styles.gradient}/>
    <View style={[styles.caption, { bottom: navigationSpace + 16 }]} pointerEvents="box-none"><Text style={[styles.white, { fontWeight: '600' }]}>ApaKhabar{detail.published_at ? ` · ${publicationTime(detail.published_at)}` : ''}</Text><Text numberOfLines={2} style={[styles.white, { fontSize: 19, fontWeight: '700', marginTop: 8 }]}>{detail.title}</Text><Text numberOfLines={3} style={[styles.white, { lineHeight: 20, marginTop: 6 }]}>{detail.description}</Text>{!!notice && <Text accessibilityLiveRegion="polite" style={[styles.white, { marginTop: 8 }]}>{notice}</Text>}</View>
    <View style={[styles.actions, { bottom: navigationSpace + 132 }]}>
      <PressableFeedback accessibilityRole="button" accessibilityLabel="Suka video" accessibilityState={{ selected: !!detail.liked_by_user, disabled: busy }} isDisabled={busy} onPress={() => void like()} style={styles.action}><Ionicons name={detail.liked_by_user ? 'heart' : 'heart-outline'} size={32} color={detail.liked_by_user ? '#ef4444' : 'white'}/><Text style={styles.white}>{detail.likes_count || 0}</Text></PressableFeedback>
      <PressableFeedback accessibilityRole="button" accessibilityLabel="Buka komen" onPress={() => setComments(true)} style={styles.action}><Ionicons name="chatbubble-outline" size={30} color="white"/><Text style={styles.white}>{detail.comments_count || 0}</Text></PressableFeedback>
      <PressableFeedback accessibilityRole="button" accessibilityLabel="Kongsi video" onPress={() => void share()} style={styles.action}><Ionicons name="share-social-outline" size={30} color="white"/><Text style={styles.white}>Kongsi</Text></PressableFeedback>
    </View>
    {comments && <CommentsSheet newsId={item.id} visible initialSnapshot={{ comments: [], total: detail.comments_count || 0 }} theme={theme} adapter={shortsCommentAdapter} onClose={() => setComments(false)} onChange={onChange}/>}
  </View>;
}
export default function VideoScreen() {
  const { id, restart } = useLocalSearchParams<{ id?: string; restart?: string }>();
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const focused = useIsFocused();
  const [foreground, setForeground] = useState(AppState.currentState === 'active');
  const [items, setItems] = useState<ShortVideo[]>([]);
  const [height, setHeight] = useState(0);
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [ready, setReady] = useState(false);
  const [sessionVersion, setSessionVersion] = useState(0);
  useEffect(() => subscribeSession(() => setSessionVersion(value => value + 1)), []);
  const next = useRef<number | null>(null);
  const fetching = useRef(false);
  const list = useRef<FlatList<ShortVideo>>(null);
  const revision = useRef(0);
  const load = useCallback(async () => {
    const version = ++revision.current;
    setLoading(true); setError('');
    try {
      const page = await getShorts();
      let rows = page.items;
      if (id && !rows.some(v => v.id === id)) rows = [await getShort(id), ...rows];
      if (version !== revision.current) return;
      next.current = page.next; setReady(page.mobileReady); setItems(rows);
      setIndex(Math.max(0, rows.findIndex(v => v.id === id)));
    } catch { if (version === revision.current) setError('Video tidak dapat dimuatkan. Sila cuba lagi.'); }
    finally { if (version === revision.current) setLoading(false); }
  }, [id]);
  const invalidate = useCallback(() => { revision.current += 1; }, []);
  useEffect(() => {
    let active = true;
    void Promise.resolve().then(() => { if (active) void load(); });
    return () => { active = false; invalidate(); };
  }, [load, restart, sessionVersion, invalidate]);
  useEffect(() => { const subscription = AppState.addEventListener('change', state => setForeground(state === 'active')); return () => subscription.remove(); }, []);
  const more = async () => {
    if (fetching.current || !next.current || loading) return;
    fetching.current = true;
    const version = revision.current;
    try { const page = await getShorts(next.current); if (version !== revision.current) return; next.current = page.next; setItems(previous => [...previous, ...page.items.filter(v => !previous.some(p => p.id === v.id))]); }
    catch { setError('Video seterusnya tidak dapat dimuatkan. Cuba lagi.'); }
    finally { fetching.current = false; }
  };
  const visible = useCallback(({ viewableItems }: { viewableItems: { index?: number | null }[] }) => { if (viewableItems[0]?.index != null) setIndex(viewableItems[0].index); }, []);
  const update = useCallback((video: ShortVideo) => setItems(previous => previous.map(v => v.id === video.id ? video : v)), []);
  return <View style={{ flex: 1, backgroundColor: '#000' }} onLayout={event => setHeight(event.nativeEvent.layout.height)}>
    {focused && <StatusBar style="light"/>}
    {loading ? <ActivityIndicator style={styles.center} color={theme.primary}/> : items.length && height ? <FlatList key={`${id || 'latest'}:${restart || ''}:${height}`} ref={list} data={items} keyExtractor={v => v.id} pagingEnabled initialScrollIndex={index} getItemLayout={(_, i) => ({ length: height, offset: height * i, index: i })} showsVerticalScrollIndicator={false} onViewableItemsChanged={visible} viewabilityConfig={{ itemVisiblePercentThreshold: 80 }} onEndReached={() => void more()} onEndReachedThreshold={2} initialNumToRender={1} maxToRenderPerBatch={2} windowSize={3} renderItem={({ item, index: row }) => Math.abs(row - index) <= 1 ? <VideoCard item={item} height={height} active={row === index && focused && foreground} ready={ready} update={update}/> : <View style={{ height }}/>}/> : <View style={styles.center}><Text style={styles.white}>{error || 'Belum ada video diterbitkan.'}</Text><Text accessibilityRole="button" onPress={() => void load()} style={[styles.white, { padding: 20 }]}>Cuba lagi</Text></View>}
    {!!items.length && !!error && <Text accessibilityRole="button" onPress={() => { setError(''); void more(); }} style={{ position: 'absolute', top: insets.top + 52, color: 'white', backgroundColor: '#000b', padding: 12 }}>{error}</Text>}
    <PressableFeedback accessibilityRole="button" accessibilityLabel="Kembali ke video di laman utama" onPress={() => router.navigate({ pathname: '/(tabs)/news_content', params: { section: 'videos' } })} style={{ position: 'absolute', top: insets.top + 6, left: 12, width: 44, height: 44, borderRadius: 22, backgroundColor: '#0005', alignItems: 'center', justifyContent: 'center' }}><Ionicons name="arrow-back" size={27} color="white"/></PressableFeedback>
  </View>;
}
const styles = StyleSheet.create({
  center: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center' },
  white: { color: 'white', fontSize: 14 }, flash: { backgroundColor: '#0007', borderRadius: 48, padding: 24 },
  gradient: { position: 'absolute', bottom: 0, left: 0, right: 0, height: '44%' },
  caption: { position: 'absolute', bottom: 24, left: 20, right: 88 },
  actions: { position: 'absolute', right: 12, bottom: 140, gap: 18 }, action: { alignItems: 'center', gap: 5, minWidth: 48, minHeight: 48 },
});
