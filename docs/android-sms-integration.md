# Android SMS integration decision

## Status

The product direction is confirmed: Android-only first release, complete default-SMS-handler behavior, and local-only message content. The app remains a sample-data prototype. A separate encrypted-storage proof of concept exists, but no SMS permissions, SMS receiver, message-provider access, or native SMS module are implemented yet.

## Product decision required

A real SMS inbox on Android is a default-SMS-app product, not a lightweight read-only integration. Before implementing device access, Niva must be designed to qualify as a complete messaging handler: users must be able to receive, view, compose, and send SMS, and the app must correctly handle the Android SMS delivery and send flows.

On Google Play, SMS permissions such as READ_SMS, RECEIVE_SMS, SEND_SMS, WRITE_SMS, RECEIVE_MMS, and RECEIVE_WAP_PUSH are restricted. An app generally must be actively selected as the user's default SMS handler before it requests these permissions, and must stop using them when it loses that role. Play approval and a permissions declaration may also be required. Do not add these permissions as placeholders.

## Proposed implementation sequence

1. Complete and compile the existing Android Keystore-backed encrypted-store proof of concept; replace the single-file JSON design with a reviewed encrypted database before real-message import.
2. Implement and test the complete default-SMS-handler capability, including required intent filters and the Android role request flow (RoleManager.ROLE_SMS on Android 10+).
3. Add the native Android SMS provider and delivery implementation with runtime role/permission checks behind a typed React Native boundary.
4. Import messages only after the user explicitly opts in and Niva is the active default SMS handler. Provide clear empty, denied, progress, cancellation, and role-revoked states.
5. Keep classification on-device. Never upload SMS content for analytics, training, or advertising.
6. Keep real message content out of AsyncStorage; use only the reviewed encrypted local database for SMS bodies and sender addresses.
7. Add emulator/device integration tests for incoming SMS, outgoing SMS, multipart messages, role changes, and permission revocation.
8. Complete Google Play's SMS permission declaration and privacy disclosures before release.

## Non-goals and safety constraints

- Do not attempt to read SMS through notification access, accessibility services, backups, or other indirect methods when the app is not an eligible handler.
- Do not claim that in-app block lists block messages at the carrier or OS level.
- Do not request SMS permissions before the user has chosen Niva as the default SMS app.
- Do not add SMS permissions to the manifest until the complete default-handler implementation is ready for review.

## Official references

- Android default-handler requirements: https://developer.android.com/guide/topics/permissions/default-handlers
- Android SMS role: https://developer.android.com/reference/android/app/role/RoleManager
- Google Play SMS and Call Log permissions policy: https://support.google.com/googleplay/android-developer/answer/10208820
