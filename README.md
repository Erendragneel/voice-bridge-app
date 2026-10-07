# Voice Bridge — install on your phone

**[Open Voice Bridge](https://erendragneel.github.io/voice-bridge-app/)** and tap **Install App**. It installs with a home-screen icon, using the same GitHub Pages approach as Language Miner and Gym Stone. No GitHub sign-in is needed.

- **Samsung / Android:** open the link in Chrome, tap **Install App**, then confirm. If the prompt is unavailable, use Chrome’s menu → **Install app** or **Add to Home screen**.
- **iPhone / iPad:** open in Safari → Share → **Add to Home Screen** → Add.
- **Prefer the Android APK?** **[Download voice-bridge-1.0.1.apk](https://github.com/Erendragneel/voice-bridge-app/releases/download/v1.0.1/voice-bridge-1.0.1.apk)**, open the downloaded file, and allow installation from your browser when Android prompts. Android 8.0 or newer is required. Version 1.0.1 uses the existing app’s signing certificate so it can update version 1.0.0.

Choose the two languages and who speaks first. Tap **Start conversation**, allow microphone access, then speak and pause. Translation and playback alternate between speakers. Wait for **Listening** before replying. Tap **Stop conversation** to finish. You can also expand **Type a phrase** and tap **Translate text**, which works without microphone recognition.

Connect to Wi-Fi for first use. Browser English/Japanese packs download about 300 MB in total; other pairs use a roughly 900 MB multilingual pack. Model loading and translation speed depend on your phone. Cached models can be reused while browser storage remains available. Native Android uses smaller Google ML Kit packs (about 30 MB per language). Speech services and playback voices may require internet and may process audio remotely. Translation text is processed on-device. See [Privacy](PRIVACY.md) and [Third-party notices](THIRD_PARTY_NOTICES.md).

This repository contains the public installation website. Its signed Android installer is under **[Releases](https://github.com/Erendragneel/voice-bridge-app/releases/latest)**. Avoid downloading GitHub’s source-code ZIP if you want to install the Android app.

## Publishing

GitHub Pages publishes the main branch from the repository root. All app URLs, the manifest, workers, icons, and offline files use relative paths scoped to this app. Updated shell content changes the service-worker cache version. This distribution needs no backend, paid API key, or npm installation.
