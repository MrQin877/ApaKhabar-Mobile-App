import { Tabs } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

function BeritaIcon({ color }: { color: string }) {
  return (
    <View style={styles.iconWrap}>
      <Text style={[styles.iconText, { color }]}>≡</Text>
    </View>
  );
}

function NotifikasiIcon({ color }: { color: string }) {
  return (
    <View style={styles.iconWrap}>
      <Text style={[styles.iconText, { color }]}>🔔</Text>
    </View>
  );
}

function ProfilIcon({ color }: { color: string }) {
  return (
    <View style={styles.iconWrap}>
      <Text style={[styles.iconText, { color }]}>○</Text>
    </View>
  );
}

export default function TabLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#3FCC54',
        tabBarInactiveTintColor: '#AABFBA',
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopWidth: 1,
          borderTopColor: '#EDF3F1',
          height: 56 + insets.bottom,
          paddingBottom: insets.bottom,
          paddingTop: 8,
          elevation: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.06,
          shadowRadius: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: 2,
        },
      }}
    >
      {/* ── 3 visible tabs ── */}
      <Tabs.Screen
        name="news_content"
        options={{
          title: 'Berita',
          tabBarIcon: ({ color }) => <BeritaIcon color={color} />,
        }}
      />
      <Tabs.Screen
        name="notifikasi"
        options={{
          title: 'Notifikasi',
          tabBarIcon: ({ color }) => <NotifikasiIcon color={color} />,
        }}
      />
      <Tabs.Screen
        name="profil"
        options={{
          title: 'Profil',
          tabBarIcon: ({ color }) => <ProfilIcon color={color} />,
        }}
      />

      {/* ── Hide default Expo screens ── */}
      <Tabs.Screen name="index"   options={{ href: null }} />
      <Tabs.Screen name="explore" options={{ href: null }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: {
    fontSize: 20,
  },
});