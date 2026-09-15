# Rememba

Assistant intelligent de souvenirs. **V1 MVP** — l’IA propose, vous confirmez.

Ce dépôt n’est **pas** une galerie photo. La V1 permet de tester le concept réel : import, visages, identités locales, événements, suggestions. Les versions suivantes (collectif, agent, vidéo…) ne seront développées qu’après validation de la V1.

## Démarrage local

Prérequis : Node 22+, Python 3.12, `python3-venv`.

```bash
# 1. Dépendances JS
npm install
npm install --prefix apps/web

# 2. Environnement
cp apps/web/.env.example apps/web/.env
# Générez un JWT_SECRET unique

# 3. Base SQLite
npm run db:push --prefix apps/web

# 4. Python + modèles OpenCV Zoo (YuNet + SFace, Apache 2.0)
python3 -m venv apps/ai-service/.venv
apps/ai-service/.venv/bin/pip install -r apps/ai-service/requirements.txt
cd apps/ai-service && .venv/bin/python -c "from app.model_store import ensure_models; ensure_models()"

# 5. Lancer PWA + worker + moteur IA
npm run dev
```

Ouvrez [http://localhost:3000](http://localhost:3000).

## Tests

```bash
npm test --prefix apps/web
cd apps/ai-service && .venv/bin/pytest -q
```

## Architecture

Voir [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) et le périmètre exact [docs/V1.md](docs/V1.md).

```
Application (Next.js PWA)
  → AI Orchestrator (TypeScript)
    → FaceRecognitionService (FastAPI)
      → OpenCvSFaceProvider  ← remplaçable sans réécrire l’app
```

## Confidentialité (V1)

- Consentement d’analyse des visages, révocable (purge des embeddings).
- Une identification n’est jamais certaine tant que vous ne l’avez pas nommée.
- Aucun partage automatique.
- Suppression de photo et de compte : données et fichiers réellement effacés.

## Hors V1 (pas de faux boutons)

Partage, événements collectifs, agent conversationnel, génération vidéo, app native, HEIC : marqués TODO / FUTURE VERSION.
