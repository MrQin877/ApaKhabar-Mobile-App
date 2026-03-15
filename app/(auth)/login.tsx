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

export default function LoginScreen() {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const fadeAnim   = useRef(new Animated.Value(0)).current;
  const slideAnim  = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 480, useNativeDriver: true }),
    ]).start();
  }, []);

  const validate = () => {
    const newErrors: { email?: string; password?: string } = {};
    if (!email) newErrors.email = 'Email diperlukan';
    else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = 'Email tidak sah';
    if (!password) newErrors.password = 'Kata laluan diperlukan';
    else if (password.length < 6) newErrors.password = 'Minimum 6 aksara';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      await new Promise((res) => setTimeout(res, 1500));
      router.replace('/(tabs)');
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const isSmall = height < 680;
  const sidePad = width * 0.08;

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
            paddingTop: insets.top + (isSmall ? 24 : 48),
            paddingBottom: insets.bottom + 32,
            paddingHorizontal: sidePad,
          },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>

          {/* Title */}
          <Text style={[styles.title, { fontSize: isSmall ? 28 : 34 }]}>Log Masuk</Text>

          {/* Email field */}
          <View style={[styles.fieldGroup, { marginTop: isSmall ? 28 : 40 }]}>
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

          {/* Password field */}
          <View style={[styles.fieldGroup, { marginTop: isSmall ? 16 : 20 }]}>
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

          {/* Forgot password */}
          <TouchableOpacity style={styles.forgotWrap}>
            <Text style={styles.forgotText}>Lupa kata laluan?</Text>
          </TouchableOpacity>

          {/* LOGIN button — dark pill like reference */}
          <TouchableOpacity
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.85}
            style={[styles.loginBtn, { marginTop: isSmall ? 20 : 28 }]}
          >
            <LinearGradient
              colors={['#3FCC54', '#00B99B']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[styles.loginGradient, loading && { opacity: 0.65 }]}
            >
              {loading
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.loginBtnText}>LOG MASUK</Text>
              }
            </LinearGradient>
          </TouchableOpacity>

          {/* Sign up link */}
          <View style={[styles.signupRow, { marginTop: isSmall ? 24 : 36 }]}>
            <Text style={styles.signupLabel}>Atau Daftar dengan</Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/register' as any)}>
              <Text style={styles.signupLink}>Daftar Sekarang</Text>
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

  // Title
  title: {
    fontWeight: '700',
    color: '#1A2E27',
    textAlign: 'center',
  },

  // Fields
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
    fontSize: 15,
    marginRight: 8,
    color: '#AAC4BB',
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

  // Forgot
  forgotWrap: {
    alignSelf: 'flex-end',
    marginTop: 10,
  },
  forgotText: {
    color: '#00B99B',
    fontSize: 13,
    fontWeight: '500',
  },

  // Login button
  loginBtn: {},
  loginGradient: {
    borderRadius: 10,
    paddingVertical: 16,
    alignItems: 'center',
  },
  loginBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 2,
  },

  // Divider
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#EDF3F1',
  },
  dividerText: {
    color: '#AABFBA',
    fontSize: 12,
    marginHorizontal: 10,
  },

  // Social buttons
  socialRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
  },
  socialBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#1A2E27',
    alignItems: 'center',
    justifyContent: 'center',
  },
  socialBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },

  // Sign up
  signupRow: {
    alignItems: 'center',
  },
  signupLabel: {
    color: '#AABFBA',
    fontSize: 12,
    marginBottom: 6,
  },
  signupLink: {
    color: '#1A2E27',
    fontSize: 15,
    fontWeight: '700',
  },
});