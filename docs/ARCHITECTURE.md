# Rememba — Architecture V1 et feuille de route

Document de conception. La V1 est implémentée. Les versions suivantes ne seront développées qu’après validation.

## 1. Analyse du produit

Rememba n’est pas une galerie. C’est un **assistant de souvenirs** :

- il **observe** (photos, visages, dates, lieux) ;
- il **propose** (identités, événements, partages, montages) ;
- l’humain **décide** (confirmer, ignorer, corriger, partager).

Trois invariants non négociables :

1. Une identification IA est une **suggestion** jusqu’à confirmation explicite.
2. Un partage de photo exige une **action utilisateur**.
3. Les photos d’un utilisateur ne migrent **jamais** automatiquement vers un autre compte.

Le cœur différenciant (événements collectifs, agent conversationnel, générateur vidéo, mémoire personnelle) arrive **après** un MVP stable : import → visages → identités locales → événements manuels + suggestions temporelles.

## 2. Risques techniques

| Risque | Impact | Mitigation V1 |
| --- | --- | --- |
| Reconnaissance faciale : faux positifs / fusions de personnes | Confiance cassée, risque éthique | Clustering par embeddings + seuil conservateur ; statut `SUGGESTED` obligatoire ; actions Corriger / Plusieurs personnes / Ignorer |
| Licences des modèles (InsightFace buffalo souvent non commercial) | Blocage produit | V1 : OpenCV YuNet + SFace (Apache 2.0, OpenCV Zoo). Abstraction `FaceRecognitionProvider` |
| CPU-only, pas de GPU | Analyse lente | File de jobs, 1 photo à la fois, thumbnails, jamais toute la galerie en RAM |
| Biométrie = donnée sensible | Conformité, confiance | Consentement `AI_PHOTO_ANALYSIS` ; embeddings isolés par `ownerId` ; suppression compte = purge fichiers + vecteurs |
| EXIF incomplet | Événements trop faibles | Fallback `importedAt` ; suggestions seulement si ≥ N photos ; jamais de création auto d’événement |
| Sync offline vs cloud | Divergence, conflits | V1 : serveur source de vérité + interfaces `StorageProvider` / `SyncEngine` (stub documenté, pas de faux offline) |
| Ajout iOS / desktop | Double écriture | Flutter dès V1 (Android compilé) ; iOS/desktop = le même projet ; métier + IA uniquement côté backend |
| Événements collectifs (V3) | Fuite de photos | Modèle `ShareRequest` + permissions dès le schéma ; aucun endpoint de partage en V1 |
| Qualité perçue « boutons fictifs » | Rejet produit | Toute action UI V1 a une logique réelle. Le reste est marqué TODO / FUTURE VERSION |

## 3. Stack retenue

| Couche | Choix V1 | Pourquoi | Évolution |
| --- | --- | --- | --- |
| Client | **Flutter** (Android V1, iOS même code) + PWA Next.js (API + console) | Un seul métier. Desktop/Web Flutter plus tard |
| API | Next.js Route Handlers, **JWT Bearer + cookie** | Fastify dédié si besoin |
| Auth | JWT 30j (`jose` + `bcryptjs`) | OAuth (Apple/Google) |
| BDD | SQLite + Prisma | Zéro ops, schéma portable | PostgreSQL (changer `provider`, pgvector pour ANN) |
| Fichiers | Disque local via `StorageProvider` | Abstrait dès V1 | S3 / MinIO sans changer les services |
| Jobs | File SQL `Job` + worker Node | Asynchrone réel sans Redis | BullMQ + Redis dès ~1k photos / multi-instances |
| IA CV | FastAPI Python + OpenCV YuNet/SFace | Meilleur écosystème vision ; modèles Apache 2.0 | Remplacer le *provider*, pas l’orchestrateur |
| Thumbnails | `sharp` | CPU, WebP, tailles fixes | Idem |
| EXIF | `exifr` | Date / GPS réels | Idem |
| Tests | Vitest (domaine) + pytest (IA) + parcours navigateur | Logique testable sans GPU | Playwright E2E plus tard |

Non retenus en V1 : Redis, Kafka, Kubernetes, entraînement de modèle, LLM, FFmpeg montage, notifications push.

## 4. Architecture logicielle

```
┌─────────────── Flutter ───────────────┐
│ Android (V1) · iOS · plus tard desktop│
│ Aucun modèle IA dans le binaire       │
└────────────────┬──────────────────────┘
                 │ HTTPS, JWT Bearer
┌────────────────▼──────────────────────┐
│  API applicative (aussi PWA Next.js)  │
│  Auth · Photos · People · Events      │
│  AI Orchestrator                      │
└──────────┬───────────────┬────────────┘
           │               │
     FaceRecognition   Persistence
     Service (Python)  Prisma + fichiers
```

Le provider OpenCV YuNet + SFace reste derrière `FaceRecognitionService` (HTTP interne). Remplaçable par un modèle propriétaire sans toucher Flutter.

