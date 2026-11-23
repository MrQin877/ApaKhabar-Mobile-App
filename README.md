# ApaKhabar Mobile App (Repo C)

ApaKhabar Mobile is built using **Expo and React Native**. It connects to the Laravel backend (Repo A) to display news, notifications, comments, and user information.

## Source-code handover: run these commands in Repo C

This README belongs to **Repo C (mobile)**. The website/API is **Repo A**, and the Python AI service is **Repo B**. Follow Repo A's root README to configure and start Docker first.

| Repository | Dependency command on the recipient's computer | Startup |
| --- | --- | --- |
| Repo A: website, using Docker | No host `npm install` or `composer install`; Docker installs dependencies and builds assets. | Run `deployment/start-local.ps1 -Build` through PowerShell in Repo A on first setup. |
| Repo B: AI service, using Repo A's Docker stack | No host npm or pip command. | Started by Repo A; retain source at the configured build path. |
| Repo C: this mobile repository | `npm ci` | `npx expo start --lan --clear` |

### First installation (PowerShell, mobile repository root)

```powershell
cd "C:\Testxampp\htdocs\ApaKhabar-Mobile-App"
npm ci
if (!(Test-Path .env)) { Copy-Item .env.example .env }
npx expo start --lan --clear
```

Replace the example folder with your actual mobile source folder. Use the root containing this README, `package.json`, and `package-lock.json`, not the nested historical `apakhabar-mobile` project.

**Yes, mobile dependencies must be installed.** `npm ci` is preferred for handed-over source because it uses the supplied lockfile. `npm install` is an alternative, but can update that lockfile; do not run both consecutively. Repeat `npm ci` after dependency/lockfile updates, not on every startup.

Keep `EXPO_PUBLIC_API_BASE_URL=` blank for local LAN detection. Connect the phone and computer to the same Wi-Fi and keep Repo A running on port 8088. Open the QR code in an Expo Go version compatible with this project's SDK, or use a development build.

### Every subsequent session

Start Docker Desktop, then in **Repo A**:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\deployment\start-local.ps1
```

In a separate terminal in **Repo C**:

```powershell
npx expo start --lan --clear
```

There is no separate Repo B command for Docker. Stop Expo with `Ctrl+C`. From Repo A, stop backend containers without removing data:

```powershell
docker compose --env-file deployment/.env -f deployment/compose.yaml stop
```

### Public mobile release

Set `EXPO_PUBLIC_API_BASE_URL=https://YOUR_DOMAIN/api` before building a deployed app. All `EXPO_PUBLIC_*` values are public; do not put service secrets here. Restart Expo after local changes and rebuild installed releases after API configuration changes.

`expo start` is development testing, not an APK/IPA build. The supplied root has no `eas.json`; configure release profiles, Android/iOS identifiers, Expo project ownership/access, and signing credentials before a standalone release.

## 1. Requirements

Before starting, make sure you have:

- Node.js and npm
- Docker Desktop
- Repo A (Laravel backend)
- Repo C (Mobile app)
- Expo Go (if compatible) or an Expo development build
- Phone and laptop connected to the same Wi-Fi

For backend installation commands, use **Repo A's root `README.md`**, then `deployment/README.md` for detailed Docker troubleshooting.

## 2. First-Time Setup

### Step 1 — Install Mobile Dependencies

Open the Repo C folder in VS Code:

```powershell
cd "C:\Testxampp\htdocs\ApaKhabar-Mobile-App"
npm ci
```

### Step 2 — Set Up Docker (Repo A)

Make sure Repo A's Docker environment files and dependencies are configured according to Repo A's setup guide.

Open Docker Desktop and make sure the engine is running.

Then run:

```powershell
cd "C:\Testxampp\htdocs\ApaKhabar-Intelligence-Information-News-Management-System"
powershell -NoProfile -ExecutionPolicy Bypass -File .\deployment\start-local.ps1 -Build
```

This builds and starts the backend.

### Step 3 — Start Mobile (Repo C)

Open another terminal:

```powershell
cd "C:\Testxampp\htdocs\ApaKhabar-Mobile-App"
npx expo start --lan --clear
```

Scan the QR code using Expo Go or your development build.

## 3. Daily Startup

After completing the first-time setup, use these commands whenever you want to run ApaKhabar.

**Terminal 1 — Repo A**

Open Docker Desktop first, then run:

