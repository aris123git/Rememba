import 'package:flutter/material.dart';
import 'package:rememba/api/rememba_api.dart';
import 'package:rememba/screens/gallery_screens.dart';
import 'package:rememba/screens/suggestions_screen.dart';
import 'package:rememba/state/session.dart';
import 'package:rememba/theme.dart';
import 'package:rememba/widgets/common.dart';

class PlusHubScreen extends StatelessWidget {
  const PlusHubScreen({super.key, required this.session});
  final SessionController session;

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(20),
      children: [
        Text('Plus', style: serifStyle(size: 32)),
        const Text('IA, partages, vidéos, événements publics. Rien n’est automatique.', style: TextStyle(color: remembaMuted)),
        const SizedBox(height: 12),
        _tile(context, Icons.lightbulb_outline, 'Suggestions IA', SuggestionsScreen(session: session)),
        _tile(context, Icons.chat_bubble_outline, 'Agent souvenirs', AgentScreen(session: session)),
        _tile(context, Icons.timeline, 'Mémoire / timeline', MemoryScreen(session: session)),
        _tile(context, Icons.place_outlined, 'Lieux', PlacesScreen(session: session)),
        _tile(context, Icons.ios_share, 'Partages', SharesScreen(session: session)),
        _tile(context, Icons.movie_outlined, 'Vidéos', VideosScreen(session: session)),
        _tile(context, Icons.public, 'Événements publics', PublicEventsScreen(session: session)),
      ],
    );
  }

  Widget _tile(BuildContext context, IconData icon, String label, Widget page) {
    return ListTile(
      contentPadding: EdgeInsets.zero,
      leading: Icon(icon, color: remembaGold),
      title: Text(label),
      trailing: const Icon(Icons.chevron_right, color: remembaMuted),
      onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => page)),
    );
  }
}

class AgentScreen extends StatefulWidget {
  const AgentScreen({super.key, required this.session});
  final SessionController session;

  @override
  State<AgentScreen> createState() => _AgentScreenState();
}

class _AgentScreenState extends State<AgentScreen> {
  final input = TextEditingController();
  String? threadId;
  List<Map<String, dynamic>> messages = [];
  bool busy = false;

  @override
  void dispose() {
    input.dispose();
    super.dispose();
  }

