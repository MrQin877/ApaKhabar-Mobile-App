# Password reset setup

## Local Docker + Expo

Phone and laptop must use the same Wi-Fi. In Repo A, run:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\deployment\start-local.ps1
```

The launcher detects the laptop address and supplies Laravel's `APP_URL`.
After changing backend source, append `-Build` to rebuild the images.

In Repo C, leave `EXPO_PUBLIC_API_BASE_URL` blank and run:

```powershell
npx expo start --lan --clear
```

Open this Expo session on the phone before requesting a new reset email.
Expo supplies its current return URL, including its actual Metro port. Laravel validates it against the current backend host and signs the email handoff. The mobile API uses the active bundle host on port `8088`.

After switching Wi-Fi, rerun the launcher and Expo, scan the new QR code, and request a new email. An already-sent email containing an old LAN address cannot update itself. Expo tunnels forward Metro, not the local Laravel API; use LAN mode or a configured HTTPS backend.

## Installed builds / Azure

Build Repo C with `EXPO_PUBLIC_API_BASE_URL=https://YOUR_BACKEND.azurewebsites.net/api`.
Configure Laravel's `APP_URL` with that backend's HTTPS origin and keep `MOBILE_PASSWORD_RESET_RETURN_URL=apakhabarmobileapp:///reset-password`.
The installed app must register the existing `apakhabarmobileapp` scheme. Expo Go uses a development session URL instead; it is not a production callback.

For Expo Go testing against Azure, explicitly allow the complete current callback
in the backend environment:

```env
MOBILE_PASSWORD_RESET_EXPO_RETURN_URLS=exp://192.168.68.59:8081/--/reset-password
```

Multiple approved callbacks can be comma-separated. Scheme, host, port and path
must match exactly. Recreate the application containers and rebuild configuration
cache after changing this server setting. Keep the phone on a network that can
reach Metro. If the laptop IP or Metro port changes, update the allowlist and
request a new reset email. The API remains `https://apakhabar.me/api`; the
installed-app callback remains `apakhabarmobileapp:///reset-password`.

Incoming email links never override the app's API URL. Website reset requests continue using Laravel's normal website reset form.

## Physical-phone check

1. Request a new reset email from the phone.
2. Tap the email button with the app closed, then repeat with it already open. Confirm the reset screen opens once and shows the correct email.
3. Enter matching new passwords. Confirm success and log in with the new password; the old password must fail.
4. Reuse the link and check the expired/invalid message. Disconnect Wi-Fi and check the connection message instead.
5. Change Wi-Fi, repeat the startup steps, and request a fresh email without editing an IP address.

Automated tests use fake mail and isolated test users; they do not send email to real users or verify phone OS/mail-client behaviour.

## Testing notes — 13 November 2026

Physical-phone verification in Repo C was completed and confirmed by the user:

- New reset email received: passed.
- Email link opened the reset screen only once: passed.
- Password reset completed successfully: passed.
- Login with the new password: passed.

No issues were reported in this phone test. The current implementation was retained.

Automated verification passed: 50 Laravel tests (225 assertions), mobile reset/deep-link and API-discovery tests, and TypeScript. Live Docker checks confirmed the signed redirect, rejection of a tampered link, and working website/API responses.

Still untested on a physical phone: switching Wi-Fi networks and expired reset links. Automated tests cover changed LAN origins and expired links; those results do not replace device testing.
