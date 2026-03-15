import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  StatusBar,
  ScrollView,
  Animated,
  useWindowDimensions,
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function RegisterScreen() {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{
    name?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
  }>({});

  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 480, useNativeDriver: true }),
    ]).start();
  }, []);

  const validate = () => {
    const e: typeof errors = {};
    if (!name) e.name = 'Nama diperlukan';
    if (!email) e.email = 'Email diperlukan';
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = 'Email tidak sah';
    if (!password) e.password = 'Kata laluan diperlukan';
    else if (password.length < 6) e.password = 'Minimum 6 aksara';
    if (!confirmPassword) e.confirmPassword = 'Sila sahkan kata laluan';
    else if (confirmPassword !== password) e.confirmPassword = 'Kata laluan tidak sepadan';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleRegister = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      await new Promise((res) => setTimeout(res, 1500));
      router.replace('/(tabs)');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const isSmall  = height < 680;
  const sidePad  = width * 0.08;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          {
            paddingTop: insets.top + (isSmall ? 20 : 40),
            paddingBottom: insets.bottom + 32,
            paddingHorizontal: sidePad,
          },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>

          {/* Title */}
          <Text style={[styles.title, { fontSize: isSmall ? 26 : 32 }]}>Daftar Akaun</Text>
          <Text style={styles.subtitle}>Cipta akaun baru untuk bermula</Text>

          {/* Name */}
          <View style={[styles.fieldGroup, { marginTop: isSmall ? 24 : 32 }]}>
            <Text style={styles.label}>Nama Penuh</Text>
            <View style={[styles.inputWrap, errors.name ? styles.inputWrapError : null]}>
              <Text style={styles.inputIcon}>A</Text>
              <TextInput
                style={styles.input}
                placeholder="Masukkan nama penuh"
                placeholderTextColor="#C8D8D4"
                autoCapitalize="words"
                autoCorrect={false}
                value={name}
                onChangeText={(t) => {
                  setName(t);
                  if (errors.name) setErrors((e) => ({ ...e, name: undefined }));
                }}
              />
            </View>
            {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
          </View>

          {/* Email */}
          <View style={[styles.fieldGroup, { marginTop: isSmall ? 14 : 18 }]}>
            <Text style={styles.label}>Email</Text>
            <View style={[styles.inputWrap, errors.email ? styles.inputWrapError : null]}>
              <Text style={styles.inputIcon}>@</Text>
              <TextInput
                style={styles.input}
                placeholder="Masukkan email anda"
                placeholderTextColor="#C8D8D4"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                value={email}
                onChangeText={(t) => {
                  setEmail(t);
                  if (errors.email) setErrors((e) => ({ ...e, email: undefined }));
                }}
              />
            </View>
            {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
          </View>

          {/* Password */}
          <View style={[styles.fieldGroup, { marginTop: isSmall ? 14 : 18 }]}>
            <Text style={styles.label}>Kata Laluan</Text>
            <View style={[styles.inputWrap, errors.password ? styles.inputWrapError : null]}>
              <Text style={styles.inputIcon}>•••</Text>
              <TextInput
                style={styles.input}
                placeholder="Masukkan kata laluan"
                placeholderTextColor="#C8D8D4"
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                value={password}
                onChangeText={(t) => {
                  setPassword(t);
                  if (errors.password) setErrors((e) => ({ ...e, password: undefined }));
                }}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Text style={styles.inputIcon}>{showPassword ? '—' : '◎'}</Text>
              </TouchableOpacity>
            </View>
            {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
          </View>

          {/* Confirm Password */}
          <View style={[styles.fieldGroup, { marginTop: isSmall ? 14 : 18 }]}>
            <Text style={styles.label}>Sahkan Kata Laluan</Text>
            <View style={[styles.inputWrap, errors.confirmPassword ? styles.inputWrapError : null]}>
              <Text style={styles.inputIcon}>•••</Text>
              <TextInput
                style={styles.input}
                placeholder="Masukkan semula kata laluan"
                placeholderTextColor="#C8D8D4"
                secureTextEntry={!showConfirm}
                autoCapitalize="none"
                value={confirmPassword}
                onChangeText={(t) => {
                  setConfirmPassword(t);
                  if (errors.confirmPassword) setErrors((e) => ({ ...e, confirmPassword: undefined }));
                }}
              />
              <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)}>
                <Text style={styles.inputIcon}>{showConfirm ? '—' : '◎'}</Text>
              </TouchableOpacity>
            </View>
            {errors.confirmPassword && <Text style={styles.errorText}>{errors.confirmPassword}</Text>}
          </View>

          {/* Register button */}
          <TouchableOpacity
            onPress={handleRegister}
            disabled={loading}
            activeOpacity={0.85}
            style={{ marginTop: isSmall ? 20 : 28 }}
          >
            <LinearGradient
              colors={['#3FCC54', '#00B99B']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[styles.registerBtn, loading && { opacity: 0.65 }]}
            >
              {loading
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.registerBtnText}>DAFTAR</Text>
              }
            </LinearGradient>
          </TouchableOpacity>

          {/* Back to login */}
          <View style={[styles.loginRow, { marginTop: isSmall ? 24 : 32 }]}>
            <Text style={styles.loginLabel}>Sudah ada akaun?</Text>
            <TouchableOpacity onPress={() => router.back()}>
              <Text style={styles.loginLink}>Log Masuk</Text>
            </TouchableOpacity>
          </View>

        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scroll: {
    flexGrow: 1,
  },

  title: {
    fontWeight: '700',
    color: '#1A2E27',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13,
    color: '#AABFBA',
    textAlign: 'center',
    marginTop: 6,
  },

  fieldGroup: {},
  label: {
    fontSize: 12,
    color: '#8AADA4',
    marginBottom: 8,
    fontWeight: '500',
    letterSpacing: 0.3,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E5EFEC',
    borderRadius: 10,
    paddingHorizontal: 14,
    backgroundColor: '#FAFCFB',
  },
  inputWrapError: {
    borderColor: '#E05252',
    backgroundColor: '#FEF7F7',
  },
  inputIcon: {
    fontSize: 13,
    marginRight: 8,
    color: '#AAC4BB',
    fontWeight: '600',
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 14,
    color: '#1A2E27',
  },
  errorText: {
    color: '#E05252',
    fontSize: 12,
    marginTop: 5,
  },

  registerBtn: {
    borderRadius: 10,
    paddingVertical: 16,
    alignItems: 'center',
  },
  registerBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 2,
  },

  loginRow: {
    alignItems: 'center',
  },
  loginLabel: {
    color: '#AABFBA',
    fontSize: 12,
    marginBottom: 6,
  },
  loginLink: {
    color: '#1A2E27',
    fontSize: 15,
    fontWeight: '700',
  },
});