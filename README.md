# ApaKhabar Mobile App (Repo C)

## 1. Project Overview

ApaKhabar Mobile is built with Expo and React Native. It fetches news, broadcasts, comments, likes, and other data from the Laravel backend.

The backend runs through Docker in Repo A. The mobile app does not need Docker installed separately.

## 2. Requirements

- Node.js and npm.
- Expo Go (if compatible) or an Expo development build.
- Docker Desktop and Repo A only when running the backend locally.
- Phone and laptop connected to the same Wi-Fi for local testing.

## 3. Start Laravel Backend (Repo A)

Open Docker Desktop, then run from the Laravel repository:

```bash
cd "C:\Testxampp\htdocs\ApaKhabar-Intelligence-Information-News-Management-System"
docker compose --env-file deployment/.env -f deployment/compose.yaml -f deployment/compose.lan.yaml up -d --no-build
```

The LAN override allows your phone to connect to Laravel on port `8088`. This command assumes Repo A's Docker environment and images are already set up.

## 4. Configure Mobile API

The mobile app's root `.env` currently uses:

```ini
EXPO_PUBLIC_API_BASE_URL=http://192.168.68.54:8088/api
```

`192.168.68.54` is the laptop's Wi-Fi IP address and may change. Find the current address with:

```powershell
ipconfig
```

Look for **IPv4 Address** under the **Wi-Fi** adapter. If it changes, update the IP in the mobile `.env` URL, keeping `:8088/api`. Also update `LAN_IP` in Repo A's `deployment/.env` and rerun the backend startup command.

Restart Expo after changing the URL.

## 5. Start Mobile App (Repo C)

Run from the mobile repository:

```powershell
cd "C:\Testxampp\htdocs\ApaKhabar-Mobile-App"
npx expo start --lan --clear
```

On first setup, run `npm install` in this directory before starting Expo.

Scan the terminal's QR code using Expo Go if it supports this project's Expo SDK, or open it with a compatible installed development build.

## 6. Check API Connection

Before opening the mobile app, open this URL in your phone's browser:

[http://192.168.68.54:8088/api/news](http://192.168.68.54:8088/api/news)

If JSON news data appears, your phone can reach the Laravel API. Use the current Wi-Fi IP if it has changed.

If it does not load, check that Docker is running, both devices use the same Wi-Fi, and Windows Firewall allows port `8088` on your private network.

## 7. Common Commands

Start Expo from Repo C:

```bash
npx expo start --lan --clear
```

Stop Expo: press `Ctrl + C` in its terminal.

Check Docker status from Repo A:

```bash
docker compose --env-file deployment/.env -f deployment/compose.yaml -f deployment/compose.lan.yaml ps
```

Stop Docker services from Repo A:

```bash
docker compose --env-file deployment/.env -f deployment/compose.yaml -f deployment/compose.lan.yaml stop
```

## 8. Azure Deployment

After deploying Laravel to Azure, replace the local Wi-Fi URL with your Azure HTTPS API URL:

```ini
EXPO_PUBLIC_API_BASE_URL=https://YOUR_APP.azurewebsites.net/api
```

Set this value in the mobile build environment for deployment. Restart Expo for local testing, or rebuild the deployed app to apply the change.

The mobile app remains separate from Docker and connects to Laravel through the internet.
