# Expo SDK 58 upgrade

Completed 12 November 2026 in the existing mobile project. The interrupted install was resumed using the npm cache and existing packages. package-lock.json is regenerated and consistent with the installed dependencies. The original dependency snapshot is in the ignored .tmp/sdk58-before folder.

## Changed installed dependencies

| Package | Before | After |
| --- | --- | --- |
| @rn-primitives/portal | 1.4.0 | 1.5.3 |
| @rn-primitives/separator | 1.2.0 | 1.5.2 |
| @rn-primitives/slot | 1.2.0 | 1.5.2 |
| @types/react | 19.2.18 | 19.3.0 |
| axios | 1.14.0 | 1.21.1 |
| babel-preset-expo | 57.0.11 | 58.0.25 |
| eslint | 9.39.4 | 9.39.5 |
| eslint-config-expo | 57.0.2 | 58.0.4 |
| expo | 57.0.22 | 58.0.24 |
| expo-constants | 57.0.18 | 58.0.16 |
| expo-device | 57.0.2 | 58.0.5 |
| expo-font | 57.0.4 | 58.0.12 |
| expo-haptics | 57.0.3 | 58.0.8 |
| expo-image | 57.0.5 | 58.0.18 |
| expo-linear-gradient | 57.0.2 | 58.0.4 |
| expo-linking | 57.0.10 | 58.0.17 |
| expo-notifications | 57.0.18 | 58.1.9 |
| expo-router | 57.0.21 | 58.0.31 |
| expo-secure-store | 57.0.4 | 58.0.3 |
| expo-splash-screen | 57.0.9 | 58.0.14 |
| expo-status-bar | 57.0.1 | 58.0.5 |
| expo-symbols | 57.0.3 | 58.0.5 |
| expo-system-ui | 57.0.4 | 58.0.7 |
| expo-web-browser | 57.0.3 | 58.0.8 |
| react | 19.2.3 | 19.3.0 |
| react-dom | 19.2.3 | 19.3.0 |
| react-native | 0.86.3 | 0.88.1 |
| react-native-gesture-handler | 2.32.0 | 3.3.0 |
| react-native-reanimated | 4.5.1 | 4.7.1 |
| react-native-safe-area-context | 5.7.0 | 5.11.1 |
| react-native-screens | 4.26.2 | 4.30.1 |
| react-native-web | 0.21.2 | 0.21.4 |
| react-native-worklets | 0.10.1 | 0.13.0 |

## Compatibility changes

- React Native strict instance types for text input and scroll view refs.
- Removed unsupported React Native StatusBar props.
- Router stack anchor setting updated for SDK 58.
- CSS safe-area insets for web; native screen inset handling retained.
- List header/empty placeholders and tab icon colour types aligned with the new types.
- Notification channel importance uses the public named export.
- Temporary backups excluded from TypeScript, lint and Git.

No UI redesign, Laravel backend or database changes were made. Existing API URLs, authentication, navigation destinations, and moderation flows are retained.

## Verification

- Latest Expo Doctor: 20/20 checks passed.
- Expo dependency compatibility check: passed against the SDK 58 local manifest; Doctor also passed dependency checks.
- npm ls --depth=0: passed, no dependency conflicts reported.
- TypeScript tsc --noEmit: passed.
- ESLint: no errors; pre-existing warnings remain.
- Existing authentication, detail, filters, comments and mobile integration regression scripts: passed.
- Metro Android production bundle: passed (1385 modules), output in .tmp/sdk58-android.

A physical phone and a native iOS build were not tested. Expo Go must support SDK 58; remote push notifications still require a development build. Existing code skips unsupported remote push registration in Expo Go.

## Start

From PowerShell:

~~~powershell
cd C:\Testxampp\htdocs\ApaKhabar-Mobile-App
npx expo start --clear --lan
~~~

Use an SDK 58 compatible Expo Go and scan the QR code, with the phone and computer on the same network. Run the existing Laravel server separately for API data; its configuration was not changed.

## Official references

- https://expo.dev/blog/how-to-upgrade-to-sdk-58
- https://docs.expo.dev/router/migrate/sdk-57-to-58/
- https://expo.dev/go?sdkVersion=58&platform=android&device=true
- https://docs.expo.dev/versions/v58.0.0/sdk/notifications/
