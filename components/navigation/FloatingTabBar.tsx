import type { BottomTabBarProps } from 'expo-router/tabs';
import { BlurView, type BlurViewProps } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { PressableFeedback } from 'heroui-native/pressable-feedback';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useAppTheme } from '@/hooks/useAppTheme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors, Design } from '@/constants/theme';

export const floatingTabBarSpace = (bottom: number) => 72 + Math.max(bottom, 12) + 8;
const visibleTabs = ['news_content', 'video', 'notification', 'profile'];

/** Uses Router's events and route keys so tab state and nested stacks stay intact. */
export function FloatingTabBar({ state, descriptors, emitter, navigateToTab, blurTarget }: BottomTabBarProps & { blurTarget?: BlurViewProps['blurTarget'] }) {
  const insets = useSafeAreaInsets();
  const theme = useAppTheme();
  const scheme = useColorScheme();
  const current = state.routes[state.index];
  const video = current.name === 'video';
  const dark = video || scheme === 'dark';
  const colors = video ? Colors.dark : theme;
  const options = descriptors[current.key].options;
  if (StyleSheet.flatten(options.tabBarStyle)?.display === 'none') return null;

  return <View pointerEvents="box-none" style={[
    styles.space,
    { height: floatingTabBarSpace(insets.bottom), paddingBottom: Math.max(insets.bottom, 12), paddingLeft: Math.max(16, insets.left), paddingRight: Math.max(16, insets.right) },
    video && styles.overlay,
  ]}>
    <View style={[styles.surface, { borderColor: colors.border, backgroundColor: dark ? 'rgba(24,28,26,0.88)' : 'rgba(255,255,255,0.86)' }]}>
      <BlurView key={current.key} pointerEvents="none" blurTarget={blurTarget} blurMethod={blurTarget ? 'dimezisBlurViewSdk31Plus' : 'none'} intensity={35} tint={dark ? 'dark' : 'light'} style={StyleSheet.absoluteFill}/>
      {state.routes.filter(route => visibleTabs.includes(route.name)).map(route => {
        const focused = route.key === current.key;
        const tab = descriptors[route.key].options;
        const color = focused ? colors.primary : colors.secondary;
        const label = tab.title ?? route.name;
        const badge = tab.tabBarBadge;
        return <PressableFeedback key={route.key} accessibilityRole="tab" accessibilityState={{ selected: focused }}
          accessibilityLabel={tab.tabBarAccessibilityLabel ?? `${label}${badge ? `, ${badge} belum dibaca` : ''}`}
          testID={tab.tabBarButtonTestID}
          onPress={() => {
            const event = emitter.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
            if (!focused && !event.defaultPrevented) navigateToTab(route.key);
          }}
          onLongPress={() => emitter.emit({ type: 'tabLongPress', target: route.key })}
          style={styles.tab}>
          <View style={[styles.icon, { backgroundColor: focused ? colors.communityBg : 'transparent' }]}>
            {route.name === 'video' ? <Ionicons name={focused ? 'play-circle' : 'play-circle-outline'} size={25} color={color}/> :
              <IconSymbol name={route.name === 'news_content' ? (focused ? 'newspaper.fill' : 'newspaper') : route.name === 'notification' ? (focused ? 'bell.fill' : 'bell') : (focused ? 'person.fill' : 'person')} size={24} color={color}/>}
            {badge !== undefined && <View style={[styles.badge, { backgroundColor: colors.error }]}><Text style={{ color: dark ? Colors.light.text : Colors.light.background, fontSize: 9, fontWeight: '700' }}>{typeof badge === 'number' && badge > 99 ? '99+' : badge}</Text></View>}
          </View>
          <Text numberOfLines={1} style={[styles.label, { color }]}>{label}</Text>
        </PressableFeedback>;
      })}
    </View>
  </View>;
}

const styles = StyleSheet.create({
  space: { paddingTop: 8, justifyContent: 'flex-end' },
  overlay: { position: 'absolute', bottom: 0, left: 0, right: 0 },
  surface: { flexDirection: 'row', alignSelf: 'center', width: '100%', maxWidth: Design.contentWidth, height: 72, borderRadius: 28, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden', boxShadow: '0 3px 12px rgba(0,0,0,0.10)' },
  tab: { flex: 1, minHeight: 48, alignItems: 'center', justifyContent: 'center', gap: 2 },
  icon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  label: { fontSize: 10, lineHeight: 14, fontWeight: '600' },
  badge: { position: 'absolute', right: -6, top: -2, minWidth: 17, height: 17, borderRadius: 9, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3 },
});
