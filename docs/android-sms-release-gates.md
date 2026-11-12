# Android SMS implementation: next engineering milestone

## What exists now

- The Expo application is still a sample-data prototype.
- `src/native/sms/SmsBridge.ts` defines a typed, fail-closed boundary for a future Android native module.
- On iOS/web, the bridge reports `unsupported-platform`.
- On Android without the native module, it reports `native-module-missing`.
- A native bridge error is treated as not-default-handler. It is never treated as permission granted.

This bridge does **not** read, receive, send, import, or delete SMS. No SMS permissions have been added to the manifest.

## Native implementation acceptance criteria

The Android native module must not be considered complete until all of these are met:

1. Implement the Android SMS role flow with `RoleManager.ROLE_SMS` on supported Android versions and a compatible fallback for older supported versions.
2. Implement the complete default SMS handler contract: SMS/MMS delivery intents, compose/send flow, sent/delivered status handling, and required manifest intent filters.
3. Verify the current role at every sensitive operation. Role loss immediately disables SMS provider access and import.
4. Request runtime permissions only after the user has explicitly selected Niva as the default SMS app and only for features that need them.
5. Import only after a separate, clear user opt-in. Explain the scope before importing and provide a cancellable progress state.
6. Keep message content on-device. Do not send SMS bodies, sender numbers, or contact data to analytics, crash reports, or a backend.
7. Replace plaintext AsyncStorage for message bodies with a reviewed encrypted storage design before importing real messages. Keep non-sensitive UI preferences separate.
8. Add tests for role granted/denied/revoked, incoming SMS, multipart SMS, MMS, outgoing SMS, send failure, permission revocation, and process restart.
9. Review Google Play's current restricted-permission policy and complete the declaration before any Play release.

## UI states required

- Not available on this platform
- Android native integration not installed
- Niva is not the default SMS app
- System role request cancelled or denied
- Niva is the default SMS app; import not yet enabled
- Import consent shown
- Import in progress / complete / failed
- Default role revoked; SMS features disabled

Never show a success state until Android confirms the role and the native module confirms the operation.

## Security invariants

- Never attempt indirect SMS collection through notifications, Accessibility services, backups, or another app's private data.
- Never silently switch the default SMS app.
- Never auto-send, auto-delete, or auto-block messages.
- Keep the existing seeded demo inbox visibly separate from imported SMS.
- Export files may contain sensitive message content; disclose this before sharing.
- A local block list is only an in-app filter until OS-level blocking is separately implemented and verified.

## Release gate

The current bridge is scaffolding only. Do not request SMS permissions or advertise real SMS support until the native implementation, device tests, privacy review, and Play policy review are complete.
