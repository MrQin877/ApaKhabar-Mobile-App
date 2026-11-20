import { FormError } from "@/components/ui/FormError";
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
import { subscribeSession } from "@/services/sessionEvents";
import { getNewsDetail, postComment, postCommentReply, reportNewsComment } from "@/services/newsService";
import { commentErrorMessage, commenterName, commentSubmissionMessage, isGuestQuotaError, readNewsComments, threadNewsComments, type NewsCommentsSnapshot, type PublicNewsComment } from "@/utils/newsComments";
import { CommentReportForm } from "./CommentReportForm";
import { CommentRow } from "./CommentRow";
import { GuestCommentLimitDialog } from "./GuestCommentLimitDialog";

// Must render inside BottomSheet.Content so HeroUI can coordinate the keyboard.
const CommentInput = forwardRef<TextInputInstance, ComponentProps<typeof Input>>(function CommentInput(props, ref) {
  const { onFocus, onBlur } = useBottomSheetAwareHandlers();
  return <Input {...props} ref={ref} onFocus={onFocus} onBlur={onBlur} className="h-auto border-0 shadow-none"/>;
});

type CommentAdapter = { load: (id: string) => Promise<NewsCommentsSnapshot>; more?: (id: string, page: number) => Promise<NewsCommentsSnapshot>; post: typeof postComment; reply: typeof postCommentReply; report?: (commentId: string, reason: string, id: string, category?: string) => Promise<unknown> };
type Props = { newsId: string; visible: boolean; initialSnapshot: NewsCommentsSnapshot; theme: Theme; onClose: () => void; onChange: (snapshot: NewsCommentsSnapshot) => void; adapter?: CommentAdapter };
export function CommentsSheet({ newsId, visible, initialSnapshot, theme, onClose, onChange, adapter }: Props) {
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
  const [reportCategory, setReportCategory] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [inputError, setInputError] = useState("");
  const [notice, setNotice] = useState("");
  const [remainingQuota, setRemainingQuota] = useState<number | null>(null);
  const [quotaOpen, setQuotaOpen] = useState(false);
  const [keyboardOpen, setKeyboardOpen] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const mounted = useRef(true);
  const sending = useRef(false);
  const loadingRequest = useRef<Promise<void> | null>(null);
  const readRevision = useRef(0);
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

  const refresh = useCallback(function refreshComments(afterSubmission = false): Promise<void> {
    if (loadingRequest.current) {
      return afterSubmission ? loadingRequest.current.then(() => refreshComments()) : loadingRequest.current;
    }
    const revision = readRevision.current;
    setLoading(true); setLoadError("");
    const request = (adapter ? adapter.load(newsId) : getNewsDetail(newsId)).then(payload => {
      if (!mounted.current || revision !== readRevision.current) return;
      const updated = adapter ? payload as NewsCommentsSnapshot : readNewsComments(payload);
      setSnapshot(updated); onChange(updated);
    }).catch(() => {
      if (mounted.current && revision === readRevision.current) setLoadError("Komen tidak dapat dimuatkan. Sila cuba lagi.");
    }).finally(() => {
      loadingRequest.current = null;
      if (mounted.current) setLoading(false);
    });
    loadingRequest.current = request;
    return request;
  }, [newsId, onChange, adapter]);

  const dismiss = useCallback(() => { Keyboard.dismiss(); onClose(); }, [onClose]);
  useEffect(() => {
    if (!visible) return;
    void refresh();
    let active = true;
    let revision = 0;
    const updateSession = () => {
      const request = ++revision;
      void Promise.all([getToken(), getUser()]).then(([token, user]) => {
        if (!active || request !== revision || !mounted.current) return;
        const role = String(user?.role || "").toLowerCase();
        setSession({ ready: true, authenticated: !!token, canReport: !!token && (!adapter || !!adapter.report) && !["admin", "administrator", "moderator"].includes(role) });
        if (token) { setQuotaOpen(false); setRemainingQuota(null); }
      }).catch(() => { if (active && request === revision && mounted.current) setSession({ ready: true, authenticated: false, canReport: false }); });
    };
    updateSession();
    const unsubscribe = subscribeSession(updateSession);
    return () => { active = false; unsubscribe(); };
  }, [visible, refresh, adapter]);
  const reply = useCallback((comment: PublicNewsComment) => {
    setReportTarget(null); setReplyTarget(comment); setError("");
    input.current?.focus();
  }, []);
  const report = useCallback((comment: PublicNewsComment) => {
    Keyboard.dismiss(); setReportTarget(comment); setReportReason(""); setReportCategory(""); setError(""); setInputError("");
  }, []);
  const login = () => {
    Keyboard.dismiss(); setQuotaOpen(false); onClose();
    router.push({ pathname: "/(auth)/login", params: { returnTo: adapter ? `/(tabs)/video?id=${newsId}` : `/(tabs)/news_content/${newsId}?comments=open` } });
  };

  const submit = async () => {
    if (sending.current || !session.ready || (reportTarget && !session.authenticated) || (reportTarget ? !reportCategory : !text.trim())) return;
    const content = text.trim();
    if (content.length > (reportTarget ? 450 : 1000)) { setInputError("Teks melebihi had aksara."); return; }
    sending.current = true; setBusy(true); setInputError(""); setError(""); setNotice("");
    try {
      if (reportTarget) {
        const targetId = reportTarget.id;
        if (adapter?.report) await adapter.report(targetId, content, newsId, reportCategory);
        else await reportNewsComment(targetId, content, reportCategory);
        if (!mounted.current) return;
        setSnapshot(previous => ({ ...previous, comments: previous.comments.map(comment => comment.id === targetId ? { ...comment, reported_by_user: true } : comment) }));
        setReportTarget(null); setReportReason(""); setNotice("Laporan diterima. Terima kasih.");
      } else {
        const result = replyTarget ? await (adapter?.reply ?? postCommentReply)(replyTarget.id, content, newsId) : await (adapter?.post ?? postComment)(newsId, content);
        if (!mounted.current) return;
        setDrafts(previous => ({ ...previous, [draftKey]: "" }));
        setReplyTarget(null); setNotice(commentSubmissionMessage(result));
        if (typeof result.remaining_quota === "number") setRemainingQuota(result.remaining_quota);
        // Apply only the server-confirmed public count; pending moderation never adds one.
        readRevision.current++;
        if (typeof result.comments_count === "number") {
          const updated = { ...snapshot, total: result.comments_count };
          setSnapshot(updated); onChange(updated);
        }
        // A GET started before the POST must not swallow the post-submission refresh.
        await refresh(true);
      }
    } catch (caught) {
      if (mounted.current) {
        if (!session.authenticated && !reportTarget && isGuestQuotaError(caught)) { Keyboard.dismiss(); setRemainingQuota(0); setQuotaOpen(true); }
        else setError(commentErrorMessage(caught));
      }
    } finally {
      sending.current = false;
      if (mounted.current) setBusy(false);
    }
  };
  const canSend = session.ready && (!reportTarget || session.authenticated) && !busy && (reportTarget ? !!reportCategory : !!text.trim());

  return <><BottomSheet isOpen={visible} onOpenChange={open => { if (!open) dismiss(); }}>
    <BottomSheet.Portal unstable_accessibilityContainerViewIsModal>
      <BottomSheet.Overlay accessibilityLabel="Tutup komen" style={{ backgroundColor: theme.overlay }}/>
      <BottomSheet.Content snapPoints={snapPoints} topInset={insets.top + 12}
        enableDynamicSizing={false} enableOverDrag={false} enablePanDownToClose
        keyboardBehavior="interactive" keyboardBlurBehavior="restore" android_keyboardInputMode="adjustResize" enableBlurKeyboardOnGesture
        backgroundClassName="rounded-t-3xl bg-overlay shadow-none" handleIndicatorClassName="w-9 bg-separator"
        contentContainerClassName="h-full p-0" contentContainerProps={{ accessibilityViewIsModal: true, onAccessibilityEscape: dismiss }}
        style={{ maxWidth: Design.contentWidth, width: "100%", alignSelf: "center" }}>
            <View style={styles.header}>
              <View style={styles.titleRow}><BottomSheet.Title style={[styles.title, { color: theme.text }]}>{reportTarget ? "Laporkan komentar" : "Komen"}</BottomSheet.Title><Text accessibilityLiveRegion="polite" style={{ color: theme.secondary, fontSize: 12 }}>{snapshot.total}</Text></View>
              <Button variant="ghost" className="h-auto min-h-0 min-w-0 rounded-none p-0" accessibilityRole="button" accessibilityLabel="Tutup komen" onPress={dismiss} style={[styles.close, { backgroundColor: theme.accent }]}><Text style={{ color: theme.text, fontSize: 12, fontWeight: "600" }}>Tutup</Text></Button>
            </View>
          {reportTarget ? <CommentReportForm content={reportTarget.content || reportTarget.body || ''} author={commenterName(reportTarget)} category={reportCategory}
            onCategory={setReportCategory} theme={theme} busy={busy} error={inputError || error} onSubmit={() => { void submit(); }}
            onCancel={() => { setReportTarget(null); setError(''); setInputError(''); }}
            input={<CommentInput accessibilityLabel="Penjelasan laporan" multiline maxLength={450} value={reportReason} editable={!busy}
              onChangeText={setReportReason} placeholder="Jelaskan konteks laporan (opsional)..." placeholderTextColor={theme.secondary}
              style={[styles.input, { color: theme.text, backgroundColor: theme.accent, minHeight: 100, textAlignVertical: 'top', borderRadius: 12 }]}/>}
          /> : <>
          <BottomSheetFlatList data={rows} keyExtractor={row => row.comment.id} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag"
            style={styles.list} showsVerticalScrollIndicator={false} contentContainerStyle={styles.listContent}
            renderItem={({ item }) => <CommentRow comment={item.comment} depth={item.depth} theme={theme} now={now} canReport={session.canReport} disabled={busy} onReply={reply} onReport={report}/>}
            initialNumToRender={12} windowSize={7}
            refreshControl={<RefreshControl refreshing={pullRefreshing} onRefresh={() => { if (busy) return; setPullRefreshing(true); void refresh().finally(() => { if (mounted.current) setPullRefreshing(false); }); }} tintColor={theme.primary} colors={[theme.primary]}/>}
            ListEmptyComponent={!loading ? <View style={styles.empty}><Ionicons name="chatbubbles-outline" size={27} color={theme.secondary}/><Text style={{ color: theme.secondary, fontSize: 13, textAlign: "center" }}>{loadError ? "Komen belum dapat dipaparkan." : "Belum ada komen. Kongsi pandangan anda."}</Text></View> : undefined}
            ListFooterComponent={<View>
              {!!snapshot.nextPage && !!adapter?.more && <Button variant="ghost" isDisabled={loading} onPress={() => {
                if (loading || !snapshot.nextPage || !adapter.more) return;
                setLoading(true); setLoadError('');
                void adapter.more(newsId, snapshot.nextPage).then(next => {
                  if (!mounted.current) return;
                  setSnapshot(previous => ({ ...next, comments: [...previous.comments, ...next.comments.filter(row => !previous.comments.some(existing => existing.id === row.id))] }));
                }).catch(() => { if (mounted.current) setLoadError('Komen tidak dapat dimuatkan. Sila cuba lagi.'); }).finally(() => { if (mounted.current) setLoading(false); });
              }}><Text style={{ color: theme.primary }}>Muatkan lagi</Text></Button>}
              {loading && !busy && <View accessibilityLiveRegion="polite" style={styles.status}><ActivityIndicator size="small" color={theme.secondary}/><Text style={{ color: theme.secondary, fontSize: 12 }}>Memuatkan komen...</Text></View>}
              {busy && <View accessibilityLiveRegion="polite" style={styles.status}><ActivityIndicator size="small" color={theme.secondary}/><Text style={{ color: theme.secondary, fontSize: 12 }}>{reportTarget ? "Menghantar laporan..." : "Menghantar komen..."}</Text></View>}
              {!!loadError && <View style={styles.status}><View style={{ flex: 1 }}><FormError message={loadError}/></View><Button variant="ghost" className="h-auto min-h-0 min-w-0 rounded-none p-0" accessibilityRole="button" onPress={() => { void refresh(); }} style={styles.retry}><Text style={{ color: theme.primary, fontSize: 12 }}>Cuba lagi</Text></Button></View>}
            </View>}/>
          <View style={[styles.footer, { borderTopColor: theme.border, paddingBottom: keyboardOpen ? 12 : Math.max(12, insets.bottom) }]}>
            {!!notice && <View style={styles.notice}><Text accessibilityLiveRegion="polite" style={{ color: theme.primary, fontSize: 12, lineHeight: 18, flex: 1 }}>{notice}</Text><Button variant="ghost" className="h-auto min-h-0 min-w-0 rounded-none p-0" accessibilityRole="button" accessibilityLabel="Tutup mesej" onPress={() => setNotice("")} style={styles.dismissNotice}><Ionicons name="close" size={16} color={theme.secondary}/></Button></View>}
            <FormError message={error}/>
            {replyTarget && <View style={styles.context}><Text style={{ color: theme.primary, fontSize: 12, flex: 1 }}>Membalas {commenterName(replyTarget)}</Text><Button variant="ghost" className="h-auto min-h-0 min-w-0 rounded-none p-0" accessibilityRole="button" accessibilityLabel="Batal balasan" isDisabled={busy} onPress={() => { setReplyTarget(null); setError(""); }} style={styles.dismissNotice}><Ionicons name="close" size={17} color={theme.secondary}/></Button></View>}
            <View style={styles.composer}>
                <CommentInput ref={input} accessibilityLabel={replyTarget ? "Tulis balasan" : "Tulis komen"} multiline
                  placeholder={"Tulis komen..."} placeholderTextColor={theme.secondary}
                  value={text} editable={!busy} maxLength={1000}
                  onChangeText={value => { setError(""); setInputError(value.trim().length > (reportTarget ? 500 : 1000) ? "Teks melebihi had aksara." : ""); setDrafts(previous => ({ ...previous, [draftKey]: value })); }}
                  style={[styles.input, { backgroundColor: theme.accent, color: theme.text, ...(inputError ? { borderColor: theme.error, borderWidth: 1 } : {}) }]}/>
                <Button variant="ghost" className="h-auto min-h-0 min-w-0 rounded-none p-0" accessibilityRole="button" accessibilityLabel={replyTarget ? "Hantar balasan" : "Hantar komen"} accessibilityState={{ disabled: !canSend, busy }} isDisabled={!canSend} onPress={submit}
                  style={[styles.send, { backgroundColor: theme.primary, opacity: canSend || busy ? 1 : 0.45 }]}>
                  {busy ? <ActivityIndicator size="small" color={theme.background}/> : <Ionicons name="arrow-up" size={21} color={theme.background}/>}
                </Button>
              </View>
            <FormError inline message={inputError}/>
            {!session.authenticated && remainingQuota !== null && <Text style={{ color: theme.secondary, fontSize: 11, marginTop: 8 }}>Baki komen hari ini: {remainingQuota}</Text>}
          </View>
          </>}
      </BottomSheet.Content>
    </BottomSheet.Portal>
  </BottomSheet>
    <GuestCommentLimitDialog visible={visible && quotaOpen} theme={theme} onClose={() => setQuotaOpen(false)} onLogin={login}/>
  </>;
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
  context: { flexDirection: "row", alignItems: "center", paddingBottom: 8 },
});
