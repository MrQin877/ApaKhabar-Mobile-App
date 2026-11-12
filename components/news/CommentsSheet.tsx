import { BottomSheet } from "heroui-native/bottom-sheet";
import { useBottomSheetAwareHandlers } from "heroui-native/hooks";
import { Input } from "heroui-native/input";
import { BottomSheetFlatList } from "@gorhom/bottom-sheet";
import { Button } from "heroui-native/button";
import type { TextInputInstance } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { forwardRef, type ComponentProps, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Keyboard, RefreshControl, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Design, type Theme } from "@/constants/theme";
import { getToken, getUser } from "@/services/authService";
import { getNewsDetail, postComment, postCommentReply, reportNewsComment } from "@/services/newsService";
import { commentErrorMessage, commenterName, commentSubmissionMessage, readNewsComments, threadNewsComments, type NewsCommentsSnapshot, type PublicNewsComment } from "@/utils/newsComments";
import { CommentRow } from "./CommentRow";

// Must render inside BottomSheet.Content so HeroUI can coordinate the keyboard.
const CommentInput = forwardRef<TextInputInstance, ComponentProps<typeof Input>>(function CommentInput(props, ref) {
  const { onFocus, onBlur } = useBottomSheetAwareHandlers();
  return <Input {...props} ref={ref} onFocus={onFocus} onBlur={onBlur} className="h-auto border-0 shadow-none"/>;
});

