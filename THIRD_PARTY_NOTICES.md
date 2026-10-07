# Third-party notices

- Google ML Kit Translate 17.0.3 and downloaded translation models: [ML Kit terms and privacy](https://developers.google.com/ml-kit/terms), incorporating Google APIs Terms of Service. Its own SDK terms govern this proprietary dependency.
- AndroidX libraries: Apache License 2.0, https://source.android.com/docs/setup/about/licenses
- Gradle wrapper: Apache License 2.0, https://github.com/gradle/gradle

Native Android translations are powered by Google ML Kit. This app is not affiliated with Google.

## Browser edition

- Transformers.js: Apache License 2.0, [project and license](https://github.com/huggingface/transformers.js). The bundled browser runtime includes its license at `vendor/licenses/transformers.txt`.
- ONNX Runtime: MIT License, [project and license](https://github.com/microsoft/onnxruntime). The bundled runtime includes its license at `vendor/licenses/onnxruntime.txt`.
- English ↔ Japanese uses Kadonox’s ONNX exports, [fugumt-en-ja-onnx](https://huggingface.co/Kadonox/fugumt-en-ja-onnx) and [fugumt-ja-en-onnx](https://huggingface.co/Kadonox/fugumt-ja-en-onnx), licensed under [Creative Commons Attribution-ShareAlike 4.0 International](https://creativecommons.org/licenses/by-sa/4.0/). The original [FuguMT English → Japanese](https://huggingface.co/staka/fugumt-en-ja) and [Japanese → English](https://huggingface.co/staka/fugumt-ja-en) models are by staka and trained on [JParaCrawl](https://www.kecl.ntt.co.jp/icl/lirg/jparacrawl/). Voice Bridge uses the downloaded ONNX exports without modifying their model weights.
- Other language pairs use [Xenova/nllb-200-distilled-600M](https://huggingface.co/Xenova/nllb-200-distilled-600M), an ONNX export of Meta’s NLLB-200 model, licensed under [Creative Commons Attribution-NonCommercial 4.0 International](https://creativecommons.org/licenses/by-nc/4.0/).

Translation models are downloaded separately on first use and remain governed by their respective licenses. Browser translations use these local models, rather than Google ML Kit.

Auto speech: Xenova/whisper-base ONNX export of OpenAI Whisper base, Apache 2.0. https://huggingface.co/Xenova/whisper-base
