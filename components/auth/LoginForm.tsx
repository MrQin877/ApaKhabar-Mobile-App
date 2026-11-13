import { FormInput } from "../ui/FormInput";
import { FormError } from "../ui/FormError";
import { emailError, identifierError, passwordError } from "../../utils/formValidation";
import { KeyboardForm } from "../KeyboardForm";
import { router } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Alert, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Button } from "heroui-native/button";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Design, getTheme } from "../../constants/theme";
import { useColorScheme } from "../../hooks/use-color-scheme";
import { useAuth } from "../../hooks/useAuth";
import { PasswordInput } from "./PasswordInput";

export function LoginForm({ initialStatus, returnTo, identifierType }: { initialStatus?: string | null; returnTo?: string; identifierType?: "email" }) {
  const theme = getTheme(useColorScheme());
  const insets = useSafeAreaInsets();
  const { email, setEmail, password, setPassword, loading, errors, login, clearErrors } = useAuth(returnTo);
  const [focused, setFocused] = useState<"identifier" | "password" | null>(null);
  const handleLogin = () => { clearErrors(); void login(); };
  const inputStyle = (field: "identifier" | "password", error?: string) => [styles.input, {
    color: theme.text,
    backgroundColor: focused === field ? theme.communityBg : theme.accent,
    borderColor: error ? theme.error : focused === field ? theme.primary : theme.border,
  }];
  return <KeyboardForm style={{ backgroundColor: theme.background }} contentContainerStyle={[styles.container, { paddingBottom: insets.bottom + 24 }]} showsVerticalScrollIndicator={false}>
    <View style={styles.toolbar}>
      <Button variant="ghost" className="min-w-0 rounded-lg p-0" accessibilityLabel="Kembali" isDisabled={loading}
        onPress={() => router.canGoBack() ? router.back() : router.replace("/(auth)/welcome")} style={styles.iconButton}>
        <Ionicons name="arrow-back" size={22} color={theme.secondary}/>
      </Button>
      <Button variant="ghost" className="min-w-0 rounded-lg p-0" accessibilityLabel="Maklumat log masuk"
        onPress={() => Alert.alert("Log masuk", "Gunakan e-mel atau nombor telefon yang telah didaftarkan. Jika terlupa kata laluan, pilih Lupa kata laluan?.")} style={styles.iconButton}>
        <Ionicons name="information-circle-outline" size={23} color={theme.secondary}/>
      </Button>
    </View>
    <View style={styles.header}>
      <Text accessibilityRole="header" style={[styles.title, { color: theme.text }]}>Selamat kembali</Text>
      <Text style={[styles.description, { color: theme.secondary }]}>Log masuk untuk menyimpan berita, memberi reaksi dan menerima notifikasi.</Text>
    </View>
    {!!initialStatus && <View style={[styles.status, { backgroundColor: theme.communityBg }]}><Text accessibilityLiveRegion="polite" style={{ color: theme.primary, fontSize: 13 }}>{initialStatus}</Text></View>}
    <View style={styles.form}>
      <View style={styles.field}>
        <Text style={[styles.label, { color: theme.text }]}>{identifierType === "email" ? "E-mel" : "E-mel atau telefon"}</Text>
        <FormInput validate={identifierType === "email" ? emailError : identifierError} error={errors.email} accessibilityLabel={identifierType === "email" ? "E-mel" : "E-mel atau telefon"} placeholder={identifierType === "email" ? "Alamat e-mel" : "E-mel atau nombor telefon"} placeholderTextColor={theme.secondary}
          value={email} onChangeText={text => { setEmail(text); clearErrors(); }} editable={!loading}
          autoCapitalize="none" autoCorrect={false} keyboardType={identifierType === "email" ? "email-address" : "default"} autoFocus={identifierType === "email"} autoComplete="username" textContentType="username" returnKeyType="next"
          onFocus={() => setFocused("identifier")} onBlur={() => setFocused(null)} style={inputStyle("identifier", errors.email)}/>

      </View>
      <View style={styles.field}>
        <Text style={[styles.label, { color: theme.text }]}>Kata laluan</Text>
        <PasswordInput validate={passwordError} error={errors.password} accessibilityLabel="Kata laluan" placeholder="Kata laluan" placeholderTextColor={theme.secondary}
          value={password} onChangeText={text => { setPassword(text); clearErrors(); }} editable={!loading}
          autoComplete="current-password" textContentType="password" returnKeyType="go" onSubmitEditing={handleLogin}
          onFocus={() => setFocused("password")} onBlur={() => setFocused(null)} style={inputStyle("password", errors.password)}/>

      </View>
      <Button variant="ghost" className="h-auto min-h-0 min-w-0 self-start rounded-none p-0" isDisabled={loading}
        onPress={() => router.navigate("/(auth)/forgot-password")} style={styles.forgot}>
        <Text style={{ color: theme.primary, fontSize: 12, fontWeight: "600" }}>Lupa kata laluan?</Text>
      </Button>
      <FormError message={errors.general}/>
      <Button variant="ghost" className="h-auto min-w-0 rounded-xl px-4 py-3" isDisabled={loading} accessibilityState={{ busy: loading, disabled: loading }}
        onPress={handleLogin} style={[styles.submit, { backgroundColor: theme.primary, opacity: loading ? 0.6 : 1 }]}>
        {loading ? <ActivityIndicator color={theme.background} accessibilityLabel="Sedang log masuk"/> : <Text style={{ ...Design.primaryButtonText, color: theme.background }}>Log masuk</Text>}
      </Button>
    </View>
    <View style={styles.footer}>
      <Text style={{ color: theme.secondary, fontSize: 12 }}>Belum mempunyai akaun?</Text>
      <Button variant="ghost" className="h-auto min-h-0 min-w-0 rounded-none p-0" isDisabled={loading} onPress={() => router.replace({ pathname: "/(auth)/register", params: { returnTo } })} style={{ minHeight: 44 }}>
        <Text style={{ color: theme.primary, fontSize: 12, fontWeight: "700" }}>Daftar</Text>
      </Button>
    </View>
  </KeyboardForm>;
}
const styles = StyleSheet.create({
  container: { flexGrow: 1, paddingHorizontal: 20, paddingTop: 8, width: "100%", maxWidth: Design.contentWidth, alignSelf: "center" },
  toolbar: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  iconButton: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  header: { gap: 10, marginBottom: 24 }, title: { fontSize: 28, fontWeight: "800", letterSpacing: -0.6 },
  description: { fontSize: 14, lineHeight: 21 }, form: { gap: 16 }, field: { gap: 8 },
  label: { fontSize: 13, fontWeight: "600" }, input: { minHeight: 50, borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14 },
  forgot: { alignSelf: "flex-start", minHeight: 36, marginTop: -8 },
  submit: { ...Design.primaryButton },
  footer: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", justifyContent: "center", columnGap: 4, marginTop: 8 },
  status: { borderRadius: 12, padding: 12, marginBottom: 16 }, error: { fontSize: 12, lineHeight: 18 },
});
