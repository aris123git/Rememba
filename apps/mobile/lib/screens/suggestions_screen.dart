import 'package:flutter/material.dart';
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

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(20),
      children: [
        Text('✨ Suggestions de l’IA', style: serifStyle(size: 32)),
        const Text('Proactive, jamais intrusive. Partage automatique : jamais.', style: TextStyle(color: remembaMuted)),
        const SizedBox(height: 16),
        if (items.isEmpty) const Text('Rien en attente.', style: TextStyle(color: remembaMuted)),
        ...items.map((item) {
          final payload = (item['payload'] as Map).cast<String, dynamic>();
          final type = item['type'] as String;
          final ids = ((payload['samplePhotoIds'] ?? payload['photoIds'] ?? []) as List).cast<dynamic>().map((e) => e.toString()).toList();
          final count = payload['photoCount'] ?? ids.length;
          final name = TextEditingController();
          return Card(
            color: remembaInkSoft,
            margin: const EdgeInsets.only(bottom: 16),
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(type == 'PERSON_IDENTITY' ? 'Une personne apparaît souvent' : 'Événement possible', style: serifStyle(size: 22)),
                  Text(
                    type == 'PERSON_IDENTITY'
                        ? 'Personne sur $count photo(s). Suggestion uniquement.'
                        : '$count photos semblent le même moment.',
                    style: const TextStyle(color: remembaMuted),
                  ),
                  const SizedBox(height: 8),
                  PhotoGrid(api: widget.session.api, ids: ids.take(6).toList(), onTap: (_) {}),
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
                        GoldButton(
                          label: 'Créer l’événement',
                          onPressed: () => _act(item['id'] as String, 'accept_event', name: name.text.trim()),
                        ),
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
    );
  }
}
