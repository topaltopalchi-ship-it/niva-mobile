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

## Local data storage

Conversation state is stored on the device using AsyncStorage. This is persistent but **not encrypted**; do not store sensitive message contents in this prototype. A future production version should evaluate encrypted storage and a clear data export/delete flow.

## Privacy principles

- Collect the minimum data needed.
- Keep message content on-device by default.
- Make filtering and blocking behavior transparent and reversible.
- Do not claim OS-level blocking or message access until the relevant platform integrations are implemented and tested.