type Props = { newsId: string; visible: boolean; initialSnapshot: NewsCommentsSnapshot; theme: Theme; onClose: () => void; onChange: (snapshot: NewsCommentsSnapshot) => void };
export function CommentsSheet({ newsId, visible, initialSnapshot, theme, onClose, onChange }: Props) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const [snapshot, setSnapshot] = useState(initialSnapshot);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [pullRefreshing, setPullRefreshing] = useState(false);
  const [session, setSession] = useState({ ready: false, authenticated: false, canReport: false });
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [replyTarget, setReplyTarget] = useState<PublicNewsComment | null>(null);
  const [reportTarget, setReportTarget] = useState<PublicNewsComment | null>(null);
  const [reportReason, setReportReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [remainingQuota, setRemainingQuota] = useState<number | null>(null);
  const [keyboardOpen, setKeyboardOpen] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const mounted = useRef(true);
  const sending = useRef(false);
  const loadingRequest = useRef<Promise<void> | null>(null);
  const input = useRef<TextInputInstance>(null);
  const snapPoints = useMemo(() => [Math.min(height * 0.82, height - insets.top - 12)], [height, insets.top]);
  const rows = useMemo(() => threadNewsComments(snapshot.comments), [snapshot.comments]);
  const draftKey = replyTarget ? `reply:${replyTarget.id}` : "comment";
  const draft = drafts[draftKey] || "";
  const text = reportTarget ? reportReason : draft;

  useEffect(() => {
    mounted.current = true;
    const show = Keyboard.addListener("keyboardDidShow", () => setKeyboardOpen(true));
    const hide = Keyboard.addListener("keyboardDidHide", () => setKeyboardOpen(false));
    return () => { mounted.current = false; show.remove(); hide.remove(); };
  }, []);
  useEffect(() => {
    if (!visible) return;
    const timer = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(timer);
  }, [visible]);

  const refresh = useCallback((): Promise<void> => {
    if (loadingRequest.current) return loadingRequest.current;
    setLoading(true); setLoadError("");
    const request = getNewsDetail(newsId).then(payload => {
      if (!mounted.current) return;
      const updated = readNewsComments(payload);
      setSnapshot(updated); onChange(updated);
    }).catch(() => {
      if (mounted.current) setLoadError("Komen tidak dapat dimuatkan. Sila cuba lagi.");
    }).finally(() => {
      loadingRequest.current = null;
      if (mounted.current) setLoading(false);
    });
    loadingRequest.current = request;
    return request;
  }, [newsId, onChange]);

  const dismiss = useCallback(() => { Keyboard.dismiss(); onClose(); }, [onClose]);
  useEffect(() => {
    if (!visible) return;
    void refresh();
    void Promise.all([getToken(), getUser()]).then(([token, user]) => {
      if (!mounted.current) return;
      const role = String(user?.role || "").toLowerCase();
      setSession({ ready: true, authenticated: !!token, canReport: !!token && !["admin", "administrator", "moderator"].includes(role) });
    }).catch(() => { if (mounted.current) setSession({ ready: true, authenticated: false, canReport: false }); });
  }, [visible, refresh]);
  const reply = useCallback((comment: PublicNewsComment) => {
    setReportTarget(null); setReplyTarget(comment); setError("");
    input.current?.focus();
  }, []);
  const report = useCallback((comment: PublicNewsComment) => {
    setReportTarget(comment); setReportReason(""); setError("");
    input.current?.focus();
  }, []);
  const login = () => { Keyboard.dismiss(); onClose(); router.push("/(auth)/login"); };

  const submit = async () => {
    if (sending.current || !session.authenticated || loading || !text.trim()) return;
    const content = text.trim();
    if (content.length > (reportTarget ? 500 : 1000)) return;
    sending.current = true; setBusy(true); setError(""); setNotice("");
    try {
      if (reportTarget) {
        const targetId = reportTarget.id;
        await reportNewsComment(targetId, content);
        if (!mounted.current) return;
        setSnapshot(previous => ({ ...previous, comments: previous.comments.map(comment => comment.id === targetId ? { ...comment, reported_by_user: true } : comment) }));
        setReportTarget(null); setReportReason(""); setNotice("Laporan diterima. Terima kasih.");
      } else {
        const result = replyTarget ? await postCommentReply(replyTarget.id, content) : await postComment(newsId, content);
        if (!mounted.current) return;
        setDrafts(previous => ({ ...previous, [draftKey]: "" }));
        setReplyTarget(null); setNotice(commentSubmissionMessage(result));
        if (typeof result.remaining_quota === "number") setRemainingQuota(result.remaining_quota);
        // Only the published list and count returned by the server are displayed.
        await refresh();
      }
    } catch (caught) {
      if (mounted.current) setError(commentErrorMessage(caught));
    } finally {
      sending.current = false;
      if (mounted.current) setBusy(false);
    }
  };
  const canSend = session.ready && session.authenticated && !busy && !loading && !!text.trim();

  return <BottomSheet isOpen={visible} onOpenChange={open => { if (!open) dismiss(); }}>
    <BottomSheet.Portal unstable_accessibilityContainerViewIsModal>
      <BottomSheet.Overlay accessibilityLabel="Tutup komen" style={{ backgroundColor: theme.overlay }}/>
      <BottomSheet.Content snapPoints={snapPoints} topInset={insets.top + 12}
        enableDynamicSizing={false} enableOverDrag={false} enablePanDownToClose
        keyboardBehavior="interactive" keyboardBlurBehavior="restore" android_keyboardInputMode="adjustResize" enableBlurKeyboardOnGesture
        backgroundClassName="rounded-t-3xl bg-overlay shadow-none" handleIndicatorClassName="w-9 bg-separator"
        contentContainerClassName="h-full p-0" contentContainerProps={{ accessibilityViewIsModal: true, onAccessibilityEscape: dismiss }}
        style={{ maxWidth: Design.contentWidth, width: "100%", alignSelf: "center" }}>
            <View style={styles.header}>
              <View style={styles.titleRow}><BottomSheet.Title style={[styles.title, { color: theme.text }]}>Komen</BottomSheet.Title><Text accessibilityLiveRegion="polite" style={{ color: theme.secondary, fontSize: 12 }}>{snapshot.total}</Text></View>
              <Button variant="ghost" className="h-auto min-h-0 min-w-0 rounded-none p-0" accessibilityRole="button" accessibilityLabel="Tutup komen" onPress={dismiss} style={[styles.close, { backgroundColor: theme.accent }]}><Text style={{ color: theme.text, fontSize: 12, fontWeight: "600" }}>Tutup</Text></Button>
            </View>
          <BottomSheetFlatList data={rows} keyExtractor={row => row.comment.id} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag"
            style={styles.list} showsVerticalScrollIndicator={false} contentContainerStyle={styles.listContent}
            renderItem={({ item }) => <CommentRow comment={item.comment} depth={item.depth} theme={theme} now={now} canReport={session.canReport} disabled={busy} onReply={reply} onReport={report}/>}
            initialNumToRender={12} windowSize={7}
            refreshControl={<RefreshControl refreshing={pullRefreshing} onRefresh={() => { if (busy) return; setPullRefreshing(true); void refresh().finally(() => { if (mounted.current) setPullRefreshing(false); }); }} tintColor={theme.primary} colors={[theme.primary]}/>}
            ListEmptyComponent={!loading ? <View style={styles.empty}><Ionicons name="chatbubbles-outline" size={27} color={theme.secondary}/><Text style={{ color: theme.secondary, fontSize: 13, textAlign: "center" }}>{loadError ? "Komen belum dapat dipaparkan." : "Belum ada komen. Kongsi pandangan anda."}</Text></View> : undefined}
            ListFooterComponent={<View>
              {loading && !busy && <View accessibilityLiveRegion="polite" style={styles.status}><ActivityIndicator size="small" color={theme.secondary}/><Text style={{ color: theme.secondary, fontSize: 12 }}>Memuatkan komen...</Text></View>}
              {busy && <View accessibilityLiveRegion="polite" style={styles.status}><ActivityIndicator size="small" color={theme.secondary}/><Text style={{ color: theme.secondary, fontSize: 12 }}>{reportTarget ? "Menghantar laporan..." : "Menghantar komen..."}</Text></View>}
              {!!loadError && <View style={styles.status}><Text accessibilityRole="alert" style={{ color: theme.error, fontSize: 12, flex: 1 }}>{loadError}</Text><Button variant="ghost" className="h-auto min-h-0 min-w-0 rounded-none p-0" accessibilityRole="button" onPress={refresh} style={styles.retry}><Text style={{ color: theme.primary, fontSize: 12 }}>Cuba lagi</Text></Button></View>}
            </View>}/>
          <View style={[styles.footer, { borderTopColor: theme.border, paddingBottom: keyboardOpen ? 12 : Math.max(12, insets.bottom) }]}>
            {!!notice && <View style={styles.notice}><Text accessibilityLiveRegion="polite" style={{ color: theme.primary, fontSize: 12, lineHeight: 18, flex: 1 }}>{notice}</Text><Button variant="ghost" className="h-auto min-h-0 min-w-0 rounded-none p-0" accessibilityRole="button" accessibilityLabel="Tutup mesej" onPress={() => setNotice("")} style={styles.dismissNotice}><Ionicons name="close" size={16} color={theme.secondary}/></Button></View>}
            {!!error && <Text accessibilityRole="alert" style={{ color: theme.error, fontSize: 12, lineHeight: 18, marginBottom: 8 }}>{error}</Text>}
            {reportTarget ? <View style={styles.context}><Text style={{ color: theme.secondary, fontSize: 12, flex: 1 }}>Laporkan komen {commenterName(reportTarget)}</Text><Button variant="ghost" className="h-auto min-h-0 min-w-0 rounded-none p-0" accessibilityRole="button" accessibilityLabel="Batal laporan" isDisabled={busy} onPress={() => { setReportTarget(null); setError(""); }} style={styles.dismissNotice}><Ionicons name="close" size={17} color={theme.secondary}/></Button></View>
              : replyTarget && <View style={styles.context}><Text style={{ color: theme.primary, fontSize: 12, flex: 1 }}>Membalas {commenterName(replyTarget)}</Text><Button variant="ghost" className="h-auto min-h-0 min-w-0 rounded-none p-0" accessibilityRole="button" accessibilityLabel="Batal balasan" isDisabled={busy} onPress={() => { setReplyTarget(null); setError(""); }} style={styles.dismissNotice}><Ionicons name="close" size={17} color={theme.secondary}/></Button></View>}
            {session.ready && !session.authenticated ? <Button variant="ghost" className="h-auto min-h-0 min-w-0 rounded-none p-0" accessibilityRole="button" onPress={login} style={[styles.login, { backgroundColor: theme.communityBg }]}><Text style={{ color: theme.primary, fontSize: 13, fontWeight: "600" }}>Log masuk untuk menulis komen</Text></Button>
              : <View style={styles.composer}>
                <CommentInput ref={input} accessibilityLabel={reportTarget ? "Sebab laporan" : replyTarget ? "Tulis balasan" : "Tulis komen"} multiline
                  placeholder={reportTarget ? "Sebab laporan..." : "Tulis komen..."} placeholderTextColor={theme.secondary}
                  value={text} editable={!busy} maxLength={reportTarget ? 500 : 1000}
                  onChangeText={value => { if (reportTarget) setReportReason(value); else setDrafts(previous => ({ ...previous, [draftKey]: value })); }}
                  style={[styles.input, { backgroundColor: theme.accent, color: theme.text }]}/>
                <Button variant="ghost" className="h-auto min-h-0 min-w-0 rounded-none p-0" accessibilityRole="button" accessibilityLabel={reportTarget ? "Hantar laporan" : replyTarget ? "Hantar balasan" : "Hantar komen"} accessibilityState={{ disabled: !canSend, busy }} isDisabled={!canSend} onPress={submit}
                  style={[styles.send, { backgroundColor: theme.primary, opacity: canSend || busy ? 1 : 0.45 }]}>
                  {busy ? <ActivityIndicator size="small" color={theme.background}/> : <Ionicons name="arrow-up" size={21} color={theme.background}/>}
                </Button>
              </View>}
            {remainingQuota !== null && <Text style={{ color: theme.secondary, fontSize: 11, marginTop: 8 }}>Baki komen hari ini: {remainingQuota}</Text>}
          </View>
      </BottomSheet.Content>
    </BottomSheet.Portal>
  </BottomSheet>;
}
const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingBottom: 2 },
  titleRow: { flexDirection: "row", alignItems: "baseline", gap: 6 }, title: { fontSize: 21, fontWeight: "800" },
  close: { minHeight: 36, minWidth: 56, paddingHorizontal: 13, borderRadius: 22, justifyContent: "center", alignItems: "center" },
  list: { flex: 1 }, listContent: { paddingHorizontal: 16, paddingBottom: 16, flexGrow: 1 },
  empty: { paddingVertical: 32, alignItems: "center", gap: 12 }, status: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 12 },
  retry: { minHeight: 40, justifyContent: "center", paddingLeft: 10 },
  footer: { flexShrink: 0, borderTopWidth: StyleSheet.hairlineWidth, paddingTop: 12, paddingHorizontal: 12 },
  composer: { flexDirection: "row", alignItems: "flex-end", gap: 8 }, input: { flex: 1, minHeight: 44, maxHeight: 120, borderRadius: 18, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, lineHeight: 20, textAlignVertical: "top" },
  send: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  notice: { flexDirection: "row", alignItems: "center", marginBottom: 8 }, dismissNotice: { width: 32, minHeight: 32, alignItems: "center", justifyContent: "center" },
  context: { flexDirection: "row", alignItems: "center", paddingBottom: 8 }, login: { padding: 14, borderRadius: 18, alignItems: "center" },
});
