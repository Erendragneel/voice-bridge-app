# Voice Bridge — install on your phone

**[Open Voice Bridge](https://erendragneel.github.io/voice-bridge-app/)** and tap **Install App**. It installs with a home-screen icon, using the same GitHub Pages approach as Language Miner and Gym Stone. No GitHub sign-in is needed.

- **Samsung / Android:** open the link in Chrome, tap **Install App**, then confirm. If the prompt is unavailable, use Chrome’s menu → **Install app** or **Add to Home screen**.
- **iPhone / iPad:** open in Safari → Share → **Add to Home Screen** → Add.
- **Prefer the Android APK?** **[Download voice-bridge-1.1.0.apk](https://github.com/Erendragneel/voice-bridge-app/releases/download/v1.1.0/voice-bridge-1.1.0.apk)**, open the downloaded file, and allow installation from your browser when Android prompts. Android 8.0 or newer is required. Version 1.1.0 uses the existing app’s signing certificate so it can update previous native releases.

Choose the two languages and select Auto, English, or Japanese. Tap **Start conversation**, allow microphone access, then speak and pause. Manual speaker selection stays selected until you change it. Auto detects each phrase independently. Wait for **Listening** before replying. Tap **Stop conversation** to finish. You can also expand **Type a phrase** and tap **Translate text**, which works without microphone recognition.

Connect to Wi-Fi for first use. Browser English/Japanese packs download about 300 MB in total; other pairs use a roughly 900 MB multilingual pack. Model loading and translation speed depend on your phone. Cached models can be reused while browser storage remains available. Native Android uses smaller Google ML Kit packs (about 30 MB per language). Speech services and playback voices may require internet and may process audio remotely. Translation text is processed on-device. See [Privacy](PRIVACY.md) and [Third-party notices](THIRD_PARTY_NOTICES.md).

This repository contains the public installation website. Its signed Android installer is under **[Releases](https://github.com/Erendragneel/voice-bridge-app/releases/latest)**. Avoid downloading GitHub’s source-code ZIP if you want to install the Android app.

## Publishing

GitHub Pages publishes the main branch from the repository root. All app URLs, the manifest, workers, icons, and offline files use relative paths scoped to this app. Updated shell content changes the service-worker cache version. This distribution needs no backend, paid API key, or npm installation.

## Auto conversation mode

In the GitHub Pages app, select **Auto** for English/Japanese, then **Start conversation**. Each phrase is identified independently, so either person can speak next. Auto recognizes microphone audio locally using an additional Whisper speech pack downloaded on first use. Wait for Listening before the next phrase. Very short phrases may be misidentified; manual speaker buttons remain available. This feature is in the website/home-screen app; the v1.1.0 Android APK adds native Auto on Android 14+ with a compatible speech service and both language packs. If detection or switching fails, choose a manual speaker.

Speaker buttons remain clickable during preparation, translation, and playback. Selecting a different speaker during playback stops that playback and opens the chosen microphone. Japanese speech offers Faster browser service or On-device Whisper recognition. Updated app windows reload automatically once to avoid mixing cached scripts from different versions.

Performance update: translation uses the stable CPU path; short phrases use one pass; repeated translations are cached for the conversation. Speech pauses and microphone restart delays are shorter. Subsecond completion is not guaranteed and depends on phone/model speed.

Japanese speech defaults to **Faster · browser service**. If recognition fails, on-device speech takes over; repeat your phrase when Listening appears. Select **On-device · private** to keep Japanese audio local. Faster mode needs internet and may process audio through the browser provider. Auto remains on-device.

GPU translation is disabled following repeated-word corruption. Broken repetitive output is retried using a fresh CPU model, and persistent failure is rejected before playback and caching.

Version 1.1.0: native Android retains warmed ML Kit clients between conversations, adds processing time and Correct recognized words, and blocks empty/repetitive translation output before speaking. The website reuses successful warmed workers and translates final browser transcripts immediately. Processing time starts after the phrase ends; it excludes model preparation and spoken playback. Native speech service performance must still be checked on your phone.
