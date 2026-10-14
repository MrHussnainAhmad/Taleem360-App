# Mobile performance improvements — 2026-10-14

Implemented on top of the existing mobile parity work. No screen was removed. All 94 exported routes remain. Do not redo the parity implementation described in MOBILE-PARITY-IMPLEMENTATION.md.

## Changes, in priority order

| Priority | Change | Behaviour preserved |
| --- | --- | --- |
| High | Removed the two-second refresh gate, timers, and per-frame JS scroll handlers from ScreenShell and the shared refresh hook. | Existing refresh callbacks and indicators. |
| High | Virtualized student tests/submissions and teacher assignments/hosted tests. Bounded list viewports, stable record keys, modest render batches, proper row separators. | Filters, pagination, forms, submission expansion, attachments, grading, edit/delete and navigation. Expanded rosters inside an individual card still render together. |
| High | Repeated glass cards use lightweight translucent surfaces without blur or shadows. Real blur is opt-in on the shared glass header. Simple appearance is the default for new installs. | Saved appearance choices, theme settings, and every screen. |
| Medium | Tabs use a 120ms fade; native dialogs use the platform fade; glass press feedback scales to 98% over 90ms and returns over 120ms with no bounce. Login role indicator takes 160ms. | Navigation structure and form state; no route migration. |
| Medium | Shared OS reduced-motion subscription controls tabs, dialogs, login and press effects. | Preference changes take effect without restart. |
| Medium | Skeleton blocks share one native animation instead of one loop each. It does not hold an interaction handle and pauses when backgrounded or no visible skeleton needs it. | Existing loading layouts; reduced motion uses a static placeholder. |
| Medium | Load theme preferences alongside fonts, and restore stored user/brand in parallel. | Existing font families and weights, splash readiness, authentication and stored preferences. |
| Medium | Refreshing a student dashboard retains its snapshot. Teacher dashboard refresh retains loaded content on failure and prevents simultaneous duplicate loads. Parent cache has a 40-entry bound and rejects obsolete cache writes after clear/new refresh. | Existing cache TTLs and explicit refresh, account/child scoping. No global response cache added. |
| Size | Import only the five used font files and Ionicons directly rather than font/icon package barrels; remove unused expo-glass-effect dependency. | All used typography and icons; expo-blur and other used native features retained. |

## Measured export sizes

Compared the existing `.codex/export` baseline with `.codex/performance-final`. Decimal MB; unique assets listed in each platform's Expo export metadata plus its Hermes bundle. These are **not APK/IPA download or installed sizes**.

| Platform payload | Before | After |
| --- | ---: | ---: |
| Android assets | 11.33 MB | 2.25 MB |
| Android Hermes bundle | 4.15 MB | 3.81 MB |
| Android combined | 15.48 MB | 6.06 MB |
| iOS assets | 11.33 MB | 2.25 MB |
| iOS Hermes bundle | 4.15 MB | 3.81 MB |
| iOS combined | 15.49 MB | 6.06 MB |

Approximately **61% smaller exported native payload**, primarily from excluding unused fonts/icon families. Web JS also decreased from 2.33 MB to 1.90 MB. Native runtime and framework binary overhead are additional.

## Verification

- `npx tsc --noEmit` passed.
- `npm run lint` passes with zero errors; unrelated existing warnings remain.
- `npm run verify:performance` passed 21 browser scenario groups: the existing 16 parity workflows, live reduced-motion preference changes, and four 300-record list scenarios.
- Large-list checks use the real ScreenShell and React Native Web FlatList: bounded scrolling viewport, fewer than 100 initially rendered records, last record reachable, and a bounded mounted window after scrolling settles. Native service/graphics boundaries are fixtures. This does not measure native FPS.
- Android, iOS and web production bundle exports pass, with all 94 static routes retained.
- `git diff --check` passed; no tracked files deleted.

Reproduce the size comparison:

```powershell
npm run report:size -- .codex/export .codex/performance-final
```

## Release validation still required

A native rebuild is needed to reflect the removed native dependency. No APK/IPA was built or deployed in this task. The local Google services file remains absent; Expo export warns about `google-services.json`, as before. Do not replace it with dummy credentials.

Measure cold start, frame drops, peak memory and store download/install size on a modest Android device and an iPhone in release mode. Check native pull-to-refresh, keyboard/modal behaviour, rapid tab switching, long expanded rosters, exam timers, media playback and document sharing. No device-level speed/FPS gain is claimed from browser tests or export sizes.
