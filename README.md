# Rememba

Galerie photo d’abord. Le compte, le cloud et l’IA viendront **ensuite**, si on le souhaite.

**Aujourd’hui** : ouvrir l’app Android → voir les photos déjà sur le téléphone. **Pas de création de compte.**

Le backend (souvenirs IA, personnes, événements, sync) reste dans le dépôt pour plus tard. Flutter iOS = le même code. Le moteur IA n’est jamais dans l’APK.

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

Téléphone : autoriser les sources inconnues, installer l’APK, autoriser l’accès aux photos. Aucun serveur n’est requis pour la galerie.

Compte / IA (plus tard) : Réglages → Connecter un compte, backend `http://IP_LAN:3000`.

Pour recompiler :

```bash
export ANDROID_HOME=/chemin/vers/android-sdk
export PATH="$PATH:/chemin/vers/flutter/bin"
cd apps/mobile
flutter pub get && flutter test
flutter build apk --release
```
