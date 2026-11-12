# HeroUI Native migration

Implemented in the existing Expo SDK 58 application on 12 November 2026. No Laravel, database, API endpoint, authentication or moderation changes were made.

## Dependencies and setup

- HeroUI Native 1.0.11 (native package; no HeroUI React/web package).
- Uniwind 1.13.2 with Tailwind CSS 4.3.5, tailwind-variants 3.3.1 and tailwind-merge 3.7.0.
- Gorhom Bottom Sheet 5.2.14 and Expo-compatible react-native-svg 15.16.0.
- Retained Expo 58's Reanimated 4.7.1, Worklets 0.13.0, Gesture Handler 3.3.0, Screens 4.30.1 and Safe Area Context 5.11.1.
- Removed unused RN Primitives portal/separator/slot dependencies and the obsolete root NativeWind declaration. The old nested template is untouched and excluded.
- Repaired missing installed Reanimated source files left over from the interrupted SDK installation using the official package archive, without changing its version.

`metro.config.js` wraps Expo Metro with Uniwind. `global.css` imports Tailwind, Uniwind and HeroUI Native styles and overrides the light/dark semantic tokens. `app/_layout.tsx` imports that stylesheet and installs GestureHandlerRootView, one HeroUI raw provider and one HeroUI portal host. The raw provider retains the existing notification toast without adding a duplicate toast system. Granular component imports avoid importing the whole library.

## Migrated surfaces

| Surface | HeroUI components / retained behaviour |
| --- | --- |
| News Homepage | Buttons, category Chips, SearchField, Card and PressableFeedback; existing broadcast and news APIs retained |
| News Detail | Header and engagement Buttons; existing article formatting, bookmark/share/like actions retained |
| Berita Lain | Card and PressableFeedback; existing exclusion, ordering and three-post limit retained |
| Terkini and Carian | Compact Cards, Buttons, Chips, SearchField with clear control and BottomSheet filters; combined filtering and URL state retained |
| Comments | BottomSheet with dimmed overlay, handle and title, Gorhom FlatList, HeroUI Input with keyboard-aware handlers, and Buttons; existing replies, reports, quotas, drafts and moderation retained |
| Bottom navigation | Existing Expo Router Tabs and routes, HeroUI press feedback and semantic theme colours; safe-area sizing and badges retained |

Images, article text, editorial spacing, custom comment layouts and the Router navigator remain React Native components where appropriate. The existing typography, image ratios, rounded thumbnails, compact rows and green accent are retained.

## Appearance

The existing persisted `system` / `light` / `dark` preference remains in AppearanceContext and now updates Uniwind's theme. HeroUI reads `global.css`; `useAppTheme` resolves those same tokens for custom layouts, icons and Router options. Server-rendered web pages fall back to the existing palette while CSS variables are unavailable.

Light uses white surfaces and #216E35 green. Dark uses #151718 background, #1C2420 surfaces and #74D68A green. Broadcast warnings, comment inputs, dividers, overlays and filters follow the same theme. Stylesheet compilation checked the explicit light/dark root scopes and accent/background values.

## Checks performed

- Expo Doctor: 20/20 checks passed after dependency integration.
- npm dependency tree: no top-level conflicts.
- TypeScript: passed.
- ESLint: no errors; existing unrelated warnings remain.
- Existing authentication, news detail, filtering, comments and mobile integration regression scripts: passed.
- Final Metro Android and iOS production bundles: passed, including the theme stylesheet and Reanimated worklets.
- Web bundle and static rendering completed. HeroUI's web server rendering emitted upstream colorKit fallback warnings, and Expo Notifications emitted its existing web support notices. HeroUI Native officially focuses on iOS/Android; web is not a fully verified target for this migration.

No physical-device or emulator interaction test was possible. Browser preview access was unavailable. Verify the following on a phone before release: light/dark/system switching, opening each article and returning with filters intact, comment-list scrolling, keyboard opening/closing, drag-to-dismiss, Android back, reply/report drafts and the three tabs. No live comments, likes or moderation records were created during verification.

## Expo Go and starting

This migration does not require a development build: free Uniwind and HeroUI's JavaScript components use the native dependencies already supported by Expo Go. Use Expo Go compatible with SDK 58. The existing remote push-notification feature still requires a development build; its Expo Go guard remains unchanged.

```powershell
cd C:\Testxampp\htdocs\ApaKhabar-Mobile-App
npx expo start --clear --lan
```

Keep the phone and computer on the same Wi-Fi and scan the QR code. Run the existing Laravel server separately for real API data, using the existing setup.

## Official references

- [HeroUI Native quick start](https://heroui.com/en/docs/native/getting-started/quick-start)
- [HeroUI Native theming](https://heroui.com/en/docs/native/getting-started/theming)
- [HeroUI raw provider](https://heroui.com/en/docs/native/getting-started/provider#raw-provider)
- [HeroUI BottomSheet keyboard and scroll handling](https://heroui.com/en/docs/native/components/bottom-sheet)
- [Uniwind installation](https://docs.uniwind.dev/quickstart)
- [Uniwind Expo Go support](https://uniwind.dev/vs-nativewind)
