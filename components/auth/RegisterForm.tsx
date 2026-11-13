import { FormError } from "../ui/FormError";
import { useState } from "react";
import { ActivityIndicator, Alert, Keyboard, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { Button } from "heroui-native/button";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Design, getTheme } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useRegistration } from "@/hooks/useRegistration";
import { KeyboardForm } from "../KeyboardForm";
import { PhoneNumberInput } from "../phone-number-input";
import { Tabs, TabsList, TabsTrigger } from "../ui/tabs";
import { PasswordInput } from "./PasswordInput";
import { BirthDatePicker } from "./BirthDatePicker";

const options = {
  citizenship: [['wni', 'WNI (Indonesia)'], ['wna', 'WNA (Foreign citizen)'], ['dual', 'Dual citizenship']],
  gender: [['', 'Pilih jantina'], ['male', 'Lelaki'], ['female', 'Perempuan'], ['undisclosed', 'Tidak mahu nyatakan']],
} as const;
export function RegisterForm({ returnTo }: { returnTo?: string }) {
  const theme = getTheme(useColorScheme());
  const insets = useSafeAreaInsets();
  const form = useRegistration(returnTo);
  const { fields, errors, loading, step, method } = form;
  const [picker, setPicker] = useState<"date" | "citizenship" | "gender" | null>(null);
  const inputStyle = (key: string) => [styles.input, { backgroundColor: theme.accent, color: theme.text, borderColor: errors[key] ? theme.error : theme.border }];
  const error = (key: string) => <FormError message={errors[key]} inline={key !== "general"}/>;
  const field = (label: string, key: string, children: React.ReactNode) => <View style={styles.field}><Text style={[styles.label, { color: theme.text }]}>{label}</Text>{children}{error(key)}</View>;
  const textInput = (key: "name" | "ethnicity" | "email", placeholder: string, maxLength: number) => <TextInput value={fields[key]} onChangeText={value => form.update(key, value)}
    accessibilityLabel={placeholder} placeholder={placeholder} placeholderTextColor={theme.secondary} maxLength={maxLength} editable={!loading}
    autoCapitalize={key === "email" ? "none" : "words"} autoCorrect={key !== "email"} keyboardType={key === "email" ? "email-address" : "default"} style={inputStyle(key)}/>;
  const select = (key: "citizenship" | "gender") => <Button variant="ghost" className="h-auto min-w-0 justify-start rounded-xl px-3 py-3" isDisabled={loading} onPress={() => { Keyboard.dismiss(); setPicker(key); }} style={[...inputStyle(key), styles.select]}>
    <Text style={{ color: fields[key] ? theme.text : theme.secondary, flex: 1, fontSize: 14 }}>{options[key].find(option => option[0] === fields[key])?.[1] || (key === "gender" ? "Pilih jantina" : "Pilih kewarganegaraan")}</Text><Ionicons name="chevron-down" size={18} color={theme.secondary}/>
  </Button>;
  const back = () => { Keyboard.dismiss(); if (step === 2) form.setStep(1); else if (router.canGoBack()) router.back(); else router.replace("/(auth)/welcome"); };
  return <View style={{ flex: 1, backgroundColor: theme.background }}>
    <View style={styles.fixedHeader}>
      <View style={styles.toolbar}>
        <Button variant="ghost" className="min-w-0 p-0" isDisabled={loading} onPress={back} accessibilityLabel="Kembali" style={styles.icon}><Ionicons name="arrow-back" size={22} color={theme.secondary}/></Button>
        <Button variant="ghost" className="min-w-0 p-0" accessibilityLabel="Maklumat pendaftaran" onPress={() => Alert.alert("Cipta akaun", "Lengkapkan maklumat diri, kemudian pilih e-mel atau nombor telefon untuk mendaftar.")} style={styles.icon}><Ionicons name="information-circle-outline" size={23} color={theme.secondary}/></Button>
      </View>
      <Text accessibilityRole="header" style={[styles.title, { color: theme.text }]}>Cipta akaun</Text>
      <Text style={[styles.description, { color: theme.secondary }]}>Sertai komuniti pembaca dan urus berita yang penting kepada anda.</Text>
      <View accessibilityLabel={`Langkah ${step} daripada 2`} accessibilityRole="progressbar" accessibilityValue={{ min: 1, max: 2, now: step }} style={styles.progress}>
        <View style={[styles.track, { backgroundColor: theme.border }]}><View style={{ height: 3, width: step === 1 ? "35%" : "100%", backgroundColor: theme.primary }}/></View>
        {[1, 2].map(value => <View key={value} style={styles.progressItem}>
          <View style={[styles.circle, { backgroundColor: step === value ? theme.primary : theme.accent, borderColor: step >= value ? theme.primary : theme.border }]}><Text style={{ color: step === value ? theme.background : step >= value ? theme.primary : theme.secondary, fontWeight: "700" }}>{value}</Text></View>
          <Text style={{ color: step >= value ? theme.primary : theme.secondary, fontSize: 11, textAlign: "center", fontWeight: step === value ? "700" : "400" }}>{value === 1 ? "Maklumat diri" : "Kaedah hubungan & kata laluan"}</Text>
        </View>)}
      </View>
    </View>
    <KeyboardForm contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]} showsVerticalScrollIndicator={false}>
      <View style={[styles.fields, { display: step === 1 ? "flex" : "none" }]}>
        {field("Nama penuh *", "name", textInput("name", "Masukkan nama penuh", 255))}
        {field("Tarikh lahir *", "date_of_birth", <Button variant="ghost" className="h-auto min-w-0 justify-start rounded-xl px-3 py-3" onPress={() => { Keyboard.dismiss(); setPicker("date"); }} style={[...inputStyle("date_of_birth"), styles.select]}>
          <Text style={{ flex: 1, color: fields.date_of_birth ? theme.text : theme.secondary, fontSize: 14 }}>{fields.date_of_birth || "Pilih tarikh lahir"}</Text><Ionicons name="calendar-outline" size={20} color={theme.secondary}/>
        </Button>)}
        {field("Kewarganegaraan *", "citizenship", select("citizenship"))}
        {field("Jantina (Pilihan)", "gender", select("gender"))}
        {field("Etnik (Pilihan)", "ethnicity", textInput("ethnicity", "Masukkan etnik", 100))}
        {step === 1 && error("general")}
        <Button variant="ghost" className="h-auto min-w-0 rounded-xl px-4 py-3" onPress={() => { Keyboard.dismiss(); form.next(); }} style={[styles.primary, { backgroundColor: theme.primary }]}><Text style={{ ...Design.primaryButtonText, color: theme.background }}>Seterusnya</Text></Button>
      </View>
      <View style={[styles.fields, { display: step === 2 ? "flex" : "none" }]}>
        <Text style={[styles.label, { color: theme.text }]}>Kaedah hubungan *</Text>
        <Tabs value={method} onValueChange={value => { if (!loading) form.setMethod(value as "email" | "phone"); }}><TabsList tabs={['email', 'phone']}><TabsTrigger value="email">E-mel</TabsTrigger><TabsTrigger value="phone">Nombor telefon</TabsTrigger></TabsList></Tabs>
        <View style={{ display: method === "email" ? "flex" : "none" }}>{field("Alamat e-mel *", "email", textInput("email", "nama@email.com", 255))}</View>
        <View style={{ display: method === "phone" ? "flex" : "none" }}><Text style={[styles.label, { color: theme.text, marginBottom: 8 }]}>Nombor telefon *</Text><PhoneNumberInput value={fields.phone} onChangeText={value => form.update("phone", value)} editable={!loading} error={errors.phone}/></View>
        {field("Kata laluan *", "password", <PasswordInput value={fields.password} onChangeText={value => form.update("password", value)} editable={!loading} placeholder="Minimum 8 aksara" placeholderTextColor={theme.secondary} accessibilityLabel="Kata laluan" autoComplete="new-password" style={inputStyle("password")}/>)}
        {field("Sahkan kata laluan *", "password_confirmation", <PasswordInput value={fields.password_confirmation} onChangeText={value => form.update("password_confirmation", value)} editable={!loading} placeholder="Ulang kata laluan" placeholderTextColor={theme.secondary} accessibilityLabel="Sahkan kata laluan" autoComplete="new-password" style={inputStyle("password_confirmation")}/>)}
        <View style={[styles.notice, { backgroundColor: theme.communityBg }]}><Ionicons name="information-circle-outline" size={20} color={theme.primary}/><Text style={{ flex: 1, color: theme.text, fontSize: 12, lineHeight: 18 }}>Gunakan sekurang-kurangnya 8 aksara.</Text></View>
        {step === 2 && error("general")}
        <View style={styles.buttons}>
          <Button variant="ghost" className="h-auto min-w-0 rounded-xl px-4 py-3" isDisabled={loading} onPress={back} style={[styles.secondary, { borderColor: theme.border }]}><Text style={{ color: theme.text }}>Kembali</Text></Button>
          <Button variant="ghost" className="h-auto min-w-0 rounded-xl px-4 py-3" isDisabled={loading} accessibilityState={{ busy: loading }} onPress={() => { void form.submit(); }} style={[styles.primary, { flex: 1, marginTop: 0, backgroundColor: theme.primary }]}>{loading ? <ActivityIndicator color={theme.background}/> : <Text style={{ ...Design.primaryButtonText, color: theme.background }}>Cipta akaun</Text>}</Button>
        </View>
        <Text style={{ color: theme.secondary, fontSize: 11, lineHeight: 17, textAlign: "center" }}>Dengan mencipta akaun, anda bersetuju dengan <Text accessibilityRole="link" onPress={() => { if (!loading) router.push("/(tabs)/profile/data-privacy"); }} style={{ color: theme.primary }}>Dasar privasi</Text>.</Text>
      </View>
      <View style={styles.login}><Text style={{ color: theme.secondary, fontSize: 12 }}>Sudah mempunyai akaun?</Text><Button variant="ghost" className="h-auto min-w-0 p-0" isDisabled={loading} onPress={() => router.replace({ pathname: "/(auth)/login", params: { returnTo } })}><Text style={{ color: theme.primary, fontSize: 12, fontWeight: "600" }}>Log masuk</Text></Button></View>
    </KeyboardForm>
    {picker === "date" && <BirthDatePicker value={fields.date_of_birth} theme={theme} onClose={() => setPicker(null)} onConfirm={day => { form.update("date_of_birth", day); setPicker(null); }}/>}
    {(picker === "citizenship" || picker === "gender") && <Modal visible transparent animationType="slide" onRequestClose={() => setPicker(null)}><View style={{ flex: 1, backgroundColor: theme.overlay, justifyContent: "flex-end" }}><Pressable style={StyleSheet.absoluteFill} onPress={() => setPicker(null)}/><View accessibilityViewIsModal style={{ maxHeight: "75%", backgroundColor: theme.card, padding: 24, paddingBottom: insets.bottom + 24, borderTopLeftRadius: 24, borderTopRightRadius: 24 }}>
      <Text style={[styles.label, { color: theme.text, marginBottom: 12 }]}>{picker === "gender" ? "Jantina" : "Kewarganegaraan"}</Text><ScrollView>{options[picker].map(([value, label]) => <Button key={value} variant="ghost" className="h-auto min-w-0 rounded-xl px-3 py-3" accessibilityState={{ selected: fields[picker] === value }} onPress={() => { form.update(picker, value); setPicker(null); }} style={[styles.select, { backgroundColor: fields[picker] === value ? theme.communityBg : theme.card, marginBottom: 8 }]}><Text style={{ flex: 1, color: theme.text }}>{label}</Text>{fields[picker] === value && <Ionicons name="checkmark" size={18} color={theme.primary}/>}</Button>)}</ScrollView><Button variant="ghost" onPress={() => setPicker(null)}><Text style={{ color: theme.primary }}>Batal</Text></Button>
    </View></View></Modal>}
  </View>;
}
const styles = StyleSheet.create({
  fixedHeader: { paddingHorizontal: 20, paddingTop: 4, width: "100%", maxWidth: Design.contentWidth, alignSelf: "center" }, toolbar: { flexDirection: "row", justifyContent: "space-between", marginBottom: 10 }, icon: { width: 44, height: 44 },
  title: { fontSize: 28, fontWeight: "800", letterSpacing: -0.6 }, description: { fontSize: 14, lineHeight: 21, marginTop: 8 },
  progress: { flexDirection: "row", position: "relative", paddingVertical: 16 }, progressItem: { width: "50%", alignItems: "center", gap: 6 }, circle: { width: 32, height: 32, borderRadius: 16, borderWidth: 1, alignItems: "center", justifyContent: "center" }, track: { position: "absolute", left: "25%", right: "25%", height: 3, top: 31 },
  content: { flexGrow: 1, paddingHorizontal: 20, paddingTop: 12, width: "100%", maxWidth: Design.contentWidth, alignSelf: "center" }, fields: { gap: 16 }, field: { gap: 8 }, label: { fontSize: 13, fontWeight: "600" },
  input: { minHeight: 50, borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14 }, select: { flexDirection: "row", alignItems: "center", gap: 8, minHeight: 50 },
  primary: { ...Design.primaryButton, marginTop: 8 }, secondary: { flex: 1, minHeight: 50, borderWidth: 1, borderRadius: 12 }, buttons: { flexDirection: "row", gap: 12, marginTop: 8 }, notice: { flexDirection: "row", gap: 10, padding: 12, borderRadius: 12 }, login: { flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 6, marginTop: 12 },
});