Règle : **aucun écran, aucune route métier n’importe un modèle ONNX**. Ils parlent à l’orchestrateur. L’orchestrateur parle à `FaceRecognitionService`. Le provider est un détail de déploiement.

Cible future (non implémentée) :

```
LOCAL (mobile embeddings / cache)
   ↕  SyncEngine
CLOUD (PostgreSQL, objet, workers, IA)
```

## 5. Modèle de données

V1 utilise réellement : `User`, `Consent`, `Photo`, `FaceEmbedding`, `FaceCluster`, `Person`, `Event`, `EventPhoto`, `AIRecommendation`, `Job`.

Tables **créées** pour ne pas casser les migrations futures, **sans UI ni API métier** : `ContactReference`, `EventParticipant`, `PhotoShareSuggestion`, `ShareRequest`, `Video`, `Music`, `GeneratedVideo`, `Permission`. Les toucher = V2+.

Voir `apps/web/prisma/schema.prisma`.

Isolation : toute requête métier filtre par `ownerId` / `userId`. Un embedding n’est jamais comparé **entre utilisateurs** en V1 (cela relèverait du matching collectif V3, avec consentements dédiés).

## 6. Moteur IA

### Contrat `FaceRecognitionService`

- `detectFaces(image) -> FaceBox[]`
- `generateEmbedding(image, box) -> { vector, modelId }`
- `compareFaces(a, b) -> CosineSimilarity`
- `clusterFaces(embeddings, threshold) -> ClusterAssignment[]`
- `suggestIdentity(vector, gallery) -> Suggestion | null`

Implémentation V1 : OpenCV Zoo **YuNet** (détection) + **SFace** (embedding 128-D). Seuil cosine par défaut **0.45** (plus strict que 0.363 OpenCV) pour limiter les fusions. Configurable via `FACE_MATCH_THRESHOLD`.

### Orchestrateur V1 (réel)

1. Job `PROCESS_PHOTO` : miniature, EXIF, si consentement IA → détection + embeddings.
2. Job `CLUSTER_USER` : union-find sur similarité cosine intra-utilisateur.
3. Job `GENERATE_SUGGESTIONS` :
   - personne : cluster ≥ 2 visages, non confirmé → « Nous avons trouvé une personne qui apparaît sur N photos. »
   - événement : fenêtres temporelles (photos à ≤ 3 h d’écart, ≥ 3 photos, pas déjà dans un événement confirmé).

Aucune suggestion n’écrit une identité certaine ni ne crée un événement sans clic utilisateur.

### Hors V1

Image embeddings globaux, NMS dupliqués, best-shot, VLM, matching inter-utilisateurs, LLM tools (`searchPhotos`…), montage vidéo.

### Chemin modèle propriétaire

```
Provider open source → logs d’évaluation avec Consent DATASET_EVAL
→ dataset propriétaire → eval hors ligne → fine-tune → ProprietaryProvider
```

Aucun entraînement en V1. Les embeddings stockent `modelId` pour invalidation lors d’un changement de modèle.

## 7. Arborescence

```
apps/mobile/              # Flutter : Android (V1 APK), iOS, plus tard desktop/web
apps/web/                 # API commune + PWA de secours + worker + Prisma
apps/ai-service/          # FaceRecognitionService (FastAPI) — jamais dans l’APK
docs/                     # Architecture, multiplateforme, périmètre V1
scripts/                  # setup, build-apk
```

Détail mobile : `lib/screens`, `lib/api`, `lib/ai/vision_backend.dart` (cloud V1, on-device TODO).  
Détail web : `src/app` (UI PWA), `src/app/api` (HTTP), `src/server` (domaine), `src/lib` (auth, db, storage, jobs, ai client).

## 8. Confidentialité dès la V1

- Consentement IA explicite à l’inscription (modifiable).
- Révocation : plus d’analyse future ; option de purge des embeddings.
- Suppression photo : fichier + visages + liens événement.
- Retrait d’une photo d’un événement sans supprimer la photo.
- Suppression de compte : cascade réelle (BDD + disque).
- « Identifié » ≠ « a accès à la photo » (pas de partage V1).

## 9. Versions — ce qui est in scope

| Version | Statut | Contenu |
| --- | --- | --- |
| **V1** | **Cette PR** | Auth, galerie, import, visages, embeddings, clusters, identités locales, événements manuels, suggestions temporelles simples, confidentialité |
| V2 | Non commencé | Événements auto plus riches, lieux, séries, doublons, best photos, niveaux LOW/MEDIUM/HIGH exposés |
| V3 | Non commencé | Événements collectifs, invitations, demandes de partage |
| V4 | Non commencé | AI Orchestrator conversationnel + tools |
| V5 | Non commencé | Générateur vidéo / musique |
| V6 | Non commencé | Mémoire personnelle / timeline |
| V7 | Non commencé | Événements publics organisateur |

**On ne passe pas à V2 tant que V1 n’est pas validée.**
