# Mobile role parity implementation

Updated 14 October 2026. Continues the source audit in `../TALEEM360-APP-FEATURE-GAPS.md`. The institution desktop work was preserved; this implementation targets Taleem360-App and the matching backend APIs.

## Completed changes

| Role | Audited gap | Implemented |
| --- | --- | --- |
| Student | Online tests response mismatch | Reads `{ tests, nextCursor }`, displays tests, loads older pages. |
| Student / Parent | Fee payments | Shared fee screen, destination account selection, partial payments, signed receipt upload including `overwrite`, required payment account ID and child scope. |
| Student / Parent | Fee history and details | Separate active/paid pagination, global balances, one-time labels, paginated invoice items and verified receipts, rejection notes and pending-verification state. |
| Student | Assignment history | Cursor pagination for older assignments. |
| Student | Identity documents | ID verification QR, principal signature, front/back printing and PDF sharing. |
| Student | Official transcript | Institution branding, student identity, marks, grading reference, signature, printing and PDF sharing. Graduate transcripts obtain identity directly from the transcript API, without requiring ID-card access. |
| Student | Promotion results | Promoted, retained and graduated notices with persisted acknowledgment, on both active and graduate dashboards. |
| Teacher | Announcements | Assigned class/section broadcasts, sent-message history and received-message pagination. |
| Teacher | CSV marks | Roster CSV download, multipart upload and explicit overwrite selection. |
| Teacher | Assessment publication | Publish saved teacher-created results through the existing server action, enforcing author, assignment and complete-roster checks. Manual saving stays on the screen so publication remains accessible. |
| Teacher | Hosted-test review | Summary counts, separate test-detail and submission-answer requests, answer review and short-answer grading. |
| Teacher | Older work | Hosted-test and assignment pagination, including the assignment API's nested `page.nextCursor` contract. |
| Teacher | Streaming settings | Personal Bunny/Mux credentials, verified saving, institution override display and credential removal. |
| Student / Teacher | Older announcements | Paged access to the server's visible announcement history. Existing notification-summary requests retain their original limit. |
| Parent | Academic results | Assessment-type filters, result pagination, existing period controls, average and best subject percentages. |
| Parent | Student record | Login ID, guardian, gender, age, joining year, academic status, phone and guardian email. |
| Parent | Homework attachment | Reference filename display. |

Shared transport now supports authenticated raw responses (CSV) and multipart requests without a JSON content-type header. Backend request-scoped sessions accept verified mobile bearer tokens and retain fresh account checks. An invalid bearer cannot fall back to cookie authentication. Shared modals have bounded scrolling space and iOS keyboard avoidance.

## Verification already completed

- App and backend TypeScript checks: passed.
- `Taleem360-App`: `npm run verify:mobile` — 16 browser workflow scenario groups passed, no uncaught browser exceptions. Runs actual screen components and API transport against deterministic fixtures at a phone-sized viewport; native picker/storage/printing boundaries are mocked.
- `lms-backend`: `npm run verify:mobile` — 9 scenario groups passed against disposable PostgreSQL (PGlite), including CSV overwrite/publication, teacher ownership, parent child access, payment limits/account selection, nested cursors, transcript identity and signed bearer authentication. External notifications/cloud storage are mocked; production data is untouched.
- Existing backend `npm run verify:roles`: 55 permission cases, 46 direct API cases and 16 integration groups passed.
- Expo export: Android/iOS Hermes and web bundles, including 94 static routes, built successfully.
- App lint: zero errors; existing unused-import/hook-dependency warnings remain in the project.

Browser test evidence is in `.codex/mobile-parity/results.json` and `.codex/mobile-parity/parent-fees-mobile.png`. Generated bundles are in `.codex/export`. These generated artifacts are intentionally ignored by Git. The browser runner uses Edge (override `BROWSER_BIN`) and the sibling backend's esbuild dependency.

## Release boundary

Source fixes are implemented locally. They have not been deployed or installed on a physical phone. Release the matching backend changes and build a new mobile binary: `expo-print` and `expo-sharing` add native modules, so an update to an old binary alone is insufficient. Expo export warned that the local `google-services.json` is absent; the existing Firebase configuration must be supplied by the normal native-build environment. No placeholder credentials were created.

Physical-device printing, OS share sheets and a real cloud receipt upload still need release-environment verification. The checks above do not claim those external/device operations were exercised.

## Continuation note

Do not reimplement the table above or reinstall dependencies. The fixes and regression scripts are already present. A future release task should start from the current working-tree changes and these verification results.
