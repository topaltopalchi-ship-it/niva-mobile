# Niva Android-first, local-only implementation plan

Status: product direction confirmed; engineering work must still pass the release gates below.

## Confirmed product decisions

- First real-message platform: Android only.
- Product goal: a complete SMS handler, not a notification scraper or read-only shortcut.
- Message bodies, sender addresses, imported conversations, classification results, and user feedback stay on the device.
- No Supabase, cloud sync, remote analytics, ad SDK, or server-side message processing for SMS content.
- Users explicitly choose Niva as the Android default SMS app before SMS permissions or provider access are requested.
- Importing existing messages is a separate, informed, opt-in action.
- No automatic send, delete, or carrier-level block action.

## Current repository baseline

- Expo SDK 58 / React Native 0.88 / TypeScript.
- The app currently displays seeded sample conversations and persists app state in AsyncStorage.
- `src/native/sms/SmsBridge.ts` is only a fail-closed TypeScript contract.
- There is no `android/` native project, Kotlin SMS module, SMS manifest contract, encrypted message database, or device-level SMS implementation.
- AsyncStorage is not encrypted and must not be used for real SMS bodies, sender addresses, or other sensitive message content.

## Target architecture

### 1. Android SMS role and native handler

Implement a Kotlin native module and the complete Android default-SMS-handler contract. The app must:

1. Explain the role and why it is needed before opening the system role chooser.
2. Request `RoleManager.ROLE_SMS` on supported Android versions and handle supported older versions deliberately.
3. Declare and implement the required SMS/MMS intent filters, receive/deliver flows, compose/send flow, and sent/delivery status handling.
4. Re-check role ownership and runtime permissions inside every sensitive native operation; JavaScript checks are only UI hints.
5. Disable provider access immediately when the role or permission is lost.
6. Handle cancellation, denial, revocation, no telephony hardware, malformed intents, and process restarts as safe unavailable/error states.

Do not add restricted SMS permissions as placeholders. Add them only with a complete, testable default-handler implementation and a Play policy review.

### 2. Consent and import

- Keep the sample inbox visibly separate from device SMS.
- Show a plain-language explanation of what will be imported and where it will be stored.
- Require a separate affirmative import action after Niva is the active default handler.
- Import in bounded pages with progress, cancellation, retry, and stable provider-ID deduplication.
- Never silently import or upload message content.

### 3. Encrypted local data

Before real-message import is enabled:

- Select a maintained encrypted SQLite/SQLCipher implementation compatible with the chosen Expo prebuild/bare workflow and current Android toolchain.
- Store database keys using Android Keystore-backed key management; define key rotation, loss, reinstall, and backup-exclusion behavior.
- Keep message bodies, sender addresses, and conversation records out of AsyncStorage, logs, crash reports, clipboard, and telemetry.
- AsyncStorage may hold only non-sensitive UI preferences after review.
- Exports containing messages must be explicit, clearly warned, and initiated by the user.
- Provide a verified delete-all flow that removes the encrypted database and its key material.

Do not claim encryption until the selected library, key handling, backup behavior, and on-device tests have been reviewed.

### 4. Local classification and blocking language

- Run categorization and warning rules entirely on-device.
- Explain matched signals; do not present keyword results as a fraud verdict.
- Require user action to change a category or mark a sender as blocked.
- Label app-local filtering accurately. Do not claim carrier or system-level blocking unless a separately supported Android capability is implemented and tested.

## Delivery milestones and acceptance gates

### Milestone A — Native foundation
- Confirm Expo prebuild strategy and generate/maintain Android project files.
- Implement Kotlin module registration and typed bridge.
- Implement role request and authoritative capability re-check on activity resume.
- Add native unit tests for role granted, denied, cancelled, revoked, unsupported device, and permission changes.

### Milestone B — Complete SMS handler
- Implement required SMS/MMS intent filters and receive/deliver handling.
- Implement conversation compose/send and sent/delivered status.
- Test multipart SMS, malformed payloads, no-SIM/no-telephony cases, process death, and duplicate delivery.
- Verify Android version compatibility and default-handler eligibility.

### Milestone C — Secure local storage and import
- Integrate reviewed encrypted database and Keystore-backed key lifecycle.
- Add consent-first, paginated, cancellable, idempotent import.
- Add local search, conversation threading, and safe deletion.
- Prove no message content enters AsyncStorage or network requests.

### Milestone D — Release readiness
- Add emulator and physical-device integration tests.
- Run typecheck, unit tests, Android lint, and release build in CI.
- Complete Google Play restricted-permission declaration and privacy disclosures.
- Verify app behavior after default-role revocation and app upgrade.

## Definition of done for first real-SMS release

Niva is not ready to advertise real SMS support until all of these are true:

- It is a complete default SMS handler on the supported Android versions.
- The system confirms the default role before any restricted SMS operation.
- Import is separate and explicitly consented to.
- Message content is stored only in the reviewed encrypted local database.
- Read/send/import fail closed after role or permission revocation.
- Incoming, outgoing, multipart, delivery, restart, and error paths pass device tests.
- No SMS body, sender address, or contact data is sent to a backend or telemetry service.
- Store policy and privacy disclosures are complete.

## Official platform references

- Android default handlers: https://developer.android.com/guide/topics/permissions/default-handlers
- Android RoleManager: https://developer.android.com/reference/android/app/role/RoleManager
- Google Play SMS and Call Log permissions policy: https://support.google.com/googleplay/android-developer/answer/10208820
