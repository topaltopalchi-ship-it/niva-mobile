# Native Android SMS module contract

Status: implementation specification only. This repository does not yet contain a Kotlin SMS module or Android application directory. The TypeScript bridge is a fail-closed boundary, not a working SMS integration.

## Module identity

- React Native native module name: `NivaSms`
- Android implementation language: Kotlin
- Supported platform for this milestone: Android only
- The native module must not expose message bodies until Niva is the active default SMS handler and the user has explicitly opted in to import.

## TypeScript-facing API

The current bridge expects:

```ts
type NativeSmsModule = {
  getCapability(): Promise<unknown>;
  requestDefaultHandler(): Promise<boolean>;
};
```

`getCapability()` must resolve to one of these payloads:

```json
{ "status": "not-default-handler" }
```

or

```json
{
  "status": "default-handler",
  "canRead": true,
  "canSend": true
}
```

The JavaScript normalizer intentionally accepts only literal boolean `true` for each capability. Missing, malformed, or unknown fields must never grant access.

`requestDefaultHandler()` may return true only when the Android role request flow was accepted by the system. The app must always call `getCapability()` again after the activity resumes; the request result itself is not proof that Niva currently owns the role.

## Android role and manifest requirements

Before requesting restricted SMS permissions, implement the complete default SMS handler experience and verify current Android requirements. The final app must:

1. Declare the SMS-related intent filters and components required by the Android default-handler contract.
2. Use `RoleManager.ROLE_SMS` on supported Android versions and handle devices/versions that require a compatible fallback.
3. Re-check role ownership whenever the app resumes and before every read/send operation.
4. Stop SMS provider access immediately when the role is lost.
5. Request only the permissions required for the feature, after the user chooses Niva as default and after explaining the reason.
6. Handle cancellation, denial, role revocation, missing telephony hardware, and runtime exceptions as unavailable states.

Do not copy a partial manifest from an example and claim default-handler compliance. Validate against the current Android documentation and test on supported OS versions.

## Planned native methods after the role flow exists

The next API revision may add:

- `requestImportConsent()`: explicit in-app consent before importing existing messages.
- `listConversations(cursor, limit)`: paginated metadata, with bounded page size.
- `listMessages(conversationId, before, limit)`: paginated messages.
- `sendSms(address, body)`: send through the platform's supported SMS flow and return a message identifier/state.
- `getCapability()`: authoritative role and permission state.

Every method that reads or sends must independently re-check role and permissions in Kotlin. Never rely only on a JavaScript-side check because state can change between check and operation.

## Data and privacy requirements

- Keep message content on-device; no analytics, crash logs, or telemetry may contain message bodies, phone numbers, OTPs, or contact names.
- Do not store real SMS bodies in AsyncStorage.
- Use Android Keystore-backed encryption for locally persisted message content and define backup exclusions/key-loss behavior before implementation.
- Treat exported JSON as sensitive; require an explicit user action and warn before sharing.
- Keep import opt-in, cancellable, paginated, and idempotent. Deduplicate using stable provider identifiers where available.
- Do not implement carrier-level blocking claims. Any filtering in Niva is an app-local view unless a supported OS API explicitly provides more.

## Acceptance tests

- Native module missing: bridge returns `native-module-missing`.
- Non-Android: bridge returns `unsupported-platform`.
- Role not held: both read and send remain disabled.
- Role request cancelled: capability remains unavailable.
- Role granted: capability is re-queried and reflects actual permissions.
- Role revoked after launch: next read/send fails closed.
- Malformed native payload: no capability is granted.
- No telephony feature: app presents a useful unsupported-device state.
- Import declined: no existing message content is read.
- Send failure: UI never marks the message as sent.

## References

- Android default SMS handler: https://developer.android.com/guide/topics/permissions/default-handlers
- Android RoleManager: https://developer.android.com/reference/android/app/role/RoleManager
- Google Play SMS and Call Log policy: https://support.google.com/googleplay/android-developer/answer/10208820
