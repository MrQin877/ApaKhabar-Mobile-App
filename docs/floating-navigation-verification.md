# Floating bottom navigation

Implemented 13 November 2026 in Repo C.

- `FloatingTabBar` is shared by Berita, Video, Notifikasi and Profil. It uses
  HeroUI Native PressableFeedback, the existing icon components, theme tokens,
  appearance preference and Router tab events/route keys.
- The surface is rounded and translucent with a fine border, soft shadow and
  Expo BlurView. Selected icons have a circular themed background. Video always
  uses the existing dark palette, including when the app is in light mode.
- Each tab has equal width, a minimum 48-point touch height, selected state and
  an accessible label. The unread notification badge remains available.
- Ordinary pages reserve the full navigation footprint. Video fills the screen
  behind the bar; its captions and engagement buttons use the same safe-area
  footprint to stay above the navigation. Horizontal safe areas and a maximum
  content width support wider screens.
- Nested tab stacks and registration/guest gates are unchanged. Existing detail
  routes still hide the bar. Video's existing tab-press restart listener remains.
- Added the SDK-compatible `expo-blur` dependency. Each scene supplies a separate
  blur target, keeping the navigation out of its own blur capture. iOS/web use
  native/backdrop blur; Android 12+ uses the supported native blur method, with
  a translucent fallback on older Android versions. Native custom builds need
  rebuilding to include the new module.

## Verification

- `npx tsc --noEmit`: passed.
- `node scripts/floating-navigation-regression.test.cjs`: passed, covering four
  tabs, two themes, bottom insets of 0/24/34, selected states, video dark tint,
  notification badge, touch sizes, events, prevented presses, hidden detail tabs
  and shared video clearance.
- Existing Shorts, appearance and guest-access regression scripts: passed.
- Expo web export: passed (44 static routes). The build emitted colorKit color
  conversion and web-notification warnings; native visual checks remain required.
- UI preview automation could not initialize in this environment. Automated
  component checks do not establish native rendering or visual pixel accuracy.

## Device checks remaining

On both iOS and Android, inspect all four tabs in light/dark mode at narrow and
wide sizes. Confirm blur/translucency, border/shadow, large text, VoiceOver or
TalkBack, home-indicator/gesture and Android three-button safe areas. Check the
bar over bright and dark video frames, long captions and comments overlays;
verify video playback/paging and engagement controls. Switch tabs repeatedly
and return from nested pages to confirm retained page state and back behavior.
