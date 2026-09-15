import 'package:flutter/material.dart';
import 'package:rememba/screens/people_screens.dart';
import 'package:rememba/state/session.dart';
import 'package:rememba/theme.dart';
import 'package:rememba/widgets/common.dart';

class SuggestionsScreen extends StatefulWidget {
  const SuggestionsScreen({super.key, required this.session});
  final SessionController session;

  @override
  State<SuggestionsScreen> createState() => _SuggestionsScreenState();
}

class _SuggestionsScreenState extends State<SuggestionsScreen> {
  List<Map<String, dynamic>> items = [];

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final data = await widget.session.api.suggestions();
    setState(() => items = (data['suggestions'] as List).cast<Map<String, dynamic>>());
  }

  Future<void> _act(String id, String action, {String? name}) async {
    final body = <String, dynamic>{'id': id, 'action': action};
    if (name != null) body['name'] = name;
    await widget.session.api.suggestionAction(body);
    await _load();
  }

  String _title(String type) {
    switch (type) {
      case 'PERSON_IDENTITY':
        return 'Une personne apparaît souvent';
      case 'EVENT_CANDIDATE':
        return 'Événement possible';
      case 'SHARE_PHOTO':
        return 'Partage proposé';
      case 'DUPLICATE_SET':
        return 'Doublons possibles';
      case 'BEST_SHOT':
        return 'Meilleure photo d’une série';
      case 'MEMORY_ON_THIS_DAY':
        return 'Un jour comme aujourd’hui';
      case 'EVENT_JOIN_REQUEST':
        return 'Quelqu’un veut rejoindre un événement';
      default:
        return type;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: ModalRoute.of(context)?.canPop == true ? AppBar(title: const Text('Suggestions')) : null,
      body: ListView(
      padding: const EdgeInsets.all(20),
      children: [
        Text('✨ Suggestions de l’IA', style: serifStyle(size: 32)),
        const Text('Proactive, jamais intrusive. Confiance LOW / MEDIUM / HIGH affichée. Rien ne s’applique tout seul.', style: TextStyle(color: remembaMuted)),
        const SizedBox(height: 16),
        if (items.isEmpty) const Text('Rien en attente.', style: TextStyle(color: remembaMuted)),
        ...items.map((item) {
          final payload = (item['payload'] as Map).cast<String, dynamic>();
          final type = item['type'] as String;
          final raw = payload['samplePhotoIds'] ?? payload['photoIds'] ?? (payload['photoId'] != null ? [payload['photoId']] : []);
          final ids = (raw as List).where((e) => e != null).map((e) => e.toString()).toList();
          final count = payload['photoCount'] ?? ids.length;
          final name = TextEditingController(text: payload['suggestedName'] as String? ?? '');
          final confidence = item['confidence'] as String? ?? 'MEDIUM';
          return Card(
            color: remembaInkSoft,
            margin: const EdgeInsets.only(bottom: 16),
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(_title(type), style: serifStyle(size: 22)),
                  Text('Confiance $confidence · $count élément(s)', style: const TextStyle(color: remembaGold, fontSize: 13)),
                  Text(
                    type == 'SHARE_PHOTO'
                        ? 'Proposer le partage à ${payload['displayName'] ?? 'cette personne'} ? Rien n’est envoyé sans votre accord.'
                        : type == 'EVENT_JOIN_REQUEST'
                            ? 'Demande pour « ${payload['eventName'] ?? 'événement'} ».'
                            : type == 'DUPLICATE_SET'
                                ? 'Plusieurs photos très proches. La meilleure est déjà marquée.'
                                : type == 'BEST_SHOT'
                                    ? 'Photo la plus nette d’une rafale.'
                                    : type == 'PERSON_IDENTITY'
                                        ? 'Personne sur $count photo(s). Suggestion uniquement.'
                                        : '$count photos semblent liées.',
                    style: const TextStyle(color: remembaMuted),
                  ),
                  const SizedBox(height: 8),
                  if (ids.isNotEmpty) PhotoGrid(api: widget.session.api, ids: ids.take(6).toList(), onTap: (_) {}),
                  if (type == 'EVENT_CANDIDATE')
                    Padding(
                      padding: const EdgeInsets.only(top: 8),
                      child: TextField(controller: name, decoration: const InputDecoration(labelText: 'Nom de l’événement')),
                    ),
                  const SizedBox(height: 8),
                  Wrap(
                    spacing: 8,
                    children: [
                      if (type == 'EVENT_CANDIDATE')
                        GoldButton(label: 'Créer l’événement', onPressed: () => _act(item['id'] as String, 'accept_event', name: name.text.trim())),
                      if (type == 'SHARE_PHOTO')
                        GoldButton(label: 'Proposer le partage', onPressed: () => _act(item['id'] as String, 'accept_share')),
                      if (type == 'EVENT_JOIN_REQUEST') ...[
                        GoldButton(label: 'Accepter', onPressed: () => _act(item['id'] as String, 'approve_join')),
                        TextButton(onPressed: () => _act(item['id'] as String, 'decline_join'), child: const Text('Refuser')),
                      ],
                      if (type == 'PERSON_IDENTITY' && payload['clusterId'] != null)
                        GoldButton(
                          label: 'Voir / nommer',
                          onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => UnknownPersonScreen(session: widget.session, clusterId: payload['clusterId'] as String))),
                        ),
                      if (type == 'DUPLICATE_SET' || type == 'BEST_SHOT' || type == 'MEMORY_ON_THIS_DAY')
                        GoldButton(label: 'OK', onPressed: () => _act(item['id'] as String, 'accept')),
                      TextButton(onPressed: () => _act(item['id'] as String, 'snooze'), child: const Text('Pas maintenant')),
                      TextButton(onPressed: () => _act(item['id'] as String, 'dismiss'), child: const Text('Ignorer', style: TextStyle(color: remembaMuted))),
                    ],
                  ),
                ],
              ),
            ),
          );
        }),
      ],
      ),
    );
  }
}
