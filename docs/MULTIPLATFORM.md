# Architecture multiplateforme (backend-first)

Rememba n’est **pas** une app Android isolée. Le cœur métier et le moteur IA vivent derrière une API commune.

```
Android  ┐
iOS      ┤
Desktop* ┤── HTTPS + JWT Bearer ──► Backend / API
Web*     ┘                              │
                                        ├── AI Orchestrator
                                        ├── FaceRecognitionService (jamais dans l’APK)
                                        ├── PostgreSQL/SQLite
                                        └── Object storage
```

\* Desktop / Web : **même compte, mêmes données**. Flutter cible déjà `android, ios, web, linux, macos, windows`. V1 compile **Android (APK)**. iOS se construit avec Xcode. Desktop/Web : versions suivantes.

## Où tourne l’IA

| Tâche | V1 | Cible |
| --- | --- | --- |
| Détection visages + embeddings | Serveur (YuNet/SFace) | Téléphone / ordi en local si pertinent |
| Clustering, identités, événements | Serveur (orchestrateur) | Idem, sync |
| Matching inter-utilisateurs | — | Serveur uniquement (V3) |
| Génération vidéo | — | Serveur (V5) |
| Import millier de photos / carte SD | — | Desktop (V2/V3) |

Le client Flutter n’embarque **aucun modèle ONNX**. `VisionBackend` (`lib/ai/vision_backend.dart`) : V1 = `CloudVisionBackend`. `OnDeviceVisionBackend` est un contrat TODO, pas une simulation.

## Clients

1. **Flutter** `apps/mobile` — plateforme prioritaire (Android maintenant, iOS dès un Mac).
2. **Next.js** `apps/web` — API + PWA de secours / future console desktop légère. Cookie **et** Bearer.

## Auth mobile

`POST /api/auth/login` et `register` renvoient `{ token, ... }`. L’app stocke le JWT (stockage sécurisé) et l’envoie en `Authorization: Bearer`.

## APK

```bash
export ANDROID_HOME=/opt/android-sdk
export PATH="$PATH:/opt/flutter/bin"
cd apps/mobile
flutter pub get
flutter test
flutter build apk --release
# → build/app/outputs/flutter-apk/app-release.apk
```

Sur un **téléphone physique**, l’URL du serveur (Réglages) doit être `http://IP_DU_PC:3000` (pas localhost). Émulateur Android : `http://10.0.2.2:3000`.
