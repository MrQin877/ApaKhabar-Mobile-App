# Mobile integration audit ? 12 November 2026

## Testing status

The active Expo frontend type-checks and its contract/regression checks pass. Live Laravel records, login credentials, network access from a phone, and device keyboard/gestures have NOT been verified. The backend and database were stopped during this audit. No services were started and no production/application records, schema, Laravel routes, or moderation rules were changed.

## Actual local setup

- Mobile checkout: `C:\Testxampp\htdocs\ApaKhabar-Mobile-App`.
- Laravel checkout: `C:\Testxampp\htdocs\ApaKhabar-Intelligence-Information-News-Management-System`.
- Laravel `.env`: `APP_ENV=local`, `APP_URL=http://localhost:8000`, `DB_CONNECTION=mysql`, `DB_HOST=127.0.0.1`, `DB_PORT=3306`, `DB_DATABASE=apakahbar`, `DB_USERNAME=root`. Credentials are not included in this report.
- Database/session/cache configuration: MySQL, file sessions, file cache, database queues. No cached Laravel configuration file exists.
- Both `C:\xampp` and `C:\Testxampp` are installed. Their respective MySQL configurations point to different data directories, both on port 3306. The `apakahbar` database directory, including news/comments/broadcasts/users table files, exists in **`C:\xampp\mysql\data`**. It was not found in `C:\Testxampp\mysql\data`.
- No PHP, Apache/httpd, or MySQL/mysqld processes were running. No listening sockets were found on ports 3306 or 8000. The separate Windows service `MySQL94` is stopped.
- A direct PDO connection using the existing Laravel configuration failed with MySQL error 2002. Table files establish that a database directory exists, not that its records or migrations are currently usable.
- Docker CLI is installed, but the Docker Desktop Linux engine is unavailable. The existing Compose files run shorts workers and LibreTranslate; they do not define the primary Laravel/MySQL setup.
- `php` on PATH is `C:\xampp\php\php.exe`, PHP **8.2.12**. The installed vendor tree loads Laravel **12.56.0**, and its current Composer platform check accepts PHP 8.2. However, **composer.lock requires PHP 8.4.1+** through locked Symfony packages. Installed vendor versions differ from the lockfile. Use a compatible PHP runtime before reinstalling dependencies; do not update the lockfile just to bypass this discrepancy. `C:\tools\php` contains no alternative PHP executable.

## Startup answers

1. Open **`C:\xampp\xampp-control.exe`** and start its **MySQL** for the existing database. Apache is unnecessary when using this repository's PHP development server. Use the installation containing `apakahbar`.
2. Preserve the existing **`composer run dev`** workflow. In the Laravel PowerShell terminal:

   ```powershell
   Set-Location "C:\Testxampp\htdocs\ApaKhabar-Intelligence-Information-News-Management-System"
   $env:SERVER_HOST = "0.0.0.0"
   composer run dev
   ```

   The installed Laravel `ServeCommand` reads `SERVER_HOST` as its default host option. `composer run dev` calls the existing `scripts/serve.php`, which inherits that environment and starts Artisan. This makes the same server reachable on the LAN, preserving the existing Vite, queues, scheduler, routes, and database configuration. Verify that its printed backend port is 8000. Do not start a second Artisan server alongside it.

3. From the mobile directory:

   ```powershell
   Set-Location "C:\Testxampp\htdocs\ApaKhabar-Mobile-App"
   npx expo start --lan --clear
   ```

4. Connect phone and laptop to the same Wi-Fi. Verify `http://YOUR_LAPTOP_IP:8000/api/news` on the phone. Keep Laravel listening on `0.0.0.0`; allow the connection through the existing firewall configuration if it is blocked. No firewall settings were changed during this audit.

## API map checked against Laravel routes and implementations

All paths below are relative to the configured `/api` root.

| Area | Existing endpoint | Integration |
| --- | --- | --- |
| News | `GET /news` | Full active feed, latest first, supports `category`; direct array response |
| Detail/comments | `GET /news/{id}` | `{ data: article }`, numeric `comments`, flat `comments_list` with `parent_id` |
| Related | `GET /news/{id}/related` | Existing compact endpoint; detail UI instead takes three other posts from the full latest feed to retain counts/metadata where available |
| Categories | `GET /categories` | `{ categories: [{ name, ... }] }` |
| Emergency broadcast | `GET /broadcasts/darurat` | Only sent, unarchived emergency broadcasts from the last 24 hours; `{ message: "title: message" }` or `{ message: null }` |
| Like | `POST /news/{id}/like` | Bearer token; response `{ liked, likes_count }` |
| Comment | `POST /news/{id}/comment` | Bearer token; `{ content }`; server moderation/status applies |
| Reply | `POST /comments/{id}/replies` | Bearer token; `{ content }`; server moderation applies |
| Report | `POST /comments/{id}/report` | Bearer token; existing reason/category validation and role restrictions |
| Notifications | `GET /notifications` | Bearer token; `{ notifications, role }` |
| Read status | `PATCH /notifications/{id}/read`, `PATCH /notifications/read-all` | Existing user-scoped backend operations |
| Profile | `GET /profile`, `PATCH /profile` | Bearer token; existing backend profile validation |
| Login/register | `POST /login`, `POST /register` | Existing email/phone/password contracts and token/user response |
| Logout/push | `POST /logout`, `POST /push-token`, `DELETE /push-token` | Existing authentication and push registration |