  Future<void> _send() async {
    final text = input.text.trim();
    if (text.isEmpty) return;
    setState(() => busy = true);
    try {
      final data = await widget.session.api.askAgent(text, threadId: threadId);
      threadId = data['threadId'] as String?;
      setState(() {
        messages = (data['messages'] as List).cast<Map<String, dynamic>>();
        input.clear();
      });
    } on ApiException catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.message)));
    } finally {
      if (mounted) setState(() => busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Agent souvenirs')),
      body: Column(
        children: [
          Expanded(
            child: ListView(
              padding: const EdgeInsets.all(16),
              children: [
                const Text('Recherche naturelle dans votre bibliothèque. Aucune action n’est appliquée toute seule.', style: TextStyle(color: remembaMuted)),
                const SizedBox(height: 12),
                if (messages.isEmpty) const Text('Essayez : « photos de Marie », « doublons », « il y a un an ».'),
                ...messages.map(
                  (m) => Align(
                    alignment: m['role'] == 'USER' ? Alignment.centerRight : Alignment.centerLeft,
                    child: Container(
                      margin: const EdgeInsets.only(bottom: 8),
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: m['role'] == 'USER' ? remembaGold.withValues(alpha: 0.2) : remembaInkSoft,
                        borderRadius: BorderRadius.circular(16),
                      ),
                      child: Text('${m['content']}'),
                    ),
                  ),
                ),
              ],
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(12),
            child: Row(
              children: [
                Expanded(child: TextField(controller: input, decoration: const InputDecoration(hintText: 'Chercher un souvenir…'))),
                IconButton(onPressed: busy ? null : _send, icon: const Icon(Icons.send, color: remembaGold)),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class MemoryScreen extends StatefulWidget {
  const MemoryScreen({super.key, required this.session});
  final SessionController session;
  @override
  State<MemoryScreen> createState() => _MemoryScreenState();
}

class _MemoryScreenState extends State<MemoryScreen> {
  Map<String, dynamic>? data;

  @override
  void initState() {
    super.initState();
    widget.session.api.memory().then((value) => setState(() => data = value));
  }

  @override
  Widget build(BuildContext context) {
    final months = (data?['months'] as List?)?.cast<Map<String, dynamic>>() ?? [];
    final memories = (data?['memories'] as List?)?.cast<Map<String, dynamic>>() ?? [];
    return Scaffold(
      appBar: AppBar(title: const Text('Mémoire')),
      body: data == null
          ? const Center(child: CircularProgressIndicator(color: remembaGold))
          : ListView(
              padding: const EdgeInsets.all(20),
              children: [
                Text('Timeline', style: serifStyle(size: 28)),
                const SizedBox(height: 8),
                ...memories.map((m) {
                  final payload = (m['payload'] as Map?)?.cast<String, dynamic>() ?? {};
                  final ids = ((payload['photoIds'] ?? []) as List).map((e) => e.toString()).toList();
                  return Card(
                    color: remembaInkSoft,
                    child: ListTile(
                      title: Text(m['title'] as String),
                      subtitle: Text(m['kind'] as String, style: const TextStyle(color: remembaMuted)),
                      onTap: () => showDialog<void>(
                        context: context,
                        builder: (_) => AlertDialog(
                          title: Text(m['title'] as String),
                          content: SizedBox(
                            width: 320,
                            child: PhotoGrid(
                              api: widget.session.api,
                              ids: ids.take(9).toList(),
                              onTap: (id) => Navigator.push(context, MaterialPageRoute(builder: (_) => PhotoDetailScreen(session: widget.session, id: id))),
                            ),
                          ),
                        ),
                      ),
                    ),
                  );
                }),
                const SizedBox(height: 16),
                ...months.map((month) => ListTile(
                      title: Text(month['month'] as String),
                      subtitle: Text('${month['count']} photo(s)'),
                    )),
              ],
            ),
    );
  }
}

class PlacesScreen extends StatefulWidget {
  const PlacesScreen({super.key, required this.session});
  final SessionController session;
  @override
  State<PlacesScreen> createState() => _PlacesScreenState();
}

class _PlacesScreenState extends State<PlacesScreen> {
  List<Map<String, dynamic>> places = [];

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final data = await widget.session.api.places();
    setState(() => places = (data['places'] as List).cast<Map<String, dynamic>>());
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Lieux')),
      body: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          const Text('Regroupés par GPS. Vous nommez le lieu — l’IA ne décide pas.', style: TextStyle(color: remembaMuted)),
          ...places.map(
            (place) => ListTile(
              title: Text(place['name'] as String),
              subtitle: Text('${place['photoCount']} photo(s)'),
              onTap: () async {
                final controller = TextEditingController(text: place['name'] as String);
                final name = await showDialog<String>(
                  context: context,
                  builder: (ctx) => AlertDialog(
                    title: const Text('Renommer le lieu'),
                    content: TextField(controller: controller),
                    actions: [
                      TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Annuler')),
                      TextButton(onPressed: () => Navigator.pop(ctx, controller.text.trim()), child: const Text('Enregistrer')),
                    ],
                  ),
                );
                if (name != null && name.isNotEmpty) {
                  await widget.session.api.renamePlace(place['id'] as String, name);
                  await _load();
                }
              },
            ),
          ),
        ],
      ),
    );
  }
}

class SharesScreen extends StatefulWidget {
  const SharesScreen({super.key, required this.session});
  final SessionController session;
  @override
  State<SharesScreen> createState() => _SharesScreenState();
}

class _SharesScreenState extends State<SharesScreen> {
  Map<String, dynamic>? data;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    data = await widget.session.api.shares();
    setState(() {});
  }

  @override
  Widget build(BuildContext context) {
    final incoming = (data?['incoming'] as List?)?.cast<Map<String, dynamic>>() ?? [];
    final outgoing = (data?['outgoing'] as List?)?.cast<Map<String, dynamic>>() ?? [];
    final shared = ((data?['sharedPhotoIds'] as List?) ?? []).map((e) => e.toString()).toList();
    return Scaffold(
      appBar: AppBar(title: const Text('Partages')),
      body: data == null
          ? const Center(child: CircularProgressIndicator(color: remembaGold))
          : ListView(
              padding: const EdgeInsets.all(20),
              children: [
                const Text('Aucune photo ne change de propriétaire tant que vous n’acceptez pas.', style: TextStyle(color: remembaMuted)),
                const SizedBox(height: 12),
                Text('Reçues', style: serifStyle(size: 22)),
                ...incoming.map((row) => ListTile(
                      title: Text('${row['kind']} · ${row['status']}'),
                      subtitle: Text('${(row['fromUser'] as Map?)?['displayName'] ?? ''}'),
                      trailing: row['status'] == 'PENDING'
                          ? Wrap(children: [
                              TextButton(onPressed: () async { await widget.session.api.respondShare(row['id'] as String, true); await _load(); }, child: const Text('Accepter')),
                              TextButton(onPressed: () async { await widget.session.api.respondShare(row['id'] as String, false); await _load(); }, child: const Text('Refuser')),
                            ])
                          : null,
                    )),
                Text('Envoyées', style: serifStyle(size: 22)),
                ...outgoing.map((row) => ListTile(
                      title: Text('${row['kind']} · ${row['status']}'),
                      subtitle: Text('${(row['toUser'] as Map?)?['email'] ?? ''}'),
                    )),
                const SizedBox(height: 12),
                Text('Partagées avec moi', style: serifStyle(size: 22)),
                PhotoGrid(
                  api: widget.session.api,
                  ids: shared,
                  onTap: (id) => Navigator.push(context, MaterialPageRoute(builder: (_) => PhotoDetailScreen(session: widget.session, id: id))),
                ),
              ],
            ),
    );
  }
}

class VideosScreen extends StatefulWidget {
  const VideosScreen({super.key, required this.session});
  final SessionController session;
  @override
  State<VideosScreen> createState() => _VideosScreenState();
}

class _VideosScreenState extends State<VideosScreen> {
  List<Map<String, dynamic>> videos = [];
  List<Map<String, dynamic>> events = [];

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final v = await widget.session.api.videos();
    final e = await widget.session.api.events();
    setState(() {
      videos = (v['videos'] as List).cast<Map<String, dynamic>>();
      events = (e['events'] as List).cast<Map<String, dynamic>>();
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Vidéos')),
      body: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          const Text('Montage à partir des photos d’un événement. Musique générée en interne, pas de catalogue tiers.', style: TextStyle(color: remembaMuted)),
          const SizedBox(height: 12),
          ...events.where((e) => (e['mine'] ?? true) == true).map(
            (event) => ListTile(
              title: Text(event['name'] as String),
              subtitle: Text('${event['photoCount']} photo(s)'),
              trailing: GoldButton(
                label: 'Montage',
                onPressed: () async {
                  await widget.session.api.createVideo({'eventId': event['id'], 'style': 'recap', 'withMusic': true});
                  if (context.mounted) {
                    ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Rendu lancé sur le serveur…')));
                  }
                  await _load();
                },
              ),
            ),
          ),
          const SizedBox(height: 16),
          ...videos.map((video) => ListTile(
                title: Text('${video['style'] ?? 'recap'} · ${video['status']}'),
                subtitle: Text((video['event'] as Map?)?['name'] as String? ?? video['id'] as String),
              )),
        ],
      ),
    );
  }
}

