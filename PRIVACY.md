# Privacy

Voice Bridge has no account, advertisements, developer translation server, or paid API connection. Conversation text is displayed in memory and is not saved as a conversation history by the app. GitHub hosts the website and release downloads.

## Browser and installed website

Translation models run locally in your browser through Transformers.js. Translation text is not sent to an inference API. The first use downloads model files from Hugging Face, whose service receives normal download request information such as your IP address. Language models are cached in browser storage for reuse. The service worker caches this app's interface and inference runtime for offline opening; it does not proactively download translation models. Clearing site data removes cached app files and models.

Microphone recognition uses your browser's speech recognition service. That service may send audio to its provider for recognition, depending on the browser and device. Consult your browser and speech provider's privacy policies. Text-to-speech uses the browser's available voice services, which can be local or online. Typing a phrase does not use microphone recognition.

Microphone capture and voice playback stop when the conversation stops or the app leaves the foreground. No audio recording or conversation history is uploaded or intentionally stored by Voice Bridge. Downloaded models and app files remain in browser storage until that storage is cleared or evicted by the browser.

## Native Android APK

Microphone audio is handled by the Android speech recognition service selected on your phone. That service may transmit audio to its provider; consult its privacy policy. Text-to-speech uses the phone's selected voice service.

Native Android translation uses Google ML Kit on-device. According to [Google's terms and privacy disclosure](https://developers.google.com/ml-kit/terms), translation input and output are not sent to Google. The SDK downloads language models and sends performance and API utilization metrics to Google. These communications follow [Google's privacy policy](https://policies.google.com/privacy). Downloaded models remain in app storage until app data is cleared or the app is uninstalled.

Microphone capture and voice playback stop when the conversation stops or the app leaves the foreground. Android backup is disabled. The app explicitly requests microphone and internet permissions; library dependencies may add network-state permissions used for downloads.

Auto English/Japanese speech recognition uses a downloaded Whisper model on this device. Auto microphone audio is not sent to a speech provider. Manual speaker mode retains the browser speech service described above.

The Japanese speaker button defaults to Faster browser speech, which may send audio to the browser speech provider. Select On-device Japanese for local recognition. If Faster Japanese fails, the app switches to local Whisper recognition and asks you to repeat the phrase. Auto remains local. Manual English and other language buttons use browser speech recognition.
