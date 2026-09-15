import 'package:flutter/material.dart';
import 'package:rememba/screens/gallery_screens.dart';
import 'package:rememba/state/session.dart';
import 'package:rememba/theme.dart';
import 'package:rememba/widgets/common.dart';

class EventsScreen extends StatefulWidget {
  const EventsScreen({super.key, required this.session});
  final SessionController session;

  @override
  State<EventsScreen> createState() => _EventsScreenState();
}

class _EventsScreenState extends State<EventsScreen> {
  List<Map<String, dynamic>> events = [];

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final data = await widget.session.api.events();
    setState(() => events = (data['events'] as List).cast<Map<String, dynamic>>());
  }

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(20),
      children: [
        Row(
          children: [
            Text('Événements', style: serifStyle(size: 32)),
            const Spacer(),
            GoldButton(
              label: 'Nouveau',
              onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => NewEventScreen(session: widget.session))).then((_) => _load()),
            ),
          ],
        ),
        const Text('Galerie collective : TODO V3.', style: TextStyle(color: remembaMuted)),
        const SizedBox(height: 16),
        if (events.isEmpty) const Text('Aucun événement confirmé.', style: TextStyle(color: remembaMuted)),
        ...events.map((event) => ListTile(
              contentPadding: EdgeInsets.zero,
              leading: event['coverPhotoId'] != null
                  ? ClipRRect(
                      borderRadius: BorderRadius.circular(12),
                      child: SizedBox(width: 72, height: 56, child: AuthImage(api: widget.session.api, photoId: event['coverPhotoId'] as String)),
                    )
                  : null,
              title: Text(event['name'] as String),
              subtitle: Text('${event['photoCount']} photo(s)'),
              onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => EventDetailScreen(session: widget.session, id: event['id'] as String))).then((_) => _load()),
            )),
      ],
    );
  }
}

class EventDetailScreen extends StatefulWidget {
  const EventDetailScreen({super.key, required this.session, required this.id});
  final SessionController session;
  final String id;

  @override
  State<EventDetailScreen> createState() => _EventDetailScreenState();
}

class _EventDetailScreenState extends State<EventDetailScreen> {
  Map<String, dynamic>? event;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    event = await widget.session.api.event(widget.id);
    setState(() {});
  }

  @override
  Widget build(BuildContext context) {
    if (event == null) {
      return const Scaffold(body: Center(child: CircularProgressIndicator(color: remembaGold)));
    }
    final photos = (event!['photos'] as List).cast<Map<String, dynamic>>();
    return Scaffold(
      appBar: AppBar(title: Text(event!['name'] as String)),
      body: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          Text(event!['source'] == 'AI_SUGGESTION' ? 'Créé depuis une suggestion' : 'Créé manuellement', style: serifStyle(size: 14, color: remembaGold)),
          Text(event!['name'] as String, style: serifStyle(size: 32)),
          Text('${photos.length} photo(s)', style: const TextStyle(color: remembaMuted)),
          const Text('Vidéo automatique : TODO V5. Événement partagé : TODO V3.', style: TextStyle(color: remembaMuted, fontSize: 13)),
          const SizedBox(height: 12),
          Wrap(
            spacing: 8,
            children: photos
                .map(
                  (photo) => SizedBox(
                    width: 110,
                    child: Column(
                      children: [
                        GestureDetector(
                          onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => PhotoDetailScreen(session: widget.session, id: photo['id'] as String))),
                          child: ClipRRect(
                            borderRadius: BorderRadius.circular(12),
                            child: SizedBox(height: 110, child: AuthImage(api: widget.session.api, photoId: photo['id'] as String)),
                          ),
                        ),
                        TextButton(
                          onPressed: () async {
                            await widget.session.api.patchEvent(widget.id, {
                              'removePhotoIds': [photo['id']],
                            });
                            await _load();
                          },
                          child: const Text('Retirer', style: TextStyle(fontSize: 12)),
                        ),
                      ],
                    ),
                  ),
                )
                .toList(),
          ),
          TextButton(
            onPressed: () async {
              await widget.session.api.deleteEvent(widget.id);
              if (context.mounted) Navigator.pop(context);
            },
            child: const Text('Supprimer l’événement', style: TextStyle(color: remembaDanger)),
          ),
        ],
      ),
    );
  }
}

class NewEventScreen extends StatefulWidget {
  const NewEventScreen({super.key, required this.session});
  final SessionController session;

  @override
  State<NewEventScreen> createState() => _NewEventScreenState();
}

class _NewEventScreenState extends State<NewEventScreen> {
  final name = TextEditingController();
  final location = TextEditingController();
  List<Map<String, dynamic>> photos = [];
  final selected = <String>{};
  String? error;

  @override
  void initState() {
    super.initState();
    widget.session.api.photos().then((data) => setState(() => photos = (data['photos'] as List).cast<Map<String, dynamic>>()));
  }

  @override
  void dispose() {
    name.dispose();
    location.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Nouvel événement')),
      body: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          TextField(controller: name, decoration: const InputDecoration(labelText: 'Nom')),
          const SizedBox(height: 12),
          TextField(controller: location, decoration: const InputDecoration(labelText: 'Lieu (optionnel)')),
          const SizedBox(height: 16),
          Text('Associer des photos (${selected.length})', style: serifStyle(size: 20)),
          const SizedBox(height: 8),
          GridView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            itemCount: photos.length,
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(crossAxisCount: 3, crossAxisSpacing: 8, mainAxisSpacing: 8),
            itemBuilder: (context, i) {
              final id = photos[i]['id'] as String;
              final on = selected.contains(id);
              return GestureDetector(
                onTap: () => setState(() => on ? selected.remove(id) : selected.add(id)),
                child: Stack(
                  fit: StackFit.expand,
                  children: [
                    ClipRRect(borderRadius: BorderRadius.circular(12), child: AuthImage(api: widget.session.api, photoId: id)),
                    if (on) Container(color: remembaGold.withValues(alpha: 0.35)),
                  ],
                ),
              );
            },
          ),
          if (error != null) Text(error!, style: const TextStyle(color: remembaDanger)),
          const SizedBox(height: 16),
          GoldButton(
            label: 'Créer l’événement',
            onPressed: () async {
              try {
                await widget.session.api.createEvent({
                  'name': name.text.trim(),
                  'locationText': location.text.trim().isEmpty ? null : location.text.trim(),
                  'photoIds': selected.toList(),
                });
                if (context.mounted) Navigator.pop(context);
              } catch (e) {
                setState(() => error = e.toString());
              }
            },
          ),
        ],
      ),
    );
  }
}
