# News comments and Likes verification

Verified 13 November 2026 against this working tree and local Repo A at
`../ApaKhabar-Intelligence-Information-News-Management-System`.

## Comments

- Mobile stores an opaque guest credential, not a daily counter. Laravel's
  `GuestCommentIdentity::submit` locks the identity record and enforces three
  accepted submissions per day across all News, Shorts, comments and replies.
- The backend resets the day at Asia/Jakarta midnight. Validation failures,
  duplicate comments and failed saves do not consume quota. Accepted submissions
  awaiting moderation do consume quota.
- A fourth otherwise valid request returns 422 with
  `guest_comment_quota_exceeded`. The sheet opens the existing dialog only for
  that error; throttling and other validation errors do not open it.
- “Log masuk” closes the sheet and opens login with an article/comments return
  destination. “Kekal sebagai tetamu” dismisses the dialog while retaining the
  draft and published thread. Neither resets or bypasses the server quota.
- News submissions and replies use Repo A's CommentController, InteractionService
  and CommentModeration; Shorts use ShortEngagementController and the shared
  guest identity/quota service. Authenticated submissions bypass the guest quota
  and retain backend validation, moderation and rate limiting.
- After submission, the mobile sheet refetches the server's published list and
  count and updates the detail count. Feed data is invalidated. Pending comments
  correctly remain absent from public counts.
- Shorts submission helpers exist in Repo C, but no Shorts screen was found.
  Shared quota is verified through Laravel API tests and mobile service tests;
  there is no mobile Shorts UI to exercise in this checkout.

## Likes

- Guests cannot Like News: the mobile API route requires ApiAuth, and the website
  likewise requires authentication. Registered users can toggle Like/Unlike.
- Both clients use PostLikeController and InteractionService with the same
  `likes` table. The backend locks the News row, counts actual Like records and
  enforces a unique `(postID, userID)` database constraint.
- Mobile uses shared card/detail state, optimistic feedback, server-authoritative
  confirmation and rollback on failure. Concurrent taps share one in-flight
  request. Old fetches and responses from previous sessions cannot overwrite a
  confirmed mutation. Like POSTs are not automatically retried.
- List/detail GETs include per-user liked state and actual counts. A fresh app
  load hydrates from those responses.

## Fixes in this verification

- Detail loading now runs on screen focus, so reopening an already-mounted
  article or returning from login refetches server engagement.
- Guest Like on the detail screen now opens login with an article return target,
  instead of reporting a generic update failure. The safe destination validator
  accepts concrete article routes with or without the existing comments query.
- Added callback-level regression coverage for refocus, guest login navigation,
  authenticated Like and network failure, plus destination validation assertions.
- No backend rules, quota logic or unrelated UI changed.

## Evidence

- Laravel: MobileGuestCommentsTest, EngagementTest and PublicEngagementCountsTest:
  **39 passed, 326 assertions**, using isolated in-memory SQLite and mocked AI
  HTTP responses. Initial sandbox log/cache failures disappeared on the approved
  unrestricted run.
- Mobile: guest-comments, news-comments, news-likes, news-detail and the new
  news-engagement-focus regression scripts all passed.
- `npx tsc --noEmit`: passed.
- Running API at `http://localhost:8088/api`: News list returned 18 items. For
  News 19, list/detail both returned one Like and one published comment, with
  `liked_by_user: false`. Unauthenticated Like POST returned **401**.
- No live comments or authenticated Likes were created in the running database;
  mutation behavior was exercised in isolated Laravel tests.

## Physical phone and live service checks remaining

1. On LAN, submit three distinct valid guest comments/replies, then a fourth;
   confirm the native dialog, draft retention and both buttons, including return
   to the article with comments open after login.
2. Check guest credential and signed-in Like state after fully closing/reopening
   the app; check Like/Unlike across cards, detail, refresh and website.
3. Check keyboard, bottom sheet and dialog layering on Android/iOS, and rapid
   taps or temporary network loss.
4. Verify real AI service availability and resulting publication/pending status.
   The test suite validates the workflow and failure handling, not live AI uptime.

Browser and phone guest identities are independent unless they use the same
credential; shared quota means all resources for a given backend guest identity,
not automatic identification of one person across devices.
