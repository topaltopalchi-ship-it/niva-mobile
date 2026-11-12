# Android SMS device test plan

This is a release test plan, not evidence that SMS support is implemented. The current app still has no native SMS receiver, provider access, compose activity, or SMS permissions.

## Test matrix

Run these tests only after the complete default-SMS-handler implementation exists on a dedicated Android test device or emulator with a test SIM/SMS environment.

| Scenario | Setup | Expected result |
| --- | --- | --- |
| Unsupported platform | Launch on iOS/web | SMS capability is reported as unsupported; no SMS UI is enabled |
| Native module absent | Launch Android build without the native module | Capability is unavailable; no permission is assumed |
| Role request cancelled | Start role request and cancel system dialog | Niva remains non-default; no import or send action is enabled |
| Role granted | Select Niva as default SMS app | Capability is re-queried and reflects the system role |
| Role revoked | Set another SMS app as default | Import/send are disabled immediately on the next capability check |
| Read permission denied | Deny the relevant permission where applicable | Import is unavailable with an explanatory state |
| Incoming single-part SMS | Send a test SMS to the device | One conversation/message appears with sender and timestamp |
| Incoming multipart SMS | Send a long SMS split into segments | Segments are assembled into one readable message, without duplicates |
| Unknown sender | Receive from a number not in contacts | Number is displayed safely; no contact permission is assumed |
| Outgoing SMS success | Send to a controlled test number | Message state changes only after platform send result |
| Outgoing SMS failure | Use a disconnected/no-service test setup | Failure is visible; message is not marked sent |
| Process restart | Receive messages, terminate and relaunch | No duplicate import; persisted state remains consistent |
| Permission/role loss during use | Revoke role while app is backgrounded | Sensitive operations fail closed when resumed |
| Export/delete | Export then delete Niva-local data | Export warns about sensitive content; deletion affects only Niva data |

## Required evidence for each test

Record Android version, device/emulator model, app build SHA, test date, role state, permission state, and pass/fail. Do not include real phone numbers or message bodies in CI logs or public issue reports.

## Test data

Use synthetic content and controlled test numbers only. Never use real one-time passwords, banking messages, personal conversations, or third-party data.

## Release blockers

- [ ] Complete default SMS handler intent filters and delivery components
- [ ] Native role request and role-revocation handling
- [ ] Incoming SMS and multipart assembly
- [ ] Outgoing SMS and sent/delivered result handling
- [ ] Encrypted storage for real message bodies
- [ ] User consent and import cancellation
- [ ] Device tests above passing
- [ ] Google Play restricted-permission declaration and privacy review

A passing JavaScript unit test is not a substitute for these Android device tests.