```powershell
cd "C:\Testxampp\htdocs\ApaKhabar-Intelligence-Information-News-Management-System"
powershell -NoProfile -ExecutionPolicy Bypass -File .\deployment\start-local.ps1
```

**Terminal 2 — Repo C**

```powershell
cd "C:\Testxampp\htdocs\ApaKhabar-Mobile-App"
npx expo start --lan --clear
```

**Note:** You do not need to rebuild Docker every time. Repo A's launcher starts the backend and automatically detects your laptop's LAN IP.

## 4. Automatic IP Detection

Repo C automatically detects the laptop's LAN IP when running Expo.

For local development, keep the `.env` API URL empty or remove the override:

```env
EXPO_PUBLIC_API_BASE_URL=
```

No manual IP updates are needed when changing Wi-Fi.

Repo A must be running and accessible on port `8088` for mobile features to load data.

## 5. Test Backend Connection

On your laptop, open:

```text
http://localhost:8088/api/news
```

On your phone, open:

```text
http://YOUR_LAN_IP:8088/api/news
```

Use the LAN IP displayed by Repo A's startup script.

- **JSON appears:** Backend connection works.
- **Cannot connect:** Check Docker, Wi-Fi, and Windows Firewall.
- **Mobile UI opens but data fails:** Check the resolved API URL in the Expo terminal.

Docker is not needed for UI-only testing, but it is required for backend features when using the local Docker API.

## 6. Stop the Application

**Stop Expo:**

Press `Ctrl + C` in the Repo C terminal.

**Stop Docker:**

Run from Repo A:

```powershell
docker compose --env-file deployment/.env -f deployment/compose.yaml stop
```

This stops the containers without deleting database records or Docker volumes.

## 7. Troubleshooting

### Expo Cannot Start

If you see:

```text
Cannot find module 'expo-router/_ctx-shared'
```

Check the installed versions:

```powershell
npm ls expo expo-router --depth=0
npm ls -g expo --depth=0
```

An outdated global Expo installation may cause a conflict.

To remove it:

```powershell
npm uninstall -g expo
```

Then restore the project dependencies:

```powershell
npm install
```

Restart Expo:

```powershell
npx expo start --lan --clear
```

### Missing Expo Executable

Check:

```powershell
Test-Path .\node_modules\.bin\expo.cmd
```

If it returns `False`, run:

```powershell
npm install
```

If still missing, check:

```powershell
npm config get bin-links
```

### Check Expo Dependencies

```powershell
npx expo-doctor
```

If version mismatches appear:

```powershell
npx expo install --check
```

### Mobile Cannot Load Data

1. Make sure Repo A Docker is running.
2. Connect your phone and laptop to the same Wi-Fi.
3. Test the Laravel API using your phone browser.
4. Check the API URL logged by Expo.
5. Restart Expo with `npx expo start --lan --clear`.

### Website Shows 502 Bad Gateway

Check the backend status:

```powershell
docker ps
```

If necessary, inspect the Nginx and Laravel logs:

```powershell
docker logs apakhabar-docker-web-1 --tail 50
docker logs apakhabar-docker-app-1 --tail 50
```

### Docker Cannot Start

Make sure Docker Desktop is open and shows **Engine running**.

Then restart Repo A using the normal startup command.

## 8. Important Notes

- Repo A runs Laravel, MariaDB, and backend services through Docker.
- Repo C runs the mobile app using Expo.
- XAMPP and `composer run dev` are not required when using Docker.
- Local LAN IP detection does not apply to deployed production APIs.
- When deploying to Azure, configure `EXPO_PUBLIC_API_BASE_URL` with the real HTTPS API URL.
- Never upload passwords, API keys, or private `.env` credentials to GitHub.
- Do not delete Docker volumes when troubleshooting.

## Profile photos

Use **Edit Foto Profil** on the profile page to select and crop a gallery image.
Confirmed crops and photo removal save immediately using the existing authenticated
Laravel service, without a separate Save action. Missing photos show the first
letter of the user's name. Photos are public on
profiles and existing comments/replies. Refresh or reopen the comment sheet after
a photo is changed on another device.

The API accepts JPEG, PNG and WebP up to 5 MB and 4096 pixels per side. Repo A must
deploy the profile-photo API and its additive migration (see Repo A
docs/profile-photos.md). No database reset or new storage volume is needed.

expo-image-picker is installed for the current Expo SDK. Expo Go includes it.
Rebuild custom development/standalone apps to include the native module and app.json
gallery configuration; camera and microphone permissions are disabled.
