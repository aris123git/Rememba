# Versions Rememba (V2 → V7)

Les invariants restent ceux de la V1 : l’IA **propose**, l’humain **décide**. Aucun partage automatique. Les photos ne migrent jamais toutes seules.

| Version | Contenu réel |
| --- | --- |
| **V2** | Lieux (cluster GPS), séries/rafales, doublons (dHash), score de netteté / best shot, événements enrichis (temps + lieu + personnes), confiance LOW/MEDIUM/HIGH |
| **V3** | Événements collectifs, invitation e-mail, demandes de partage photo, matching inter-comptes **opt-in** (`COLLECTIVE_MATCHING`), permissions VIEW (pas de copie auto) |
| **V4** | Agent conversationnel à outils (`searchPhotos`, événements, mémoire, partages…). Parseur français déterministe — pas un LLM enfermé dans l’APK |
| **V5** | Montage vidéo ffmpeg à partir d’un événement + musique générée en interne |
| **V6** | Timeline mensuelle + souvenirs « un jour comme aujourd’hui » |
| **V7** | Événements publics / unlisted, code d’accès, demande d’adhésion validée par l’organisateur |

Le moteur YuNet/SFace reste dans `apps/ai-service`. Flutter n’embarque aucun modèle.
