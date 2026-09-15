# Rememba — client Flutter

Plateformes générées : **Android, iOS, Web, Windows, macOS, Linux**.

Pour un début : **galerie locale**, sans compte. L’IA et le backend restent optionnels (Réglages).

Aucun modèle ONNX/TFLite n’est dans cet APK. Voir `lib/ai/vision_backend.dart`.

```bash
flutter pub get
flutter test
flutter build apk --release
```

URL API (Réglages dans l’app) :

- émulateur Android : `http://10.0.2.2:3000`
- iOS Simulator : `http://127.0.0.1:3000`
- téléphone : `http://<IP-LAN-du-PC>:3000`
