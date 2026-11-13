import { ProfileAvatar } from "@/components/profile/ProfileAvatar";
import { FormError } from "@/components/ui/FormError";
import { LogoutConfirmation } from "@/components/profile/LogoutConfirmation";
import { useRef, useState } from "react";
import { ActivityIndicator, Linking, RefreshControl, ScrollView, StatusBar, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Button } from "heroui-native/button";
import { BottomSheet } from "heroui-native/bottom-sheet";
import { BottomSheetScrollView } from "@gorhom/bottom-sheet";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Design, getTheme } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useVerifiedProfile } from "@/hooks/useVerifiedProfile";
import { allowsPush, useNotificationPermission } from "@/hooks/useNotificationPermission";
import { useAppearance } from "@/context/AppearanceContext";
import { useNotificationCount } from "@/context/NotificationContext";
import { logout } from "@/services/authService";

const appearances = [
  { value: "system", label: "Sistem", icon: "phone-portrait-outline" },
  { value: "light", label: "Cerah", icon: "sunny-outline" },
  { value: "dark", label: "Gelap", icon: "moon-outline" },
] as const;
type Panel = "notifications" | null;

export default function Profil() {
  const insets = useSafeAreaInsets();
  const scheme = useColorScheme();
  const theme = getTheme(scheme);
  const { user, loading, confirmed, error, refresh } = useVerifiedProfile();
  const { appearance } = useAppearance();
  const notifications = useNotificationPermission();
  const { setUnreadCount, dismissToast } = useNotificationCount();
  const [panel, setPanel] = useState<Panel>(null);
  const [loggingOut, setLoggingOut] = useState(false);
  const [confirmingLogout, setConfirmingLogout] = useState(false);
  const [logoutError, setLogoutError] = useState("");
  const [settingsError, setSettingsError] = useState("");
  const pendingLogout = useRef(false);
  const checked = confirmed && !loading;
  const status = (value: string | null | undefined, verified: string | null | undefined) => !checked ? "Status belum disahkan" : value && verified ? "Disahkan" : "Belum disahkan";
  const notificationStatus = !notifications.supported ? "Tidak tersedia pada peranti ini" : notifications.permission === null ? "Status belum diketahui" : allowsPush(notifications.permission) ? "Aktif" : "Tidak dibenarkan";
  const currentAppearance = appearances.find(option => option.value === appearance)!;
  const openNotifications = () => { void notifications.check(); setPanel("notifications"); };
  const openNotificationSettings = async () => {
    setSettingsError("");
    try {
      if (notifications.permission && allowsPush(notifications.permission)) await Linking.openSettings();
      else await notifications.open();
    } catch { setSettingsError("Tetapan notifikasi tidak dapat dibuka. Cuba sekali lagi."); }
  };

  const handleLogout = async () => {
    if (pendingLogout.current) return;
    pendingLogout.current = true;
    setLoggingOut(true);
    setLogoutError("");
    try {
      await logout();
      setUnreadCount(0);
      dismissToast();
      setConfirmingLogout(false);
      router.replace("/(tabs)/profile");
    } catch { setLogoutError("Log keluar tidak berjaya. Cuba sekali lagi."); }
    finally { pendingLogout.current = false; setLoggingOut(false); }
  };
  const row = (title: string, icon: keyof typeof Ionicons.glyphMap, onPress: () => void, subtitle?: string, disabled = false) => <Button key={title} variant="ghost"
    className="h-auto min-h-0 min-w-0 justify-start rounded-none px-3 py-2" accessibilityRole="button" accessibilityLabel={subtitle ? `${title}, ${subtitle}` : title}
    isDisabled={disabled} onPress={onPress} style={styles.row}>
    <Ionicons name={icon} size={19} color={theme.primary}/>
    <View style={styles.rowCopy}><Text style={[styles.rowTitle, { color: theme.text }]}>{title}</Text>{!!subtitle && <Text style={[styles.subtitle, { color: theme.secondary }]}>{subtitle}</Text>}</View>
    <Ionicons name="chevron-forward" size={16} color={theme.secondary}/>
  </Button>;
  const section = (label: string, children: React.ReactNode) => <View style={styles.section}>
    <Text style={[styles.sectionTitle, { color: theme.secondary }]}>{label}</Text>
    <View style={[styles.card, { backgroundColor: theme.card }]}>{children}</View>
  </View>;

  return <View style={[styles.page, { paddingTop: insets.top, backgroundColor: scheme === "dark" ? theme.background : theme.accent }]}>
    <StatusBar barStyle={scheme === "dark" ? "light-content" : "dark-content"}/>
    <ScrollView contentContainerStyle={[styles.content, { paddingBottom: Math.max(24, insets.bottom) }]} showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={loading && !!user} onRefresh={() => { void refresh(); }} tintColor={theme.primary} colors={[theme.primary]}/>}>
      <Text accessibilityRole="header" style={[styles.title, { color: theme.text }]}>Profil</Text>
      {loading && !user ? <ActivityIndicator accessibilityLabel="Memuatkan profil" color={theme.primary} style={{ marginVertical: 32 }}/> : user ? <View style={styles.identity}>
        <ProfileAvatar uri={user.avatar} name={user.name}/>
        <View style={styles.rowCopy}>
          <Text style={[styles.name, { color: theme.text }]}>{user.name}</Text>
          {!!user.email && <Text style={[styles.subtitle, { color: theme.secondary }]}>{user.email}</Text>}
          <Button variant="ghost" className="h-auto min-h-0 min-w-0 self-start rounded-none p-0" onPress={() => router.push("/(tabs)/profile/edit-photo")} style={{ minHeight: 28, alignSelf: "flex-start" }}><Text style={{ color: theme.primary, fontSize: 12, fontWeight: "700" }}>Edit Foto Profil</Text></Button>
        </View>
      </View> : null}
      {!!error && <View style={[styles.error, { borderColor: theme.border }]}><Text accessibilityRole="alert" style={{ color: theme.error, fontSize: 13 }}>{error}</Text><Button variant="ghost" className="h-auto min-w-0 self-start px-0 py-2" onPress={() => { void refresh(); }}><Text style={{ color: theme.primary }}>Cuba lagi</Text></Button></View>}
      {checked && user && (!user.phone || !user.phone_verified_at) && <Button variant="ghost" className="h-auto min-h-0 min-w-0 rounded-xl px-3 py-3" onPress={() => router.push(user.phone ? "/verify-phone" : "/(tabs)/profile/change-phone")}
        style={[styles.warning, { backgroundColor: scheme === "dark" ? "#332B16" : "#FFF9E9" }]}>
        <Ionicons name="alert-circle-outline" size={18} color={scheme === "dark" ? "#FCD34D" : "#A16207"}/>
        <Text style={{ flex: 1, flexShrink: 1, fontSize: 12, lineHeight: 18, color: scheme === "dark" ? "#FCD34D" : "#92400E" }}>Sahkan nombor telefon untuk melindungi akaun</Text>
      </Button>}
      {section("AKAUN", <>
        {row("E-mel", "mail-outline", () => router.push("/(tabs)/profile/change-email"), status(user?.email, user?.email_verified_at), !user)}
        {row("Nombor telefon", "call-outline", () => router.push("/(tabs)/profile/change-phone"), status(user?.phone, user?.phone_verified_at), !user)}
        {row("Kata laluan", "lock-closed-outline", () => router.push("/(tabs)/profile/change-password"), undefined, !user)}
      </>)}
      {section("KEUTAMAAN", <>
        {row("Penampilan", "sunny-outline", () => router.push("/(tabs)/profile/appearance"), currentAppearance.label)}
        {row("Notifikasi", "notifications-outline", openNotifications, notificationStatus)}
      </>)}
      {section("PRIVASI", <>
        {row("Dasar privasi", "shield-outline", () => router.push("/(tabs)/profile/data-privacy"))}
        <Button variant="ghost" className="h-auto min-h-0 min-w-0 justify-start rounded-none px-3 py-2"
          accessibilityRole="button" accessibilityLabel={loggingOut ? "Sedang log keluar..." : "Log keluar"}
          isDisabled={loggingOut} onPress={() => { setLogoutError(""); setConfirmingLogout(true); }} style={styles.row}>
          <Ionicons name="log-out-outline" size={19} color={theme.primary}/>
          <View style={styles.rowCopy}><Text style={[styles.rowTitle, { color: theme.text }]}>{loggingOut ? "Sedang log keluar..." : "Log keluar"}</Text></View>
          <Ionicons name="chevron-forward" size={16} color={theme.secondary}/>
        </Button>
      </>)}
    </ScrollView>
    <LogoutConfirmation visible={confirmingLogout} theme={theme} dark={scheme === "dark"} loading={loggingOut} error={logoutError}
      onConfirm={handleLogout} onCancel={() => { if (!pendingLogout.current) setConfirmingLogout(false); }}/>
    <BottomSheet isOpen={panel !== null} onOpenChange={open => { if (!open) setPanel(null); }}>
      <BottomSheet.Portal unstable_accessibilityContainerViewIsModal>
        <BottomSheet.Overlay style={{ backgroundColor: theme.overlay }} accessibilityLabel="Tutup tetapan"/>
        <BottomSheet.Content snapPoints={['65%']} topInset={insets.top + 12} enableDynamicSizing={false} contentContainerClassName="h-full p-0" backgroundClassName="rounded-t-3xl bg-overlay shadow-none"
          contentContainerProps={{ accessibilityViewIsModal: true, onAccessibilityEscape: () => setPanel(null), style: { padding: 20, paddingBottom: insets.bottom + 24 } }}>
          <View style={styles.panelHeading}><BottomSheet.Title style={[styles.name, { color: theme.text }]}>Notifikasi</BottomSheet.Title>
            <Button variant="ghost" className="min-w-0 p-0" accessibilityLabel="Tutup tetapan" onPress={() => setPanel(null)} style={{ height: 44, width: 44 }}><Ionicons name="close" size={22} color={theme.text}/></Button>
          </View>
          <BottomSheetScrollView contentContainerStyle={{ gap: 12 }}>
            {panel === "notifications" && <>
              <Text style={[styles.detail, { color: theme.text }]}>{notificationStatus}</Text>
              <Text style={[styles.detail, { color: theme.secondary }]}>Kebenaran notifikasi diuruskan melalui tetapan peranti. Notifikasi dalam aplikasi masih boleh dilihat.</Text>
              {notifications.supported && <Button variant="ghost" className="h-auto min-w-0 rounded-xl px-4 py-3" isDisabled={notifications.busy} onPress={openNotificationSettings} style={{ ...Design.primaryButton, backgroundColor: theme.primary }}><Text style={{ ...Design.primaryButtonText, color: theme.background }}>Buka tetapan</Text></Button>}
              <FormError message={notifications.actionError}/>
              <FormError message={settingsError}/>
            </>}
          </BottomSheetScrollView>
        </BottomSheet.Content>
      </BottomSheet.Portal>
    </BottomSheet>
  </View>;
}
const styles = StyleSheet.create({
  page: { flex: 1 }, content: { paddingHorizontal: 16, paddingTop: 24, width: "100%", maxWidth: Design.contentWidth, alignSelf: "center", gap: 12 },
  title: { fontSize: 28, fontWeight: "800", letterSpacing: -0.6 },
  identity: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 4 },
  avatar: { width: 56, height: 56, borderRadius: 28, alignItems: "center", justifyContent: "center" },
  name: { fontSize: 18, lineHeight: 24, fontWeight: "700" }, rowCopy: { flex: 1, minWidth: 0 },
  subtitle: { fontSize: 12, lineHeight: 17, marginTop: 2 }, rowTitle: { fontSize: 14, lineHeight: 20 },
  warning: { flexDirection: "row", alignItems: "center", gap: 10, borderRadius: 12, padding: 12 },
  section: { gap: 6 }, sectionTitle: { fontSize: 10, fontWeight: "700", letterSpacing: 0.5 },
  card: { borderRadius: 16, overflow: "hidden", paddingVertical: 4 },
  row: { flexDirection: "row", alignItems: "center", gap: 12, minHeight: 48, paddingHorizontal: 12, paddingVertical: 8 },
  panelHeading: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  detail: { fontSize: 14, lineHeight: 22 }, error: { borderWidth: 1, borderRadius: 12, padding: 12 },
});
