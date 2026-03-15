import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Image,
  Animated,
  useWindowDimensions,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function WelcomeScreen() {
  const { width, height } = useWindowDimensions(); // ✅ updates on rotate/resize
  const insets = useSafeAreaInsets();              // ✅ handles notch & home bar

  // Responsive scale helpers
  const isSmall = height < 680;      // small phones e.g. iPhone SE
  const isTall  = height > 850;      // large phones e.g. iPhone Pro Max

  const fadeTop        = useRef(new Animated.Value(0)).current;
  const translateTop   = useRef(new Animated.Value(-20)).current;
  const fadeButtons    = useRef(new Animated.Value(0)).current;
  const translateBtns  = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(fadeTop,      { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.timing(translateTop, { toValue: 0, duration: 500, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(fadeButtons,   { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(translateBtns, { toValue: 0, duration: 400, useNativeDriver: true }),
      ]),
    ]).start();
  }, []);

  // Dynamic values based on screen size
  const logoSize       = width * 0.12;                         // 12% of screen width
  const welcomeSize    = isSmall ? 26 : isTall ? 36 : 32;
  const subtitleSize   = isSmall ? 12 : 14;
  const btnPaddingV    = isSmall ? 13 : 16;
  const btnFontSize    = isSmall ? 12 : 13;
  const topPadding     = insets.top + (isSmall ? 24 : isTall ? 52 : 36);
  const bottomPadding  = insets.bottom + (isSmall ? 20 : 32);
  const sidePadding    = width * 0.08;                         // 8% of width

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* Diagonal green stripes — responsive positions */}
      <View style={[styles.stripe, {
        width: width * 0.07, height: height * 0.65,
        top: -height * 0.12, left: width * 0.10,
      }]} />
      <View style={[styles.stripe, {
        width: width * 0.04, height: height * 0.55,
        top: -height * 0.08, left: width * 0.22,
      }]} />
      <View style={[styles.stripe, {
        width: width * 0.07, height: height * 0.6,
        bottom: -height * 0.12, right: width * 0.10,
      }]} />
      <View style={[styles.stripe, {
        width: width * 0.04, height: height * 0.5,
        bottom: -height * 0.08, right: width * 0.22,
      }]} />

      {/* TOP — branding */}
      <Animated.View style={[
        styles.topSection,
        {
          paddingTop: topPadding,
          paddingHorizontal: sidePadding,
          opacity: fadeTop,
          transform: [{ translateY: translateTop }],
        },
      ]}>
        <Image
          source={require('../../assets/images/APAKHABAR_LOGO.png')}
          style={{ width: logoSize, height: logoSize, marginBottom: height * 0.025 }}
          resizeMode="contain"
        />
        <Text style={[styles.welcome, { fontSize: welcomeSize, lineHeight: welcomeSize * 1.2 }]}>
          Selamat Datang
        </Text>
        <Text style={[styles.subtitle, { fontSize: subtitleSize, marginTop: height * 0.012 }]}>
          Portal berita & maklumat komuniti anda
        </Text>
      </Animated.View>

      {/* SPACER — pushes buttons to bottom */}
      <View style={{ flex: 1 }} />

      {/* BOTTOM — buttons */}
      <Animated.View style={[
        styles.bottomSection,
        {
          paddingHorizontal: sidePadding,
          paddingBottom: bottomPadding,
          opacity: fadeButtons,
          transform: [{ translateY: translateBtns }],
        },
      ]}>
        {/* Primary — gradient filled */}
        <TouchableOpacity
          onPress={() => router.push('/(auth)/login')}
          activeOpacity={0.88}
        >
          <LinearGradient
            colors={['#3FCC54', '#00B99B']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.primaryBtn, { paddingVertical: btnPaddingV, borderRadius: width * 0.03 }]}
          >
            <Text style={[styles.primaryBtnText, { fontSize: btnFontSize }]}>
              LOG MASUK DENGAN EMAIL
            </Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* Secondary — outline */}
        <TouchableOpacity
          style={[
            styles.secondaryBtn,
            { paddingVertical: btnPaddingV - 1, borderRadius: width * 0.03, marginTop: height * 0.015 },
          ]}
          onPress={() => router.push('/(auth)/register' as any)}
          activeOpacity={0.88}
        >
          <Text style={[styles.secondaryBtnText, { fontSize: btnFontSize }]}>
            CIPTA AKAUN BARU
          </Text>
        </TouchableOpacity>

        {/* Text link */}
        <TouchableOpacity
          style={[styles.moreOptions, { marginTop: height * 0.022 }]}
        >
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const STRIPE_COLOR = 'rgba(63, 204, 84, 0.07)';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  stripe: {
    position: 'absolute',
    backgroundColor: STRIPE_COLOR,
    borderRadius: 8,
    transform: [{ rotate: '-35deg' }],
  },
  topSection: {
    // paddingTop & paddingHorizontal set inline
  },
  welcome: {
    fontWeight: '800',
    color: '#1A2E27',
  },
  subtitle: {
    color: '#8AADA4',
    lineHeight: 20,
  },
  bottomSection: {
    // padding set inline
  },
  primaryBtn: {
    alignItems: 'center',
  },
  primaryBtnText: {
    color: '#fff',
    fontWeight: '700',
    letterSpacing: 1,
  },
  secondaryBtn: {
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#3FCC54',
  },
  secondaryBtnText: {
    color: '#3FCC54',
    fontWeight: '700',
    letterSpacing: 1,
  },
  moreOptions: {
    alignItems: 'center',
    paddingVertical: 4,
  },
  moreOptionsText: {
    color: '#AABFBA',
    fontWeight: '600',
    letterSpacing: 1,
  },
});