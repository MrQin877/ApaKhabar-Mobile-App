import { useRef, useState } from "react";
import { ActivityIndicator, StatusBar, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import { Button } from "heroui-native/button";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { KeyboardForm } from "@/components/KeyboardForm";
import { FormError } from "@/components/ui/FormError";
import { ProfileAvatar } from "@/components/profile/ProfileAvatar";
import { useAppTheme } from "@/hooks/useAppTheme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useVerifiedProfile } from "@/hooks/useVerifiedProfile";
import { Design } from "@/constants/theme";
import type { UserProfile } from "@/services/authService";
import { photoSubmissionError, profilePhotoError, saveProfilePhoto } from "@/services/profilePhoto";

export default function EditPhotoScreen() {
  const theme = useAppTheme();
  const scheme = useColorScheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { user, loading, error: loadError } = useVerifiedProfile();
  const [savedProfile, setSavedProfile] = useState<UserProfile | null>(null);
  const [busy, setBusy] = useState<"choose" | "remove" | null>(null);
  const [error, setError] = useState("");
  const pending = useRef(false);
  // Only render a server-confirmed photo, never a local picker preview.
  const profile = savedProfile && savedProfile.id === user?.id ? savedProfile : user;
  const photo = profile?.avatar || profile?.profile_photo_url;
  const disabled = !!busy || loading || !user;
  const back = () => router.canGoBack() ? router.back() : router.replace("/(tabs)/profile");

  const choose = async () => {
    if (pending.current || loading || !user) return;
    pending.current = true; setBusy("choose"); setError("");
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"], allowsEditing: true, aspect: [1, 1], quality: 0.85,
      });
      if (result.canceled || !result.assets?.[0]) return;
      const asset = result.assets[0];
      const invalid = profilePhotoError(asset);
      if (invalid) { setError(invalid); return; }
      setSavedProfile(await saveProfilePhoto(asset));
    } catch (caught) { setError(photoSubmissionError(caught)); }
    finally { pending.current = false; setBusy(null); }
  };
  const remove = async () => {
    if (pending.current || loading || !user || !photo) return;
    pending.current = true; setBusy("remove"); setError("");
    try {
      setSavedProfile(await saveProfilePhoto(null));
    } catch (caught) { setError(photoSubmissionError(caught)); }
    finally { pending.current = false; setBusy(null); }
  };

  return <KeyboardForm style={{ backgroundColor: theme.background }} contentContainerStyle={[styles.page, {
    paddingTop: insets.top + 16, paddingBottom: Math.max(24, insets.bottom + 16),
    paddingLeft: 24 + insets.left, paddingRight: 24 + insets.right,
  }]}>
    <StatusBar barStyle={scheme === "dark" ? "light-content" : "dark-content"}/>
    <View style={styles.heading}>
      <Button variant="ghost" className="min-w-0 self-start rounded-full p-0" accessibilityLabel="Kembali" isDisabled={!!busy} onPress={back} style={styles.back}>
        <Ionicons name="chevron-back" size={24} color={theme.text}/>
      </Button>
      <Text accessibilityRole="header" style={[styles.title, { color: theme.text }]}>Edit Foto Profil</Text>
    </View>
    <Text style={[styles.description, { color: theme.secondary }]}>Pilih foto yang akan dipaparkan pada profil, komen dan balasan anda. Foto profil boleh dilihat oleh semua pembaca.</Text>
    <View style={styles.preview}>
      <ProfileAvatar uri={photo} name={profile?.name} size={Math.min(260, Math.max(120, width - insets.left - insets.right - 96))}/>
    </View>
    {loading && <ActivityIndicator accessibilityLabel="Memuatkan profil" color={theme.primary}/>}
    <FormError message={error || loadError}/>
    <View style={styles.actions}>
      <Button variant="primary" accessibilityLabel={photo ? "Tukar foto" : "Pilih dari galeri"} accessibilityState={{ busy: busy === "choose", disabled }} isDisabled={disabled} onPress={() => { void choose(); }} style={[styles.button, { backgroundColor: theme.primary }]}>
        {busy === "choose" && <ActivityIndicator color={theme.background}/>}
        <Text style={[styles.buttonText, { color: theme.background }]}>{photo ? "Tukar foto" : "Pilih dari galeri"}</Text>
      </Button>
      {photo ? <Button variant="outline" accessibilityLabel="Buang foto" accessibilityState={{ busy: busy === "remove", disabled }} isDisabled={disabled} onPress={() => { void remove(); }} style={[styles.button, { borderWidth: 1, borderColor: theme.error, backgroundColor: "transparent" }]}>
        {busy === "remove" ? <ActivityIndicator color={theme.error}/> : <Ionicons name="trash-outline" size={20} color={theme.error}/>}
        <Text style={[styles.buttonText, { color: theme.error }]}>Buang foto</Text>
      </Button> : <Button variant="ghost" isDisabled={!!busy} onPress={back} style={styles.button}>
        <Text style={[styles.buttonText, { color: theme.primary }]}>Batal</Text>
      </Button>}
    </View>
  </KeyboardForm>;
}
const styles = StyleSheet.create({
  page: { flexGrow: 1, gap: Design.spacing.lg, width: "100%", maxWidth: Design.contentWidth, alignSelf: "center" },
  heading: { gap: Design.spacing.md },
  back: { minWidth: 44, minHeight: 44, alignSelf: "flex-start" },
  title: { fontSize: 28, fontWeight: "800" },
  description: { fontSize: 16, lineHeight: 24 },
  preview: { alignItems: "center", paddingVertical: Design.spacing.lg },
  actions: { marginTop: "auto", gap: Design.spacing.md, paddingTop: Design.spacing.lg },
  button: { ...Design.primaryButton, width: "100%", flexDirection: "row", gap: Design.spacing.sm },
  buttonText: { ...Design.primaryButtonText, textAlign: "center", flexShrink: 1 },
});
