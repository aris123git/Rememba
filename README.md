# Rememba

Assistant intelligent de souvenirs.

**V1–V7** : client **Flutter Android** (iOS = le même code) + **backend API commun**. Le moteur IA n’est jamais dans l’APK. Desktop / web plus tard, **même compte, mêmes données**.

```
Android / iOS / (plus tard Windows · macOS · Linux · Web)
        ↓
Backend API + orchestrateur
        ↓
Moteur IA
        ↓
Base + stockage
```

- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)
- [docs/MULTIPLATFORM.md](docs/MULTIPLATFORM.md)
- [docs/V1.md](docs/V1.md)
- [docs/VERSIONS.md](docs/VERSIONS.md)

## Backend

Prérequis : Node 22+, Python 3.12.

```bash
npm install
npm install --prefix apps/web
cp apps/web/.env.example apps/web/.env
npm run db:push --prefix apps/web
python3 -m venv apps/ai-service/.venv
apps/ai-service/.venv/bin/pip install -r apps/ai-service/requirements.txt
cd apps/ai-service && .venv/bin/python -c "from app.model_store import ensure_models; ensure_models()"
npm run dev
```

API : http://localhost:3000 (PWA de secours + JSON). IA : http://localhost:8090.

## Android

Installateur (APK, clés debug, pour tester) :

- [releases/rememba-android.apk](releases/rememba-android.apk)

Téléphone physique : autoriser les sources inconnues, installer l’APK, lancer le backend, puis dans l’app URL `http://IP_LAN:3000`. Émulateur : `http://10.0.2.2:3000`.

Pour recompiler :

```bash
export ANDROID_HOME=/chemin/vers/android-sdk
export PATH="$PATH:/chemin/vers/flutter/bin"
cd apps/mobile
flutter pub get && flutter test
flutter build apk --release
```
