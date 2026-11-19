# Forgot-password investigation — 19 November 2026

The email verification refresh action now reads `Saya sudah memverifikasi email`.

## Reported failure

On a physical iPhone in Expo Go, tapping the forgot-password action produces
`Cannot find native module 'ExpoAsset'`, followed by `main has not been registered`.
The second error follows the module-loading failure; changing the entry point is
not supported by the evidence.

## Confirmed checks

- Metro on port 8081 runs from the root `ApaKhabar-Mobile-App` project.
- The iOS Metro manifest reports `exposdk:58.0.0`.
- `expo-asset` 58.0.21 is installed once and matches Expo's bundled dependency map.
- The project contains a separate SDK 56 starter in `apakhabar-mobile/`; it is not
  the currently running Metro project.
- Forgot-password and reset regression tests pass, including submit, validation,
  resend, phone navigation, and cold/warm reset-link parsing.
- After dependency alignment, the online compatibility check, TypeScript check,
  and complete iOS bundle export pass.
- The online compatibility check recommended Expo 58.0.26, Router 58.0.32 and
  WebBrowser 58.1.0. Those patches are now installed, with the lockfile updated.
  Aligning those packages does not add missing native modules
  to an already installed phone app.

## Device check still required

Stop Metro and restart from the root project with
`npx expo start --clear`. Fully close Expo Go and reopen the new QR session.
Confirm the iPhone Expo Go build supports SDK 58. If using a custom development
build, rebuild it with the current native dependencies. The installed phone
runtime and its Expo Go version have not been inspected, so the exact native
failure cause is not yet confirmed.

## Separate cloud reset-link blocker

The cloud API base URL is `https://apakhabar.me/api`. The app sends the active
Expo Go `exp://.../--/reset-password` return URL, but Laravel's
`MobilePasswordResetLink::destination` permits session overrides only in
local/testing environments and requires the backend host to match.
The original production backend rejected this request before sending email.
Installed builds using `apakhabarmobileapp:///reset-password` are supported.

Cloud testing with Expo Go needs an explicit server-side allowlist for the
development callback origin. Do not accept arbitrary callback hosts: the
password-reset handoff sends a reset token and email to that destination.
The backend now supports the explicit `MOBILE_PASSWORD_RESET_EXPO_RETURN_URLS`
allowlist. See `password-reset.md` for deployment configuration. Unlisted
destinations remain rejected.