There is no keyword-search endpoint or keyword handling in `NewsController::index`. Carian intentionally continues searching the real full feed locally. Category/date/keyword predicates combine, results are deduplicated, and the shared five-minute cache avoids requests for each chip or keystroke. Pull-to-refresh forces a reload. Date filtering uses `Asia/Kuala_Lumpur`, matching `config/app.php`, and supports the current `d F Y` API dates. Unknown dates are excluded from restricted date views.

## Fixes made in this audit

- Fixed Android/web SF Symbol mapping types and the unified icon wrapper. Scoped root TypeScript/ESLint checks to the actual root application; `apakhabar-mobile` is a separate nested template with its own package, entry point, and dependencies.
- Fixed Laravel storage image URL handling: storage prefixes are not duplicated, and local/private storage URLs are rewritten to the phone-reachable API origin. External image hosts remain external.
- The detail like button now uses the authenticated POST's actual `liked` and `likes_count` response. A public detail refresh no longer immediately erases a successful like/unlike state. It also recognizes `liked_by_user` when provided.
- Read the actual legacy broadcast response shape and extract its title/message. Broadcast detail navigation is explicitly marked as a broadcast and never calls notification read APIs with its local navigation identifier. Its full available text remains accessible even though the API has no individual broadcast-detail identifier.
- Corrected broadcast/notification detail warning colours for dark mode and safely handle unknown notification types.
- Home categories now come from the category/news responses instead of inserting screenshot category names absent from Laravel data.
- Added timeouts to news, category, detail, and emergency-broadcast reads so failed local connections reach the UI error states.
- Restored startup routing for saved sessions to News. Existing pending-email-registration gating stays in the tabs layout, and protected API operations still validate tokens server-side.
- Fixed shared toast/welcome animation initialization for the enabled React compiler. Stabilized toast callbacks. Appearance-storage failures now leave a usable system/session theme.
- Updated stale authentication test fixtures for the current platform and appearance dependencies. Existing login concurrency, push setup isolation, and 401 session-expiry checks pass.

## Comments, navigation, themes, and data review

- Comments are retrieved through the existing detail endpoint, including published replies. The sheet threads `parent_id`, preserves guest display identities, hides orphan/cyclic branches, and uses the backend's published count.
- Accepted submissions refresh the authoritative list/count; `pending_review` comments are not inserted into the public list. Error/quota/throttle responses are shown without clearing the typed draft. Mobile comment/reply/report routes require authentication; no website guest challenge or quota mechanism was bypassed.
- Comment likes have a website route but no mobile API route. The sheet therefore offers no unsupported like request. Reporting uses the existing mobile API.
- News routes share a nested stack: Homepage ? Terkini ? Carian ? Detail. Search, category, date parameters and the mounted filter state remain in place when returning from Detail. News-card comment buttons open Detail with the sheet requested.
- Sheet dismissal is wired to the Tutup button, backdrop, header/handle downward gesture, and Modal system-back handler. iOS uses keyboard padding. The installed React Native Android Modal implementation sets `SOFT_INPUT_ADJUST_RESIZE`, and Expo config also specifies `softwareKeyboardLayoutMode: resize`. These are code/configuration checks, not device verification.
- Redesigned pages and sheet use the resolved persisted/system theme. Root loading and warning detail views were included in the review. Screen sizes, keyboard visibility, scroll gestures, and contrast still need a physical-device check.
- No active redesigned page imports `constants/newsData.ts`. That file still contains unused sample constants. The nested sample application is not the root app entry. The active news feed, comments, broadcasts, likes, notifications, and profiles use existing APIs. Device bookmarks are local preferences, not fabricated server data. Existing backend placeholder-image URLs may still appear when a stored image is missing.

## Backend limitations that remain

- `NewsService::listNews` currently hardcodes each item's `comments` to `0`. List/home/related count chips therefore cannot reflect actual comment totals using that response. Detail comment counts are real. No per-row detail-request workaround was added.
- The list/detail payloads omit the article author and precise creation/publication timestamp. The UI can show them when provided, and otherwise displays the real publication date. It cannot truthfully reproduce author names or minutes-ago labels missing from the API.
- Public `GET /news/{id}` has no `ApiAuth` middleware. A bearer-only mobile request therefore does not establish the viewer through the same mechanism as the protected POST routes. Initial `liked_by_user`/`reported_by_user` values may not represent the mobile user. The authenticated like POST works around the immediate UI update, but reliable initial viewer state needs a deliberate backend authentication adjustment.
- Emergency broadcast output has no broadcast ID, separate title, time, or notification ID. The frontend displays the available text; it cannot fetch an unavailable record-specific detail endpoint or manufacture the missing metadata.
- These limitations are in existing Laravel responses/authentication configuration. They were documented rather than changing backend business/authentication behavior during a frontend audit.
- A moderation key is configured, but its validity/connectivity was not tested. Existing behavior keeps comments pending review when moderation is unavailable.

