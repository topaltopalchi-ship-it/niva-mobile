# Niva

Niva is a privacy-focused mobile inbox concept for helping people prioritize meaningful conversations, reduce unwanted communication, and stay in control of their messages.

## Current status

The repository started as a README-only project. The first application foundation is now an Expo + React Native + TypeScript app.

### Included in the starter

- Inbox screen with seeded sample conversations
- Search by sender or message preview
- All, Important, Blocked, Personal, Updates, and Promotions filters
- Open a conversation detail screen and return to the inbox
- Mark a conversation as read when opening it
- Persist read, important, and blocked states locally with AsyncStorage
- Validate restored local data before loading it into the app
- Horizontal category filters for a compact inbox layout
- Explainable, on-device category suggestions for common promotion and service-update keywords; users must apply suggestions manually
- Privacy-first visual direction

> **Prototype notice:** The current inbox uses local sample data only. It does not yet read SMS, notifications, email, or contacts from a device, and block actions do not block senders at the operating-system or carrier level.

## Requirements

- Node.js 22.13+ (required by the current Expo SDK toolchain)
- npm
- Expo development build for device testing

## Run locally

```bash
npm install
npx expo start
```

Use the Expo CLI prompts to launch an Android emulator, iOS simulator, or a connected development device.

## Type-check

```bash
npm run typecheck
```

GitHub Actions runs the same TypeScript check on pushes and pull requests to `main`.

## Roadmap

1. Product requirements and threat model
2. Platform-specific message access and genuine OS-level blocking
3. Backend/authentication only where needed; keep message content on-device by default
4. Privacy controls, tests, accessibility, and release automation

## Message categorization

The prototype includes a small, transparent keyword-based suggestion helper for common promotional and transactional phrases. Suggestions are shown with a short reason and require an explicit tap to apply. This is not machine learning, does not send content to a server, and must not be treated as a spam or fraud detector.

## Local data storage

Conversation state is stored on the device using AsyncStorage. This is persistent but **not encrypted**; do not store sensitive message contents in this prototype. A future production version should evaluate encrypted storage and a clear data export/delete flow.

## Privacy principles

- Collect the minimum data needed.
- Keep message content on-device by default.
- Make filtering and blocking behavior transparent and reversible.
- Keep categorization suggestions explainable and user-controlled.
- Do not claim OS-level blocking or message access until the relevant platform integrations are implemented and tested.


## Potential warning signs

The message detail view can show a caution card when local keyword rules find signals such as urgency, requests for passwords or financial details, links, or prize language. It explains which signals were matched and recommends independent verification. This is deliberately not presented as a fraud verdict: keyword checks can miss scams and can flag legitimate messages. No content is sent to a server and no message is automatically blocked or deleted. The seeded warning example uses the reserved `example.invalid` domain and is demonstration content only.


## User feedback on warning hints

On a flagged conversation, users can mark the warning as suspicious or as a possible false alarm. This choice is stored alongside that conversation in local AsyncStorage and can be undone. It is private device-side feedback only: it is not sent to Niva or used to train a model, and it does not change the keyword rules or automatically block a sender.


## Privacy & data controls

The app includes a local Privacy & Data screen that describes the prototype\’s storage behavior and integration limits, shows the current conversation count, and supports JSON export through the native share sheet. Users can reset the inbox to sample conversations or permanently delete Niva’s locally stored conversations and preferences after a confirmation prompt. A deletion marker prevents sample data from being silently restored on the next launch. These controls affect only Niva’s prototype data; they cannot delete SMS, email, or data held by other apps. AsyncStorage is not encrypted. Exported JSON may contain message content, so choose a trusted share destination.