class PublicEventsScreen extends StatefulWidget {
  const PublicEventsScreen({super.key, required this.session});
  final SessionController session;
  @override
  State<PublicEventsScreen> createState() => _PublicEventsScreenState();
}

class _PublicEventsScreenState extends State<PublicEventsScreen> {
  List<Map<String, dynamic>> events = [];
  final code = TextEditingController();

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final data = await widget.session.api.publicEvents();
    setState(() => events = (data['events'] as List).cast<Map<String, dynamic>>());
  }

  @override
  void dispose() {
    code.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Événements publics')),
      body: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          const Text('Rejoindre un événement public n’ouvre pas les photos. L’organisateur confirme, puis chaque partage reste une demande.', style: TextStyle(color: remembaMuted)),
          TextField(controller: code, decoration: const InputDecoration(labelText: 'Code d’accès')),
          const SizedBox(height: 8),
          GoldButton(
            label: 'Demander à rejoindre',
            onPressed: () async {
              await widget.session.api.joinPublic({'code': code.text.trim()});
              if (context.mounted) {
                ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Demande envoyée à l’organisateur.')));
              }
            },
          ),
          const SizedBox(height: 16),
          ...events.map(
            (event) => ListTile(
              title: Text(event['name'] as String),
              subtitle: Text('${event['organizer']} · ${event['locationText'] ?? 'lieu non précisé'}'),
              onTap: () async {
                await widget.session.api.joinPublic({'eventId': event['id']});
                if (context.mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Demande envoyée.')));
                }
              },
            ),
          ),
        ],
      ),
    );
  }
}