## Verification completed

```powershell
node node_modules/typescript/bin/tsc --noEmit --pretty false
node node_modules/eslint/bin/eslint.js app components hooks context services constants utils --quiet
node scripts/auth-regression.test.cjs
node scripts/news-detail-regression.test.cjs
node scripts/news-filters-regression.test.cjs
node scripts/news-comments-regression.test.cjs
node scripts/mobile-integration-regression.test.cjs
php scripts/backend-readonly-audit.php
```

TypeScript and ESLint's error check pass for the active root app. Existing non-blocking lint warnings remain. All five regression scripts pass; their controlled fixtures test client contracts and state logic, not live database data. The PHP audit is read-only, omits credentials, and currently reports database unreachable (2002).

After starting services, still verify real login/profile/notifications, published comments/replies, an authenticated like/unlike, accepted versus pending comment submission, existing emergency broadcast visibility, three latest other articles, both themes, return-navigation filter state, and keyboard/swipe/system-back on an actual phone. Do not treat the code checks as end-to-end certification.

## Follow-up: existing website-to-mobile data path

Rechecked on 12 November 2026; the read-only database check still reports connection error 2002 and no running database/backend was observed. No additional application/backend integration code was changed during this follow-up.

- `NewsWorkspaceController::publish` creates a `News` row with `status = active` and the draft's title, content, category, and image when **Website** is selected. It records `published_news_id` on the draft to prevent duplicate publication. A saved draft or social-only publication does not create a mobile news entry.
- Both website `/news` and mobile `/api/news` route to `NewsController::index`, which uses `NewsService::listNews` and `News::active()`. There is no separate mobile news database or synchronization job.
- Actual changes to a published `News` row are read on the next API request. Category labels are resolved through the same `NewsCategory` relation, so category renames are read from the shared data. The manual editor currently restricts edits to active drafts; saving a draft is not an update to an already published article.
- Mobile feed/category responses are cached for five minutes. Pull-to-refresh fetches immediately, returning to a stale focused news screen reloads, and accepted mobile engagement submissions invalidate the feed cache. An idle screen does not poll continuously. This is the current refresh behavior, not a second publishing mechanism.
- Website and mobile comment/reply/like routes call the same controllers and `InteractionService`. Comments remain subject to the same publication/moderation rules and write to the same tables. Public article reads return published comments/replies. The existing list-count and bearer-viewer-state limitations described above still apply.
- The homepage emergency banner uses the same sent/unarchived/last-24-hours rule as the existing public endpoint. Other announcements are read through the authenticated user's notifications.

### Phone test after startup

1. Start MySQL from `C:\xampp\xampp-control.exe`, then start the two terminals above. Keep them running. Open the website at `http://localhost:8000`.
2. Run `ipconfig` and find the laptop Wi-Fi IPv4 address. On the phone, open `http://YOUR_LAPTOP_IP:8000/api/news`. Check that this returns JSON before diagnosing Expo UI problems. Expo's tunnel does not expose Laravel.
3. Open Expo Go and scan the LAN QR code. The mobile `.env` API override is blank, so Expo's LAN host is detected automatically. If this fails, set `EXPO_PUBLIC_API_BASE_URL=http://YOUR_LAPTOP_IP:8000/api` in the mobile `.env` and restart Expo. The phone must not use `localhost` for the laptop backend.
4. With a post you intend to publish, select Website in the admin publishing form. Verify its ID/title in `/api/news`, then pull-to-refresh the mobile feed and open it. Avoid publishing a throwaway item to a live audience purely for a smoke test.
5. Check an intended category rename or legitimate published-record update in the same way. Clearing an old category-name filter may be necessary after a rename.
6. Like/unlike the same article with the same account on each client, refreshing the other client before comparing counts. Website and mobile must both be authenticated as that account. Initial mobile heart-state limitations are documented above.
7. Submit an intended comment/reply. If the response is pending review, approve it through the normal moderation workflow before expecting it on either public client. Open/refresh the mobile comments sheet and reload the website. Compare article-detail counts, since the existing list payload hardcodes comment totals to zero.
8. Test an intended emergency broadcast meeting the endpoint's category/status/age rules; refresh the mobile homepage. Test other announcements through Notifikasi using the appropriate recipient account.

These are manual live checks to perform after services start. They have not been represented as completed in this report.
