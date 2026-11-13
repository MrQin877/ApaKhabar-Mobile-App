# Repo A mobile Shorts API support

The mobile app works with existing public browsing/comments APIs. Full chronological ordering, persisted like state, video likes, and view counting require the accompanying Repo A patch. Browser session endpoints cannot safely substitute for bearer APIs.

The accompanying `repo-a.patch` has been applied to the local Repo A with workspace approval. For another checkout, run `git apply --check --ignore-space-change` followed by `git apply --ignore-space-change` from Repo A. No database migration is required. Existing website routes and popular-video ranking are preserved. Run Repo A's ShortViewerTest and ShortEngagementTest plus mobile API integration tests against the configured database before release.

Configure optional `EXPO_PUBLIC_SHORTS_PUBLIC_URL` to the public HTTPS website origin (without `/shorts`). Without it sharing sends the title and description only.

Physical phone checks: iOS/Android media loading over LAN, audio/autoplay, rapid swipes, pause overlays, background/foreground, switching tabs, safe areas, rotation, dark mode, keyboard/replies/guest quota, native sharing, network recovery, server view deduplication, and authenticated like persistence. Rebuild a development client when required by expo-video.
